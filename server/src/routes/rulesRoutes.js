import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/rules
router.get('/rules', async (req, res) => {
  try {
    const rules = await db.getRules();
    res.json({ rules });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load rules" });
  }
});

// PUT /api/rules/:id
router.put('/rules/:id', async (req, res) => {
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
