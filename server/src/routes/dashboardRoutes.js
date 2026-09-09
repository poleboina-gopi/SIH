import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/stats (Secured: Authenticated Officers)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const scans = await db.getScans();
    const violations = await db.getViolations();
    const products = await db.getProducts();

    const totalScans = scans.length;
    const compliantScans = scans.filter(s => s.compliance_status === "COMPLIANT").length;
    const nonCompliantScans = scans.filter(s => s.compliance_status === "NON_COMPLIANT").length;
    const borderlineScans = scans.filter(s => s.compliance_status === "BORDERLINE").length;

    const complianceRate = totalScans > 0 ? Math.round((compliantScans / totalScans) * 100) : 0;
    const totalPenalties = violations.length * 25000;

    const ruleCounts = {};
    for (const v of violations) {
      ruleCounts[v.rule_code] = (ruleCounts[v.rule_code] || 0) + 1;
    }

    const severityCounts = {
      CRITICAL: violations.filter(v => v.severity === "CRITICAL").length,
      MAJOR: violations.filter(v => v.severity === "MAJOR").length,
      MINOR: violations.filter(v => v.severity === "MINOR").length
    };

    const categoryMap = {};
    for (const p of products) {
      categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
    }

    const prodMap = new Map(products.map(p => [p.id, p]));
    const recentInspections = await Promise.all(scans.slice(0, 5).map(async (s) => {
      const prod = prodMap.get(s.product_id);
      const vList = await db.getViolationsByScanId(s.id);
      return {
        scan_id: s.id,
        product_name: prod?.product_name || "Unknown Product",
        brand: prod?.brand || "Unknown Brand",
        category: prod?.category || "General",
        image_url: prod?.image_url || null,
        compliance_status: s.compliance_status,
        compliance_score: s.compliance_score,
        violations_count: vList.length,
        created_at: s.created_at
      };
    }));

    res.json({
      total_scans: totalScans,
      compliant_scans: compliantScans,
      non_compliant_scans: nonCompliantScans,
      borderline_scans: borderlineScans,
      compliance_rate: complianceRate,
      total_violations: violations.length,
      total_penalties_estimated: totalPenalties,
      violations_by_rule: ruleCounts,
      violations_by_severity: severityCounts,
      category_distribution: categoryMap,
      recent_inspections: recentInspections
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load statistics" });
  }
});

// GET /api/violations (Secured: Authenticated Officers)
router.get('/violations', authenticateToken, async (req, res) => {
  try {
    const violations = await db.getViolations();
    const scans = await db.getScans();
    const products = await db.getProducts();

    const scanMap = new Map(scans.map(s => [s.id, s]));
    const prodMap = new Map(products.map(p => [p.id, p]));

    const enriched = violations.map(v => {
      const scan = scanMap.get(v.scan_id);
      const product = scan ? prodMap.get(scan.product_id) : null;
      return {
        ...v,
        product_name: product?.product_name || "Unknown Product",
        brand: product?.brand || "Unknown Brand",
        category: product?.category || "General",
        scan_date: scan?.created_at
      };
    });

    res.json({ violations: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to load violations" });
  }
});

// GET /api/admin/users (Secured: Sworn Administrators Only)
router.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to retrieve user directory" });
  }
});

// PATCH /api/admin/users/:id/role (Secured: Sworn Administrators Only)
router.patch('/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['inspector', 'admin'].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Role must be either 'inspector' or 'admin'." });
    }

    const updated = await db.updateUserRole(req.params.id, role);
    if (!updated) {
      return res.status(404).json({ error: "Officer record not found." });
    }

    res.json({ 
      message: `Officer role successfully updated to ${role}`,
      user: updated 
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update user role" });
  }
});

export default router;
