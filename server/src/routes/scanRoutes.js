import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createWorker } from 'tesseract.js';
import { db } from '../db.js';
import { parsePackagingText } from '../services/parserService.js';
import { evaluateCompliance } from '../services/complianceEngine.js';
import { authenticateToken, requireInspector } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `scan_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const router = express.Router();

/**
 * Helper to run server-side OCR on an image file using tesseract.js
 */
async function performServerOcr(imageFilePath) {
  let worker = null;
  try {
    worker = await createWorker('eng');
    const ret = await worker.recognize(imageFilePath);
    return (ret.data.text || '').trim();
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

// POST /api/upload-image (Upload product image only)
router.post('/upload-image', authenticateToken, requireInspector, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({
    message: "Image uploaded successfully",
    image_url: imageUrl,
    filename: req.file.filename,
    size: req.file.size
  });
});

/**
 * POST /api/upload-and-validate
 * Uploads a product packaging image, performs Server-Side OCR via Tesseract,
 * parses all 14 mandatory FSSAI food packaging declarations, validates against
 * EXCLUSIVELY the 14 food safety rules, and generates an official report.
 */
router.post('/upload-and-validate', authenticateToken, requireInspector, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No product image file provided for OCR and validation" });
    }

    const imageFilePath = path.join(UPLOADS_DIR, req.file.filename);
    const imageUrl = `/uploads/${req.file.filename}`;
    const assignedInspectorId = req.user?.id || "usr_inspector_01";
    const assignedInspectorName = req.user?.name || "Food Safety Officer (FSO)";

    // 1. Perform Server-Side OCR
    console.log(`🔍 Running Server-Side OCR on ${req.file.filename}...`);
    const extractedText = await performServerOcr(imageFilePath);

    // 2. Parse text into the 14 FSSAI statutory declarations
    const parsed = parsePackagingText(extractedText);

    // 3. Evaluate compliance against ONLY the 14 rules
    const allRules = await db.getRules();
    const activeRules = allRules.filter(r => r.isActive !== false);
    const evaluation = evaluateCompliance(parsed, activeRules);

    // 4. Save Product
    const productId = `prod_${Date.now()}`;
    const product = {
      id: productId,
      product_name: req.body.product_name || parsed.commodity_name || "Pre-packaged Food",
      brand: req.body.brand || parsed.manufacturer?.name || "Packer / Brand",
      category: req.body.category || "Food & Beverages",
      image_url: imageUrl,
      uploaded_by: assignedInspectorId,
      created_at: new Date().toISOString()
    };
    const savedProduct = await db.addProduct(product);

    // 5. Save Scan
    const scanId = `scan_${Date.now()}`;
    const scan = {
      id: scanId,
      product_id: productId,
      extracted_text: extractedText,
      parsed_fields: parsed,
      compliance_status: evaluation.compliance_status,
      compliance_score: evaluation.compliance_score,
      inspector_id: assignedInspectorId,
      created_at: new Date().toISOString()
    };
    const savedScan = await db.addScan(scan);

    // 6. Save Violations
    const savedViolations = [];
    for (const v of evaluation.violations) {
      const violationRecord = {
        id: `viol_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        scan_id: scanId,
        rule_code: v.rule_code,
        violation_type: v.violation_type,
        severity: v.severity,
        description: v.description,
        statutory_provision: v.statutory_provision,
        suggested_action: v.suggested_action,
        penalty_fine: v.penalty_fine || "₹1,00,000",
        field: v.field,
        created_at: new Date().toISOString()
      };
      const sv = await db.addViolation(violationRecord);
      savedViolations.push(sv);
    }

    // 7. Save Report
    const reportId = `rep_${Date.now()}`;
    const reportNumber = `FSSAI/REP/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const report = {
      id: reportId,
      scan_id: scanId,
      report_number: reportNumber,
      status: evaluation.compliance_status,
      score: evaluation.compliance_score,
      inspector_id: assignedInspectorId,
      inspector_name: assignedInspectorName,
      statutory_notice: evaluation.statutory_notice,
      rule_checks_matrix: evaluation.rule_checks_matrix,
      rule_checks_summary: evaluation.rule_checks_summary,
      generated_at: new Date().toISOString()
    };
    const savedReport = await db.addReport(report);

    res.json({
      success: true,
      message: "OCR and FSSAI 14-point compliance validation completed successfully",
      report_id: reportId,
      ocr_extracted_text: extractedText,
      parsed_declarations: parsed,
      rule_checks_matrix: evaluation.rule_checks_matrix,
      evaluation,
      report: savedReport,
      scan: savedScan,
      product: savedProduct,
      violations: savedViolations
    });
  } catch (err) {
    console.error("Server upload and validation error:", err);
    res.status(500).json({ error: err.message || "Failed to process image OCR and validate rules" });
  }
});

// POST /api/process-ocr (Parse raw OCR text into the 14 statutory fields)
router.post('/process-ocr', authenticateToken, requireInspector, (req, res) => {
  const { raw_text, image_url, product_name, brand, category } = req.body;

  if (!raw_text || typeof raw_text !== 'string') {
    return res.status(400).json({ error: "raw_text string is required" });
  }

  const parsedFields = parsePackagingText(raw_text);

  res.json({
    success: true,
    raw_text,
    parsed_fields: parsedFields,
    product_metadata: {
      product_name: product_name || parsedFields.commodity_name,
      brand: brand || parsedFields.manufacturer?.name || "Unknown Brand",
      category: category || "Food & Beverages",
      image_url: image_url || null
    }
  });
});

// GET /api/scans (Secured: Authenticated Officers)
router.get('/scans', authenticateToken, async (req, res) => {
  try {
    const scans = await db.getScans();
    const products = await db.getProducts();
    const prodMap = new Map(products.map(p => [p.id, p]));

    const enriched = scans.map(s => ({
      ...s,
      product: prodMap.get(s.product_id) || null
    }));

    res.json({ scans: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load scans" });
  }
});

// GET /api/scans/:id (Secured: Authenticated Officers)
router.get('/scans/:id', authenticateToken, async (req, res) => {
  try {
    const scan = await db.getScanById(req.params.id);
    if (!scan) return res.status(404).json({ error: "Scan not found" });

    const product = await db.getProductById(scan.product_id);
    const violations = await db.getViolationsByScanId(scan.id);
    const report = await db.getReportById(scan.id);

    res.json({
      scan,
      product,
      violations,
      report
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load scan" });
  }
});

// DELETE /api/scan/:id (Secured: ADMIN or Creator INSPECTOR only)
router.delete('/scan/:id', authenticateToken, async (req, res) => {
  try {
    const scanId = req.params.id;
    const scan = await db.getScanById(scanId);

    if (!scan) {
      return res.status(404).json({ error: "Inspection scan record not found" });
    }

    const isOwnerInspector = req.user.role === 'inspector' && (scan.inspector_id === req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwnerInspector) {
      return res.status(403).json({ 
        error: "Access Denied: Only the creator Inspector or Admin can delete this inspection record." 
      });
    }

    const deleted = await db.deleteScan(scanId);

    if (deleted?.product?.image_url) {
      const imgUrl = deleted.product.image_url;
      const isDefaultSample = imgUrl.includes('sample') || imgUrl.includes('butter') || imgUrl.includes('detergent') || imgUrl.includes('imported');
      if (imgUrl.startsWith('/uploads/') && !isDefaultSample) {
        const filePath = path.join(UPLOADS_DIR, path.basename(imgUrl));
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.warn("Could not remove file on disk:", e.message);
          }
        }
      }
    }

    res.json({
      success: true,
      message: "Inspection record, statutory report, and associated declarations deleted successfully",
      deleted_scan_id: scanId
    });
  } catch (err) {
    console.error("Delete scan error:", err);
    res.status(500).json({ error: err.message || "Failed to delete inspection scan" });
  }
});

export default router;
