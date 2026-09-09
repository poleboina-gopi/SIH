import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { parsePackagingText } from '../services/parserService.js';
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

// POST /api/upload-image (Secured: Sworn Inspectors Only)
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

// POST /api/process-ocr (Secured: Sworn Inspectors Only)
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
      category: category || "General FMCG",
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

    // Security Check:
    // Only ADMIN or the specific INSPECTOR who performed the inspection can delete it
    const isOwnerInspector = req.user.role === 'inspector' && (scan.inspector_id === req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isOwnerInspector) {
      return res.status(403).json({ 
        error: "Access Denied: Only the creator Inspector or a Joint Controller (Admin) can delete this inspection record." 
      });
    }

    // Delete DB records
    const deleted = await db.deleteScan(scanId);

    // Delete physical uploaded image file if local and not a seed sample asset
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
