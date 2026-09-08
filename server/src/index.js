import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import rulesRoutes from './routes/rulesRoutes.js';
import { db } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded assets
app.use('/uploads', express.static(UPLOADS_DIR));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: "HEALTHY",
    system: "Legal Metrology Compliance System API",
    regulatoryFramework: "Legal Metrology (Packaged Commodities) Rules, 2011",
    database: db.isMongo ? "MongoDB Atlas" : "Local File Store (JSON)",
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api', authRoutes);
app.use('/api', scanRoutes);
app.use('/api', complianceRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', rulesRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

// Connect to Database & Start Server
async function startServer() {
  await db.connect();
  app.listen(PORT, () => {
    console.log(`⚖️ Legal Metrology Compliance Server listening on port ${PORT}`);
  });
}

startServer();
