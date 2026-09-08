import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/rules
router.get('/rules', (req, res) => {
  const rules = db.getRules();
  res.json({ rules });
});

// PUT /api/rules/:id
router.put('/rules/:id', (req, res) => {
  const { isActive, severity } = req.body;
  const updated = db.updateRule(req.params.id, {
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
});

export default router;
