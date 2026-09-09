import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/rules (Secured: Authenticated Officers)
router.get('/rules', authenticateToken, async (req, res) => {
  try {
    const rules = await db.getRules();
    res.json({ rules });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load rules" });
  }
});

// PUT /api/rules/:id (Secured: Sworn Administrators Only)
router.put('/rules/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { isActive, severity } = req.body;
    const updated = await db.updateRule(req.params.id, {
      ...(isActive !== undefined && { isActive }),
      ...(severity && { severity })
    });

    if (!updated) {
      return res.status(404).json({ error: "Rule not found" });
    }

    res.json({
      message: "Rule updated successfully",
      rule: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update rule" });
  }
});

export default router;
