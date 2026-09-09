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

// Bcrypt hash for seed accounts (Salt rounds: 12)
const SEED_PASSWORD_INSPECTOR = bcrypt.hashSync("Inspector@2026!", 12);
const SEED_PASSWORD_ADMIN = bcrypt.hashSync("Admin@2026!", 12);

export const DEFAULT_DB = {
  users: [
    {
      id: "usr_inspector_01",
      firstName: "R. K.",
      lastName: "Sharma",
      name: "R. K. Sharma",
      designation: "Legal Metrology Officer (Zonal)",
      email: "inspector@gov.in",
      phone: "+91 98765 43210",
      password: SEED_PASSWORD_INSPECTOR,
      role: "inspector",
      badgeNumber: "LM-DEL-2024-890",
      department: "Directorate of Legal Metrology, Delhi Circle"
    },
    {
      id: "usr_admin_01",
      firstName: "Dr. S.",
      lastName: "Mukherjee",
      name: "Dr. S. Mukherjee",
      designation: "Joint Controller, Legal Metrology",
      email: "admin@gov.in",
      phone: "+91 98111 22233",
      password: SEED_PASSWORD_ADMIN,
      role: "admin",
      badgeNumber: "LM-HQ-9901",
      department: "Department of Consumer Affairs, MoCA"
    }
  ],
  products: [
    {
      id: "prod_001",
      product_name: "Amul Pure Pasteurised Butter 100g",
      brand: "Amul",
      category: "Dairy & Food",
      image_url: "/uploads/butter_sample.png",
      uploaded_by: "usr_inspector_01",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: "prod_002",
      product_name: "SuperClean Detergent Powder 500gms",
      brand: "SuperClean Chemicals Ltd.",
      category: "Household & Cleaning",
      image_url: "/uploads/detergent_sample.png",
      uploaded_by: "usr_inspector_01",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: "prod_003",
      product_name: "Alpina Swiss Dark Truffles 150g",
      brand: "Alpina Confiserie AG",
      category: "Confectionery (Imported)",
      image_url: "/uploads/imported_sample.png",
      uploaded_by: "usr_inspector_01",
      created_at: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ],
  scans: [
    {
      id: "scan_001",
      product_id: "prod_001",
      extracted_text: "AMUL PASTEURISED BUTTER\\nNet Qty: 100 g\\nMfd. By: Gujarat Cooperative Milk Marketing Federation Ltd., Anand - 388001, Gujarat.\\nPkd: 08/2024\\nMRP Rs. 58.00 (inclusive of all taxes)\\nFor feedback/queries, email: customercare@amul.coop, Call: 1800-258-3333, Anand, Gujarat.\\nCountry of Origin: India",
      parsed_fields: {
        manufacturer: "Gujarat Cooperative Milk Marketing Federation Ltd., Anand - 388001, Gujarat",
        commodity_name: "Pasteurised Butter",
        net_quantity: { value: 100, unit: "g", raw: "100 g", is_standard: true },
        mfg_date: "08/2024",
        mrp: { value: 58.0, raw: "MRP Rs. 58.00 (inclusive of all taxes)", includes_taxes: true },
        consumer_care: {
          phone: "1800-258-3333",
          email: "customercare@amul.coop",
          address: "Anand, Gujarat"
        },
        country_of_origin: "India",
        font_size_score: "ADEQUATE (3.2mm)"
      },
      compliance_status: "COMPLIANT",
      compliance_score: 100,
      inspector_id: "usr_inspector_01",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: "scan_002",
      product_id: "prod_002",
      extracted_text: "SUPERCLEAN POWER DETERGENT\\nNet Weight: 500 gms\\nMfg Date: 05/2024\\nMax Retail Price: Rs. 145.00\\nMfd by: SuperClean Chemicals Pvt Ltd, Plot 44, Okhla Ind Area, New Delhi - 110020\\nCustomer Care: 011-26987455",
      parsed_fields: {
        manufacturer: "SuperClean Chemicals Pvt Ltd, Plot 44, Okhla Ind Area, New Delhi - 110020",
        commodity_name: "Power Detergent",
        net_quantity: { value: 500, unit: "gms", raw: "500 gms", is_standard: false, error: "Illegal unit 'gms'" },
        mfg_date: "05/2024",
        mrp: { value: 145.0, raw: "Max Retail Price: Rs. 145.00", includes_taxes: false, error: "Missing tax declaration clause" },
        consumer_care: {
          phone: "011-26987455",
          email: null,
          address: "New Delhi - 110020"
        },
        country_of_origin: null,
        font_size_score: "ADEQUATE"
      },
      compliance_status: "NON_COMPLIANT",
      compliance_score: 52,
      inspector_id: "usr_inspector_01",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ],
  violations: [
    {
      id: "viol_001",
      scan_id: "scan_002",
      rule_code: "Rule 6(1)(c)",
      violation_type: "ILLEGAL_METRIC_UNIT",
      severity: "CRITICAL",
      description: "Net quantity specified using illegal non-standard unit symbol 'gms'. Under Rule 12 and 13 of Legal Metrology (Packaged Commodities) Rules 2011, standard symbol 'g' must be used.",
      statutory_provision: "Section 36(1) of Legal Metrology Act, 2009",
      suggested_action: "Issue Statutory Notice Form 1; compoundable at ₹25,000"
    },
    {
      id: "viol_002",
      scan_id: "scan_002",
      rule_code: "Rule 6(1)(e)",
      violation_type: "MISSING_TAX_INCLUSION_CLAUSE",
      severity: "CRITICAL",
      description: "MRP declaration 'Rs. 145.00' omits mandatory statutory phrase '(inclusive of all taxes)' or '(incl. of all taxes)'.",
      statutory_provision: "Section 36(1) & (2) of Legal Metrology Act, 2009",
      suggested_action: "Issue Statutory Show Cause Notice"
    },
    {
      id: "viol_003",
      scan_id: "scan_002",
      rule_code: "Rule 6(1)(n)",
      violation_type: "INCOMPLETE_CONSUMER_CARE",
      severity: "MAJOR",
      description: "Consumer care details omit mandatory contact email address. Only telephone number is provided.",
      statutory_provision: "Rule 6(1)(n) of Legal Metrology (PC) Rules, 2011",
      suggested_action: "Direct manufacturer to rectify packaging in next batch"
    }
  ],
  reports: [
    {
      id: "rep_001",
      scan_id: "scan_001",
      report_number: "LMCR-2024-00109",
      status: "COMPLIANT",
      score: 100,
      inspector_name: "R. K. Sharma",
      generated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      statutory_notice: null
    },
    {
      id: "rep_002",
      scan_id: "scan_002",
      report_number: "LMCR-2024-00110",
      status: "NON_COMPLIANT",
      score: 52,
      inspector_name: "R. K. Sharma",
      generated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      statutory_notice: {
        noticeNumber: "SCN/LM/DEL/2024/0082",
        recipient: "SuperClean Chemicals Pvt Ltd",
        address: "Plot 44, Okhla Ind Area, New Delhi - 110020",
        noticePeriodDays: 15,
        penaltyProposed: "₹25,000",
        legalGrounds: "Violations of Rule 6(1)(c), Rule 6(1)(e), and Rule 6(1)(n) under Legal Metrology (Packaged Commodities) Rules, 2011 punishable under Section 36(1) of Legal Metrology Act, 2009."
      }
    }
  ],
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
    this.loadLocal();
  }

  loadLocal() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
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

  async connect() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (mongoUri) {
      try {
        await mongoose.connect(mongoUri);
        this.isMongo = true;
        console.log("🍃 Successfully connected to MongoDB Atlas!");
        await this.seedMongoIfEmpty();
      } catch (err) {
        console.error("⚠️ Failed to connect to MongoDB Atlas, falling back to local file store:", err.message);
        this.isMongo = false;
      }
    } else {
      console.log("📁 MONGODB_URI not provided. Running in local file-store mode (db.json).");
      this.isMongo = false;
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

  // Users
  async getUserByEmail(email) {
    if (this.isMongo) {
      return await UserModel.findOne({ email: email.toLowerCase() }).lean();
    }
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async getUserByPhone(phone) {
    const norm = normalizePhone(phone);
    if (this.isMongo) {
      const all = await UserModel.find().lean();
      return all.find(u => normalizePhone(u.phone) === norm);
    }
    return this.data.users.find(u => normalizePhone(u.phone) === norm);
  }

  async getUserByEmailOrPhone(identifier) {
    const cleaned = identifier.trim().toLowerCase();
    const isEmail = cleaned.includes('@');

    if (isEmail) {
      return await this.getUserByEmail(cleaned);
    } else {
      return await this.getUserByPhone(cleaned);
    }
  }

  async getUserById(id) {
    if (this.isMongo) {
      return await UserModel.findOne({ id }).lean();
    }
    return this.data.users.find(u => u.id === id);
  }

  async addUser(user) {
    if (this.isMongo) {
      const created = await UserModel.create(user);
      return created.toObject();
    }
    this.data.users.push(user);
    this.saveLocal();
    return user;
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
}

export const db = new Database();
