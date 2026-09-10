import express from 'express';
import { db } from './src/db.js';
import authRoutes from './src/routes/authRoutes.js';
import scanRoutes from './src/routes/scanRoutes.js';
import complianceRoutes from './src/routes/complianceRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import rulesRoutes from './src/routes/rulesRoutes.js';
import jwt from 'jsonwebtoken';

async function runE2ETest() {
  console.log("=== Testing Express Server Endpoints for 14 FSSAI Rules ===");
  
  await db.connect();

  const app = express();
  app.use(express.json());
  app.use('/api', authRoutes);
  app.use('/api', scanRoutes);
  app.use('/api', complianceRoutes);
  app.use('/api', dashboardRoutes);
  app.use('/api', rulesRoutes);

  const server = app.listen(5099, async () => {
    console.log("Test server running on port 5099");
    try {
      const baseUrl = 'http://localhost:5099';

      // 1. Get Auth Token
      const token = jwt.sign(
        { id: 'usr_inspector_01', email: 'inspector@delhi.gov.in', role: 'inspector', name: 'Vamsi Krishna' },
        process.env.JWT_SECRET || 'legal_metrology_secret_key_2024',
        { expiresIn: '1h' }
      );

      // 2. Fetch Rules
      console.log("\n[Test 1] Checking GET /api/rules...");
      const rulesRes = await fetch(`${baseUrl}/api/rules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const rulesData = await rulesRes.json();
      console.log(`Rules retrieved: ${rulesData.rules?.length}`);
      if (rulesData.rules?.length !== 14) {
        throw new Error(`Expected exactly 14 rules, got ${rulesData.rules?.length}`);
      }
      console.log("Rules list:", rulesData.rules.map(r => r.ruleCode).join(', '));

      // 3. Test POST /api/validate with Compliant Food Text
      console.log("\n[Test 2] Checking POST /api/validate on Compliant Label...");
      const compliantOcrText = `
BRITANNIA GOOD DAY BUTTER COOKIES
100% VEGETARIAN
Ingredients: Refined Wheat Flour (Maida), Sugar, Edible Vegetable Oil (Palm), Butter (2%), Invert Sugar Syrup, Milk Solids, Iodised Salt, Raising Agents.
Allergen Information: Contains Wheat and Milk. May contain traces of Nuts and Soy.
Nutritional Information per 100g (Approx.):
Energy: 495 kcal
Protein: 7.0 g
Carbohydrate: 68.0 g
Total Sugars: 24.5 g
Added Sugars: 22.0 g
Total Fat: 22.0 g
Saturated Fat: 11.0 g
Trans Fat: 0.1 g
Sodium: 310 mg
Net Weight: 120 g
Batch No: B24089A
Date of Pkd: 15/08/2024
Best Before: 6 months from packaging
Manufactured By: Britannia Industries Limited, Plot 14, Whitefield Road, Bengaluru - 560066, Karnataka, India.
For Feedback & Complaints, Call: 1800-425-4449, Email: feedback@britindia.com, Consumer Care Cell, Bengaluru.
Storage Instructions: Store in a cool, hygienic and dry place. Keep away from direct sunlight.
Country of Origin: India
fssai Lic. No. 10015043001234
`;

      const valRes = await fetch(`${baseUrl}/api/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_name: "Britannia Good Day Butter Cookies",
          brand: "Britannia",
          category: "Confectionery & Biscuits",
          raw_text: compliantOcrText
        })
      });
      const valData = await valRes.json();
      console.log("Validation status:", valData.report?.status);
      console.log("Compliance score:", valData.report?.score);
      console.log("Violations logged:", valData.violations?.length);
      console.log("Matrix items count:", valData.rule_checks_matrix?.length);

      if (valData.report?.status !== "COMPLIANT" || valData.report?.score !== 100) {
        throw new Error(`Expected COMPLIANT with score 100, got ${valData.report?.status} with score ${valData.report?.score}`);
      }
      if (valData.rule_checks_matrix?.length !== 14) {
        throw new Error(`Expected 14 matrix items, got ${valData.rule_checks_matrix?.length}`);
      }

      // 4. Test PDF Endpoint for Generated Report
      console.log("\n[Test 3] Checking GET /api/reports/:id/pdf...");
      const pdfRes = await fetch(`${baseUrl}/api/reports/${valData.scan?.id}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pdfArrayBuffer = await pdfRes.arrayBuffer();
      console.log("PDF Response status:", pdfRes.status);
      console.log("PDF Content-Type:", pdfRes.headers.get('content-type'));
      console.log("PDF Buffer size:", pdfArrayBuffer.byteLength, "bytes");

      if (pdfRes.status !== 200 || pdfArrayBuffer.byteLength < 1000) {
        throw new Error(`PDF generation failed or returned invalid buffer size: ${pdfArrayBuffer.byteLength}`);
      }

      // 5. Test POST /api/validate on Non-Compliant Label
      console.log("\n[Test 4] Checking POST /api/validate on Defective Label...");
      const defectiveText = `
Mystery Snack
Net Qty: 250 gms
Mfd: 01/2024
Batch: B101
Made by: Local Snacks, Market Road.
`;
      const defRes = await fetch(`${baseUrl}/api/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_name: "Mystery Snack",
          brand: "Local Snacks",
          category: "Snacks",
          raw_text: defectiveText
        })
      });
      const defData = await defRes.json();
      console.log("Defective label status:", defData.report?.status);
      console.log("Defective label score:", defData.report?.score);
      console.log("Defective violations count:", defData.violations?.length);
      console.log("Section 32 Notice Title:", defData.report?.statutory_notice?.notice_title);
      console.log("Matrix failed count:", defData.rule_checks_matrix?.filter(m => m.status === 'FAIL').length);

      if (defData.report?.status !== "NON_COMPLIANT") {
        throw new Error(`Expected NON_COMPLIANT, got ${defData.report?.status}`);
      }
      if (!defData.report?.statutory_notice) {
        throw new Error("Expected Section 32 statutory notice on non-compliant report");
      }

      console.log("\n🎉 ALL E2E API VERIFICATION TESTS PASSED SUCCESFULLY!");
    } catch (e) {
      console.error("❌ E2E Test Failed:", e);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runE2ETest();
