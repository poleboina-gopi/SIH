import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "legal_metrology_secret_key_2024";

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await db.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...safeUser } = user;
    res.json({
      token,
      user: safeUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Login error" });
  }
});

// POST /api/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = "inspector", department, badgeNumber } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      password,
      role: role === "admin" ? "admin" : "inspector",
      designation: role === "admin" ? "Joint Controller, Legal Metrology" : "Legal Metrology Inspector",
      department: department || "Enforcement Wing, Directorate of Legal Metrology",
      badgeNumber: badgeNumber || `LM-REG-${Math.floor(1000 + Math.random() * 9000)}`
    };

    const saved = await db.addUser(newUser);

    const token = jwt.sign(
      { id: saved.id, email: saved.email, role: saved.role, name: saved.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...safeUser } = saved;
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message || "Registration error" });
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
    return res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
