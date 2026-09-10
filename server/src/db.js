import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { STATUTORY_RULES } from './rules/metrologyRules.js';
import { UserModel } from './models/User.js';
import { ProductModel } from './models/Product.js';
import { ScanModel } from './models/Scan.js';
import { ViolationModel } from './models/Violation.js';
import { ReportModel } from './models/Report.js';
import { RuleModel } from './models/Rule.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Bcrypt hash for seed accounts (Fast Salt rounds: 6)
const SEED_PASSWORD_INSPECTOR = bcrypt.hashSync("Inspector@2026!", 6);
const SEED_PASSWORD_ADMIN = bcrypt.hashSync("Admin@2026!", 6);

export const DEFAULT_DB = {
  users: [
    {
      id: "usr_inspector_01",
      firstName: "R. K.",
      lastName: "Sharma",
      name: "R. K. Sharma",
      designation: "Food Safety Officer (FSO)",
      email: "inspector@gov.in",
      phone: "+91 98765 43210",
      password: SEED_PASSWORD_INSPECTOR,
      role: "inspector",
      badgeNumber: "FSSAI-DEL-2024-890",
      department: "Food Safety and Standards Authority of India (FSSAI)"
    },
    {
      id: "usr_admin_01",
      firstName: "Dr. S.",
      lastName: "Mukherjee",
      name: "Dr. S. Mukherjee",
      designation: "Designated Officer / Joint Commissioner",
      email: "admin@gov.in",
      phone: "+91 98111 22233",
      password: SEED_PASSWORD_ADMIN,
      role: "admin",
      badgeNumber: "FSSAI-HQ-9901",
      department: "Food Safety and Standards Authority of India (FSSAI)"
    }
  ],
  products: [],
  scans: [],
  violations: [],
  reports: [],
  rules: STATUTORY_RULES
};

// Helper: Normalize phone numbers to 10 digits for comparison
export function normalizePhone(phone = "") {
  return phone.replace(/\D/g, '').slice(-10);
}

class Database {
  constructor() {
    this.data = null;
    this.isMongo = false;
    this.usersCache = new Map();
    this.loadLocal();
    this.syncUsersCache();
  }

  loadLocal() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure database rules strictly match the 14 FSSAI Food Safety Rules
        if (!this.data.rules || !this.data.rules.some(r => r.id === 'RULE_FSSAI_01') || this.data.rules.length !== 14) {
          console.log("🔄 Updating database rules to the 14 mandatory FSSAI food packaging rules...");
          this.data.rules = JSON.parse(JSON.stringify(STATUTORY_RULES));
          this.saveLocal();
        }
      } else {
        this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
        this.saveLocal();
      }
    } catch (err) {
      this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
      this.saveLocal();
    }
  }

  saveLocal() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error("Error saving local database:", err);
    }
  }

  cacheUser(u) {
    if (!u) return;
    if (u.id) this.usersCache.set(u.id.toLowerCase(), u);
    if (u.email) this.usersCache.set(u.email.toLowerCase(), u);
    if (u.phone) {
      const norm = normalizePhone(u.phone);
      if (norm) this.usersCache.set(norm, u);
    }
    if (u.badgeNumber) this.usersCache.set(u.badgeNumber.toLowerCase(), u);
    if (u.role && !this.usersCache.has(u.role.toLowerCase())) {
      this.usersCache.set(u.role.toLowerCase(), u);
    }
  }

  async syncUsersCache() {
    try {
      if (this.isMongo) {
        const users = await UserModel.find().lean();
        users.forEach(u => this.cacheUser(u));
      } else if (this.data?.users) {
        this.data.users.forEach(u => this.cacheUser(u));
      }
    } catch {
      if (this.data?.users) {
        this.data.users.forEach(u => this.cacheUser(u));
      }
    }
  }

  async connect() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (mongoUri) {
      try {
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000
        });
        this.isMongo = true;
        console.log("🍃 Successfully connected to MongoDB Atlas!");
        await this.seedMongoIfEmpty();
        await this.syncUsersCache();
      } catch (err) {
        console.error("⚠️ Failed to connect to MongoDB Atlas, falling back to local file store:", err.message);
        this.isMongo = false;
        await this.syncUsersCache();
      }
    } else {
      console.log("📁 MONGODB_URI not provided. Running in local file-store mode (db.json).");
      this.isMongo = false;
      await this.syncUsersCache();
    }
  }

  async seedMongoIfEmpty() {
    try {
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        console.log("🌱 Seeding MongoDB Atlas with initial legal metrology records...");
        await UserModel.insertMany(DEFAULT_DB.users);
        await ProductModel.insertMany(DEFAULT_DB.products);
        await ScanModel.insertMany(DEFAULT_DB.scans);
        await ViolationModel.insertMany(DEFAULT_DB.violations);
        await ReportModel.insertMany(DEFAULT_DB.reports);
        await RuleModel.insertMany(DEFAULT_DB.rules);
        console.log("✅ MongoDB Atlas seeding complete!");
      }
    } catch (err) {
      console.error("MongoDB seed error:", err.message);
    }
  }

  // Users (Ultra-Fast 0ms In-Memory Cache with Storage Fallback)
  async getUserByEmail(email) {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    if (this.usersCache.has(clean)) return this.usersCache.get(clean);

    if (this.isMongo) {
      const u = await UserModel.findOne({ email: clean }).lean();
      if (u) this.cacheUser(u);
      return u;
    }
    const u = this.data.users.find(x => x.email?.toLowerCase() === clean);
    if (u) this.cacheUser(u);
    return u;
  }

  async getUserByPhone(phone) {
    const norm = normalizePhone(phone);
    if (norm && this.usersCache.has(norm)) return this.usersCache.get(norm);

    if (this.isMongo) {
      const byPhone = await UserModel.findOne({ phone: { $regex: norm } }).lean();
      if (byPhone) {
        this.cacheUser(byPhone);
        return byPhone;
      }
      const all = await UserModel.find().lean();
      const found = all.find(u => normalizePhone(u.phone) === norm);
      if (found) this.cacheUser(found);
      return found;
    }
    const found = this.data.users.find(u => normalizePhone(u.phone) === norm);
    if (found) this.cacheUser(found);
    return found;
  }

  async getUserByEmailOrPhone(identifier) {
    if (!identifier) return null;
    const cleaned = identifier.trim();
    const cleanedLower = cleaned.toLowerCase();
    const norm = normalizePhone(cleaned);

    // ⚡ 1. Ultra-Fast In-Memory Cache Lookup (0ms!)
    if (this.usersCache.has(cleanedLower)) {
      return this.usersCache.get(cleanedLower);
    }
    if (norm.length === 10 && this.usersCache.has(norm)) {
      return this.usersCache.get(norm);
    }

    // 2. Database lookup
    let user = null;
    if (this.isMongo) {
      const isEmail = cleaned.includes('@');
      if (isEmail) {
        user = await UserModel.findOne({ email: cleanedLower }).lean();
      } else if (norm.length === 10) {
        user = await UserModel.findOne({ phone: { $regex: norm } }).lean();
      }
      if (!user) {
        user = await UserModel.findOne({
          $or: [
            { id: cleaned },
            { badgeNumber: cleaned },
            { role: cleanedLower }
          ]
        }).lean();
      }
      if (user) {
        this.cacheUser(user);
        return user;
      }
    }

    // 3. Local file-store (JSON)
    const isEmail = cleaned.includes('@');
    if (isEmail) {
      user = this.data.users.find(u => u.email?.toLowerCase() === cleanedLower) || null;
    } else if (norm.length === 10) {
      user = this.data.users.find(u => normalizePhone(u.phone) === norm) || null;
    }
    if (!user) {
      user = this.data.users.find(u => 
        u.id?.toLowerCase() === cleanedLower || 
        u.badgeNumber?.toLowerCase() === cleanedLower || 
        u.role?.toLowerCase() === cleanedLower
      ) || null;
    }

    if (user) {
      this.cacheUser(user);
    }
    return user;
  }

  async getUserById(id) {
    if (!id) return null;
    const clean = id.toLowerCase().trim();
    if (this.usersCache.has(clean)) return this.usersCache.get(clean);

    if (this.isMongo) {
      const u = await UserModel.findOne({ id }).lean();
      if (u) this.cacheUser(u);
      return u;
    }
    const u = this.data.users.find(x => x.id === id);
    if (u) this.cacheUser(u);
    return u;
  }

  async addUser(user) {
    // ⚡ 1. Immediately cache in memory for 0ms subsequent lookup
    this.cacheUser(user);

    if (this.isMongo) {
      const created = await UserModel.create(user);
      const obj = created.toObject();
      this.cacheUser(obj);
      return obj;
    }
    this.data.users.push(user);
    this.saveLocal();
    return user;
  }

  async getUsers() {
    if (this.isMongo) {
      return await UserModel.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();
    }
    return this.data.users.map(({ password: _, ...safeUser }) => safeUser);
  }

  async updateUserRole(id, role) {
    if (this.isMongo) {
      return await UserModel.findOneAndUpdate(
        { id },
        { $set: { role } },
        { new: true, projection: { password: 0 } }
      ).lean();
    }
    const user = this.data.users.find(u => u.id === id);
    if (user) {
      user.role = role;
      this.saveLocal();
      const { password: _, ...safeUser } = user;
      return safeUser;
    }
    return null;
  }

  // Products
  async getProducts() {
    if (this.isMongo) {
      return await ProductModel.find().sort({ created_at: -1 }).lean();
    }
    return [...this.data.products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async getProductById(id) {
    if (this.isMongo) {
      return await ProductModel.findOne({ id }).lean();
    }
    return this.data.products.find(p => p.id === id);
  }

  async addProduct(product) {
    if (this.isMongo) {
      const created = await ProductModel.create(product);
      return created.toObject();
    }
    this.data.products.unshift(product);
    this.saveLocal();
    return product;
  }

  // Scans
  async getScans() {
    if (this.isMongo) {
      return await ScanModel.find().sort({ created_at: -1 }).lean();
    }
    return [...this.data.scans].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async getScanById(id) {
    if (this.isMongo) {
      return await ScanModel.findOne({ id }).lean();
    }
    return this.data.scans.find(s => s.id === id);
  }

  async addScan(scan) {
    if (this.isMongo) {
      const created = await ScanModel.create(scan);
      return created.toObject();
    }
    this.data.scans.unshift(scan);
    this.saveLocal();
    return scan;
  }

  // Violations
  async getViolations() {
    if (this.isMongo) {
      return await ViolationModel.find().lean();
    }
    return this.data.violations;
  }

  async getViolationsByScanId(scanId) {
    if (this.isMongo) {
      return await ViolationModel.find({ scan_id: scanId }).lean();
    }
    return this.data.violations.filter(v => v.scan_id === scanId);
  }

  async addViolation(violation) {
    if (this.isMongo) {
      const created = await ViolationModel.create(violation);
      return created.toObject();
    }
    this.data.violations.push(violation);
    this.saveLocal();
    return violation;
  }

  // Reports
  async getReports() {
    if (this.isMongo) {
      return await ReportModel.find().sort({ generated_at: -1 }).lean();
    }
    return [...this.data.reports].sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));
  }

  async getReportById(id) {
    if (this.isMongo) {
      return await ReportModel.findOne({ $or: [{ id }, { scan_id: id }] }).lean();
    }
    return this.data.reports.find(r => r.id === id || r.scan_id === id);
  }

  async addReport(report) {
    if (this.isMongo) {
      const created = await ReportModel.create(report);
      return created.toObject();
    }
    this.data.reports.unshift(report);
    this.saveLocal();
    return report;
  }

  // Rules
  async getRules() {
    if (this.isMongo) {
      const rules = await RuleModel.find().lean();
      if (rules.length > 0) return rules;
    }
    return this.data.rules;
  }

  async updateRule(id, updates) {
    if (this.isMongo) {
      return await RuleModel.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
    }
    const idx = this.data.rules.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.rules[idx] = { ...this.data.rules[idx], ...updates };
      this.saveLocal();
      return this.data.rules[idx];
    }
    return null;
  }

  async deleteScan(scanId) {
    const scan = await this.getScanById(scanId);
    if (!scan) return null;

    let product = null;
    if (scan.product_id) {
      product = await this.getProductById(scan.product_id);
    }

    if (this.isMongo) {
      // 1. Delete scan document
      await ScanModel.deleteOne({ id: scanId });
      // 2. Delete all violations logged for this scan
      await ViolationModel.deleteMany({ scan_id: scanId });
      // 3. Delete report for this scan
      await ReportModel.deleteMany({ $or: [{ scan_id: scanId }, { id: scanId }] });
      // 4. Delete product if no other scan references it
      if (scan.product_id) {
        const remainingScansForProd = await ScanModel.countDocuments({ product_id: scan.product_id });
        if (remainingScansForProd === 0) {
          await ProductModel.deleteOne({ id: scan.product_id });
        }
      }
    } else {
      this.data.scans = this.data.scans.filter(s => s.id !== scanId);
      this.data.violations = this.data.violations.filter(v => v.scan_id !== scanId);
      this.data.reports = this.data.reports.filter(r => r.scan_id !== scanId && r.id !== scanId);
      if (scan.product_id) {
        const hasOtherScans = this.data.scans.some(s => s.product_id === scan.product_id);
        if (!hasOtherScans) {
          this.data.products = this.data.products.filter(p => p.id !== scan.product_id);
        }
      }
      this.saveLocal();
    }

    return { scan, product };
  }
}

export const db = new Database();
