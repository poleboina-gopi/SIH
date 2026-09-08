import express from 'express';
import { db } from '../db.js';
import { evaluateCompliance } from '../services/complianceEngine.js';
import { parsePackagingText } from '../services/parserService.js';

const router = express.Router();

// POST /api/validate
router.post('/validate', (req, res) => {
  const {
    product_name,
    brand,
    category,
    image_url,
    raw_text,
    parsed_fields: clientParsedFields,
    inspector_id = "usr_inspector_01",
    inspector_name = "R. K. Sharma"
  } = req.body;

  if (!raw_text && !clientParsedFields) {
    return res.status(400).json({ error: "raw_text or parsed_fields is required" });
  }

  // Parse text if parsed fields not fully provided
  const parsed = clientParsedFields || parsePackagingText(raw_text);

  // Active rules from DB
  const activeRules = db.getRules().filter(r => r.isActive !== false);

  // Evaluate Compliance
  const evaluation = evaluateCompliance(parsed, activeRules);

  // Create Product in DB
  const productId = `prod_${Date.now()}`;
  const product = {
    id: productId,
    product_name: product_name || parsed.commodity_name || "Inspected Commodity",
    brand: brand || parsed.manufacturer?.name || "Unbranded / Local",
    category: category || "Packaged Commodity",
    image_url: image_url || "/uploads/sample_placeholder.png",
    uploaded_by: inspector_id,
    created_at: new Date().toISOString()
  };
  db.addProduct(product);

  // Create Scan record in DB
  const scanId = `scan_${Date.now()}`;
  const scan = {
    id: scanId,
    product_id: productId,
    extracted_text: raw_text || JSON.stringify(parsed),
    parsed_fields: parsed,
    compliance_status: evaluation.compliance_status,
    compliance_score: evaluation.compliance_score,
    inspector_id,
    created_at: new Date().toISOString()
  };
  db.addScan(scan);

  // Add Violations to DB
  const savedViolations = [];
  for (const v of evaluation.violations) {
    const violationRecord = {
      id: `viol_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      scan_id: scanId,
      ...v
    };
    db.addViolation(violationRecord);
    savedViolations.push(violationRecord);
  }

  // Create Report record in DB
  const reportId = `rep_${Date.now()}`;
  const reportNumber = `LMCR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const report = {
    id: reportId,
    scan_id: scanId,
    report_number: reportNumber,
    product_id: productId,
    status: evaluation.compliance_status,
    score: evaluation.compliance_score,
    inspector_name,
    generated_at: new Date().toISOString(),
    rule_checks_summary: evaluation.rule_checks_summary,
    statutory_notice: evaluation.statutory_notice
  };
  db.addReport(report);

  res.status(201).json({
    success: true,
    report_id: reportId,
    report,
    scan,
    product,
    violations: savedViolations,
    evaluation
  });
});

// GET /api/report/:id
router.get('/report/:id', (req, res) => {
  const report = db.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  const scan = db.getScanById(report.scan_id);
  const product = scan ? db.getProductById(scan.product_id) : null;
  const violations = scan ? db.getViolationsByScanId(scan.id) : [];

  res.json({
    report,
    scan,
    product,
    violations
  });
});

// GET /api/reports
router.get('/reports', (req, res) => {
  const reports = db.getReports();
  const scans = db.getScans();
  const products = db.getProducts();

  const scanMap = new Map(scans.map(s => [s.id, s]));
  const prodMap = new Map(products.map(p => [p.id, p]));

  const enriched = reports.map(r => {
    const scan = scanMap.get(r.scan_id);
    const product = scan ? prodMap.get(scan.product_id) : null;
    const violations = scan ? db.getViolationsByScanId(scan.id) : [];
    return {
      ...r,
      product_name: product?.product_name || "Unknown Commodity",
      brand: product?.brand || "Unknown Brand",
      image_url: product?.image_url || null,
      violations_count: violations.length
    };
  });

  res.json({ reports: enriched });
});

// GET /api/export/:id/:format
router.get('/export/:id/:format', (req, res) => {
  const { id, format } = req.params;
  const report = db.getReportById(id);
  if (!report) return res.status(404).json({ error: "Report not found" });

  const scan = db.getScanById(report.scan_id);
  const product = scan ? db.getProductById(scan.product_id) : null;
  const violations = scan ? db.getViolationsByScanId(scan.id) : [];

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
    // Generate CSV lines
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

  // JSON export
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${report.report_number}.json"`);
  res.json(fullData);
});

export default router;
