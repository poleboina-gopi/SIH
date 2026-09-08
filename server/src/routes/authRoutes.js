import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "legal_metrology_secret_key_2024";

// POST /api/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.getUserByEmail(email);
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
});

// POST /api/register
router.post('/register', (req, res) => {
  const { name, email, password, role = "inspector", department, badgeNumber } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: "User with this email already exists" });
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    name,
    email,
    password,
    role: role === "admin" ? "admin" : "inspector",
    designation: role === "admin" ? "Joint Controller, Legal Metrology" : "Legal Metrology Inspector",
    department: department || "Enforcement Wing, Directorate of Legal Metrology",
    badgeNumber: badgeNumber || `LM-REG-${Math.floor(1000 + Math.random() * 9000)}`
  };

  db.addUser(newUser);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ token, user: safeUser });
});

// GET /api/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
