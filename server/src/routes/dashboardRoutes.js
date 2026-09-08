import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/stats
router.get('/stats', (req, res) => {
  const scans = db.getScans();
  const violations = db.getViolations();
  const products = db.getProducts();
  const reports = db.getReports();

  const totalScans = scans.length;
  const compliantScans = scans.filter(s => s.compliance_status === "COMPLIANT").length;
  const nonCompliantScans = scans.filter(s => s.compliance_status === "NON_COMPLIANT").length;
  const borderlineScans = scans.filter(s => s.compliance_status === "BORDERLINE").length;

  const complianceRate = totalScans > 0 ? Math.round((compliantScans / totalScans) * 100) : 0;

  // Total calculated penalties (approx ₹25,000 per violation)
  const totalPenalties = violations.length * 25000;

  // Breakdown by rule code
  const ruleCounts = {};
  for (const v of violations) {
    ruleCounts[v.rule_code] = (ruleCounts[v.rule_code] || 0) + 1;
  }

  // Breakdown by severity
  const severityCounts = {
    CRITICAL: violations.filter(v => v.severity === "CRITICAL").length,
    MAJOR: violations.filter(v => v.severity === "MAJOR").length,
    MINOR: violations.filter(v => v.severity === "MINOR").length
  };

  // Category distribution from products
  const categoryMap = {};
  for (const p of products) {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
  }

  // Recent scans with product info
  const prodMap = new Map(products.map(p => [p.id, p]));
  const recentInspections = scans.slice(0, 5).map(s => {
    const prod = prodMap.get(s.product_id);
    const vList = db.getViolationsByScanId(s.id);
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
  });

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
});

// GET /api/violations
router.get('/violations', (req, res) => {
  const violations = db.getViolations();
  const scans = db.getScans();
  const products = db.getProducts();

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
});

export default router;
