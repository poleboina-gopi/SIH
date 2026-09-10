import { generateCompliancePdf } from './src/services/pdfService.js';
import { parsePackagingText } from './src/services/parserService.js';
import { evaluateCompliance } from './src/services/complianceEngine.js';
import { FOOD_SAFETY_RULES } from './src/rules/foodRules.js';
import fs from 'fs';
import path from 'path';

const sampleFoodOcrText = `
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

const parsed = parsePackagingText(sampleFoodOcrText);
const compliance = evaluateCompliance(parsed, FOOD_SAFETY_RULES);

const report = {
  report_number: 'FSSAI/REP/2026/001',
  status: compliance.compliance_status,
  compliance_score: compliance.compliance_score,
  generated_at: new Date().toISOString()
};

const scan = {
  id: 'scan-001',
  parsed_fields: parsed,
  compliance_result: compliance
};

const product = {
  name: 'Britannia Good Day Butter Cookies',
  brand: 'Britannia',
  category: 'Confectionery & Biscuits'
};

const outPath = path.join(process.cwd(), 'uploads', 'test_fssai_report.pdf');
const writeStream = fs.createWriteStream(outPath);

console.log("Generating statutory FSSAI PDF certificate...");
generateCompliancePdf({ report, scan, product, violations: compliance.violations }, writeStream);

writeStream.on('finish', () => {
  const stats = fs.statSync(outPath);
  console.log(`✅ PDF generated successfully! File size: ${stats.size} bytes at ${outPath}`);
});
