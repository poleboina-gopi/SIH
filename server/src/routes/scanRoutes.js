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
 * Cached persistent worker for high-speed Server-Side OCR (prevents 3-minute delays)
 */
let cachedWorker = null;
let workerInitPromise = null;

async function getOcrWorker() {
  if (cachedWorker) return cachedWorker;
  if (!workerInitPromise) {
    workerInitPromise = (async () => {
      console.log('⚡ Initializing persistent Server-Side Tesseract OCR Worker...');
      const worker = await createWorker('eng');
      cachedWorker = worker;
      console.log('✅ Persistent Server-Side OCR Worker ready.');
      return worker;
    })();
  }
  return workerInitPromise;
}

async function performServerOcr(imageFilePath) {
  try {
    const worker = await getOcrWorker();
    const ret = await worker.recognize(imageFilePath);
    return (ret.data.text || '').trim();
  } catch (err) {
    console.error(`OCR failed on ${imageFilePath}:`, err);
    // If worker had an issue, re-create once
    cachedWorker = null;
    workerInitPromise = null;
    const freshWorker = await getOcrWorker();
    const ret = await freshWorker.recognize(imageFilePath);
    return (ret.data.text || '').trim();
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
 * Uploads packaging images (single image or up to 5 multi-panel images at once),
 * performs high-speed Server-Side OCR in a single batch operation, parses all 14
 * mandatory FSSAI food packaging declarations, validates against EXCLUSIVELY the
 * 14 food safety rules, and generates an official compliance report immediately.
 */
router.post('/upload-and-validate', authenticateToken, requireInspector, upload.any(), async (req, res) => {
  try {
    const files = (req.files && req.files.length > 0) ? req.files : (req.file ? [req.file] : []);
    
    // Support base64 images if passed via body
    const base64List = Array.isArray(req.body.images_base64) 
      ? req.body.images_base64 
      : (req.body.image_base64 ? [req.body.image_base64] : []);

    if (files.length === 0 && base64List.length === 0 && !req.body.raw_text) {
      return res.status(400).json({ error: "No product packaging images provided for scanning and validation" });
    }

    const assignedInspectorId = req.user?.id || "usr_inspector_01";
    const assignedInspectorName = req.user?.name || "Food Safety Officer (FSO)";

    const panelTexts = [];
    const imageUrls = [];

    // 1. Process all uploaded multipart image files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageFilePath = path.join(UPLOADS_DIR, file.filename);
      imageUrls.push(`/uploads/${file.filename}`);
      console.log(`🔍 [${i + 1}/${files.length}] Scanning ${file.originalname || file.filename}...`);
      const txt = await performServerOcr(imageFilePath);
      if (txt) {
        panelTexts.push(`--- PANEL ${i + 1} (${file.originalname || 'IMAGE'}) ---\n${txt}`);
      }
    }

    // 2. Process any base64 images passed in JSON
    for (let j = 0; j < base64List.length; j++) {
      const b64 = base64List[j];
      const matches = typeof b64 === 'string' ? b64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/) : null;
      if (matches && matches[2]) {
        const ext = matches[1].includes('jpeg') ? '.jpg' : '.png';
        const fn = `scan_${Date.now()}_b64_${j}${ext}`;
        const fp = path.join(UPLOADS_DIR, fn);
        fs.writeFileSync(fp, Buffer.from(matches[2], 'base64'));
        imageUrls.push(`/uploads/${fn}`);
        console.log(`🔍 [Base64 ${j + 1}/${base64List.length}] Scanning ${fn}...`);
        const txt = await performServerOcr(fp);
        if (txt) {
          panelTexts.push(`--- BASE64 PANEL ${j + 1} ---\n${txt}`);
        }
      }
    }

    const extractedText = panelTexts.join('\n\n') || req.body.raw_text || '';

    // 3. Parse text into the 14 FSSAI statutory declarations
    const parsed = parsePackagingText(extractedText);

    // 4. Evaluate compliance against ONLY the 14 rules
    const allRules = await db.getRules();
    const activeRules = allRules.filter(r => r.isActive !== false);
    const evaluation = evaluateCompliance(parsed, activeRules);

    // 5. Save Product
    const productId = `prod_${Date.now()}`;
    const product = {
      id: productId,
      product_name: req.body.product_name || parsed.commodity_name || "Pre-packaged Food",
      brand: req.body.brand || parsed.manufacturer?.name || "Packer / Brand",
      category: req.body.category || "Food & Beverages",
      image_url: imageUrls[0] || "/uploads/sample_placeholder.png",
      image_urls: imageUrls,
      uploaded_by: assignedInspectorId,
      created_at: new Date().toISOString()
    };
    const savedProduct = await db.addProduct(product);

    // 6. Save Scan
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

    // 7. Save Violations
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

    // 8. Save Report
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
      message: `Batch scanned ${imageUrls.length} packaging image(s) & validated all 14 FSSAI rules`,
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
