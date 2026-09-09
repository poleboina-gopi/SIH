import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, normalizePhone } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "legal_metrology_secret_key_2024";

// Password strength validator (Google-Grade Standards)
export function validatePasswordStrength(password = "") {
  const errors = [];
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter (A-Z)");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter (a-z)");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one numeral (0-9)");
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("Password must contain at least one special symbol (!@#$%^&*...)");
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Indian Phone Number Validator
export function validateIndianPhone(phone = "") {
  const digits = normalizePhone(phone);
  const isValid = /^[6789]\d{9}$/.test(digits);
  return {
    isValid,
    normalized: digits ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : "",
    rawDigits: digits
  };
}

// POST /api/register
router.post('/register', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      password, 
      role = "inspector", 
      department, 
      badgeNumber 
    } = req.body;

    // Validate Required Fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ 
        error: "All fields are required: First Name, Last Name, Email, Indian Mobile Number, and Password" 
      });
    }

    if (firstName.trim().length < 2) {
      return res.status(400).json({ error: "First Name must be at least 2 characters" });
    }
    if (lastName.trim().length < 1) {
      return res.status(400).json({ error: "Last Name is required" });
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid official email address" });
    }

    // Validate Indian Phone Number
    const phoneCheck = validateIndianPhone(phone);
    if (!phoneCheck.isValid) {
      return res.status(400).json({ 
        error: "Invalid Indian phone number. Must be a valid 10-digit mobile number starting with 6, 7, 8, or 9." 
      });
    }

    // Validate Google-Standard Password
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ 
        error: "Weak password. " + passwordCheck.errors.join(". ") 
      });
    }

    // Check if email already registered
    const existingEmail = await db.getUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: "An account with this email address already exists" });
    }

    // Check if phone already registered
    const existingPhone = await db.getUserByPhone(phoneCheck.rawDigits);
    if (existingPhone) {
      return res.status(409).json({ error: "An account with this phone number already exists" });
    }

    // Cryptographic Salted Hashing (Bcrypt, 12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const newUser = {
      id: `usr_${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: fullName,
      email: email.trim().toLowerCase(),
      phone: phoneCheck.normalized,
      password: hashedPassword,
      role: role === "admin" ? "admin" : "inspector",
      designation: role === "admin" ? "Joint Controller, Legal Metrology" : "Legal Metrology Officer (Inspector)",
      department: department || "Enforcement Wing, Directorate of Legal Metrology",
      badgeNumber: badgeNumber || `LM-REG-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString()
    };

    const saved = await db.addUser(newUser);

    const token = jwt.sign(
      { id: saved.id, email: saved.email, role: saved.role, name: saved.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...safeUser } = saved;
    res.status(201).json({ 
      message: "Account created successfully with enterprise security protection",
      token, 
      user: safeUser 
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message || "Registration error" });
  }
});

// POST /api/login
// Supports login with Email OR Indian Phone Number
router.post('/login', async (req, res) => {
  try {
    const { identifier, email, phone, password } = req.body;
    const loginId = identifier || email || phone;

    if (!loginId || !password) {
      return res.status(400).json({ 
        error: "Please enter your Email / Phone Number and Password" 
      });
    }

    const user = await db.getUserByEmailOrPhone(loginId);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials. No user found with this email or phone number." });
    }

    // Cryptographic Password Verification
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password. Access denied." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...safeUser } = user;
    res.json({
      message: "Authentication successful",
      token,
      user: safeUser
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message || "Login error" });
  }
});

// GET /api/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.getUserById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
