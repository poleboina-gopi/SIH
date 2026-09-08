import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { parsePackagingText } from '../services/parserService.js';

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
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const router = express.Router();

// POST /api/upload-image
router.post('/upload-image', upload.single('image'), (req, res) => {
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

// POST /api/process-ocr
// Accepts raw_text (extracted client-side or server-side) and runs field extraction
router.post('/process-ocr', (req, res) => {
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

// GET /api/scans
router.get('/scans', (req, res) => {
  const scans = db.getScans();
  const products = db.getProducts();
  const prodMap = new Map(products.map(p => [p.id, p]));

  const enriched = scans.map(s => ({
    ...s,
    product: prodMap.get(s.product_id) || null
  }));

  res.json({ scans: enriched });
});

// GET /api/scans/:id
router.get('/scans/:id', (req, res) => {
  const scan = db.getScanById(req.params.id);
  if (!scan) return res.status(404).json({ error: "Scan not found" });

  const product = db.getProductById(scan.product_id);
  const violations = db.getViolationsByScanId(scan.id);
  const report = db.getReportById(scan.id);

  res.json({
    scan,
    product,
    violations,
    report
  });
});

export default router;
