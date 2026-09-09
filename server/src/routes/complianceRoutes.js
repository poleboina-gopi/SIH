import express from 'express';
import { db } from '../db.js';
import { evaluateCompliance } from '../services/complianceEngine.js';
import { parsePackagingText } from '../services/parserService.js';
import { authenticateToken, requireInspector } from '../middleware/auth.js';
import { generateCompliancePdf } from '../services/pdfService.js';

const router = express.Router();

// POST /api/validate (Secured: Sworn Inspectors Only)
router.post('/validate', authenticateToken, requireInspector, async (req, res) => {
  try {
    const {
      product_name,
      brand,
      category,
      image_url,
      raw_text,
      parsed_fields: clientParsedFields,
      inspector_id,
      inspector_name
    } = req.body;

    const assignedInspectorId = req.user?.id || inspector_id || "usr_inspector_01";
    const assignedInspectorName = req.user?.name || inspector_name || "Legal Metrology Officer";

    if (!raw_text && !clientParsedFields) {
      return res.status(400).json({ error: "raw_text or parsed_fields is required" });
    }

    const parsed = clientParsedFields || parsePackagingText(raw_text);
    const allRules = await db.getRules();
    const activeRules = allRules.filter(r => r.isActive !== false);

    const evaluation = evaluateCompliance(parsed, activeRules);

    const productId = `prod_${Date.now()}`;
    const product = {
      id: productId,
      product_name: product_name || parsed.commodity_name || "Inspected Commodity",
      brand: brand || parsed.manufacturer?.name || "Unbranded / Local",
      category: category || "Packaged Commodity",
      image_url: image_url || "/uploads/sample_placeholder.png",
      uploaded_by: assignedInspectorId,
      created_at: new Date().toISOString()
    };
    const savedProduct = await db.addProduct(product);

    const scanId = `scan_${Date.now()}`;
    const scan = {
      id: scanId,
      product_id: productId,
      extracted_text: raw_text || JSON.stringify(parsed),
      parsed_fields: parsed,
      compliance_status: evaluation.compliance_status,
      compliance_score: evaluation.compliance_score,
      inspector_id: assignedInspectorId,
      created_at: new Date().toISOString()
    };
    const savedScan = await db.addScan(scan);

    const savedViolations = [];
    for (const v of evaluation.violations) {
      const violationRecord = {
        id: `viol_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        scan_id: scanId,
        rule_code: v.rule_code,
        violation_type: v.violation_type,
        severity: v.severity,
        description: v.description,
        statutory_provision: v.statutory_provision || "Rule 6 of Legal Metrology (PC) Rules, 2011",
        suggested_action: v.suggested_action || v.statutory_remedy || "Rectify declaration",
        penalty_fine: v.penalty_fine || "₹25,000",
        field: v.field,
        created_at: new Date().toISOString()
      };
      const sv = await db.addViolation(violationRecord);
      savedViolations.push(sv);
    }

    const reportId = `rep_${Date.now()}`;
    const reportNumber = `CLM/DEL/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const report = {
      id: reportId,
      scan_id: scanId,
      report_number: reportNumber,
      status: evaluation.compliance_status,
      score: evaluation.compliance_score,
      inspector_id: assignedInspectorId,
      inspector_name: assignedInspectorName,
      statutory_notice: evaluation.compliance_status === "NON_COMPLIANT" ? (evaluation.statutory_notice || evaluation.show_cause_notice) : null,
      generated_at: new Date().toISOString()
    };
    const savedReport = await db.addReport(report);

    res.json({
      success: true,
      report_id: reportId,
      report: savedReport,
      scan: savedScan,
      product: savedProduct,
      violations: savedViolations,
      evaluation
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Validation failed" });
  }
});

// GET /api/report/:id (Secured: Authenticated Officers)
router.get('/report/:id', authenticateToken, async (req, res) => {
  try {
    const report = await db.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const scan = await db.getScanById(report.scan_id);
    const product = scan ? await db.getProductById(scan.product_id) : null;
    const violations = scan ? await db.getViolationsByScanId(scan.id) : [];

    res.json({
      report,
      scan,
      product,
      violations
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load report" });
  }
});

// GET /api/report/:id/pdf (Downloadable Official Legal Metrology Certificate PDF)
router.get('/report/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const report = await db.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const scan = await db.getScanById(report.scan_id);
    const product = scan ? await db.getProductById(scan.product_id) : null;
    const violations = scan ? await db.getViolationsByScanId(scan.id) : [];

    const safeNumber = (report.report_number || report.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Legal_Metrology_Report_${safeNumber}.pdf"`);

    generateCompliancePdf({ report, scan, product, violations }, res);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate PDF report" });
  }
});

// GET /api/reports (Secured: Authenticated Officers)
router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const reports = await db.getReports();
    const scans = await db.getScans();
    const products = await db.getProducts();

    const scanMap = new Map(scans.map(s => [s.id, s]));
    const prodMap = new Map(products.map(p => [p.id, p]));

    const enriched = await Promise.all(reports.map(async (r) => {
      const scan = scanMap.get(r.scan_id);
      const product = scan ? prodMap.get(scan.product_id) : null;
      const violations = scan ? await db.getViolationsByScanId(scan.id) : [];
      return {
        ...r,
        product_name: product?.product_name || "Unknown Commodity",
        brand: product?.brand || "Unknown Brand",
        image_url: product?.image_url || null,
        violations_count: violations.length
      };
    }));

    res.json({ reports: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load reports" });
  }
});

// GET /api/export/:id/:format (Secured: Authenticated Officers)
router.get('/export/:id/:format', authenticateToken, async (req, res) => {
  try {
    const { id, format } = req.params;
    const report = await db.getReportById(id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    const scan = await db.getScanById(report.scan_id);
    const product = scan ? await db.getProductById(scan.product_id) : null;
    const violations = scan ? await db.getViolationsByScanId(scan.id) : [];

    const fullData = {
      report_number: report.report_number,
      generated_at: report.generated_at,
      status: report.status,
      score: report.score,
      inspector: report.inspector_name,
      product: product?.product_name,
      brand: product?.brand,
      declarations_extracted: scan?.parsed_fields,
      violations,
      statutory_notice: report.statutory_notice
    };

    if (format === 'csv') {
      const headers = ["Report_Number", "Date", "Status", "Product", "Brand", "Violations_Count", "Rule_Violations", "Penalty_Fine"];
      const row = [
        report.report_number,
        report.generated_at,
        report.status,
        `"${product?.product_name || ''}"`,
        `"${product?.brand || ''}"`,
        violations.length,
        `"${violations.map(v => v.rule_code).join('; ')}"`,
        `"${report.statutory_notice ? report.statutory_notice.compoundingFeeProposed : '₹0'}"`
      ];
      const csvContent = `${headers.join(',')}\n${row.join(',')}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${report.report_number}.csv"`);
      return res.send(csvContent);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${report.report_number}.json"`);
    res.json(fullData);
  } catch (err) {
    res.status(500).json({ error: err.message || "Export failed" });
  }
});

export default router;
