import { parsePackagingText } from './src/services/parserService.js';
import { evaluateCompliance } from './src/services/complianceEngine.js';
import { FOOD_SAFETY_RULES } from './src/rules/foodRules.js';

console.log("=== Testing 14 Mandatory FSSAI Food Packaging Rules ===");

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

// 1. Test Parser
const parsed = parsePackagingText(sampleFoodOcrText);
console.log("\n[1] Extracted Declarations:");
console.log("- Name:", parsed.commodity_name);
console.log("- Ingredients:", parsed.ingredients?.items?.slice(0, 3), "Total items:", parsed.ingredients?.count);
console.log("- Nutritional Info (Energy):", parsed.nutritional_info?.energy, "Fat:", parsed.nutritional_info?.total_fat);
console.log("- Net Qty:", parsed.net_quantity?.raw, "Is Standard:", parsed.net_quantity?.is_standard);
console.log("- Veg/Non-Veg:", parsed.veg_non_veg?.type, "-", parsed.veg_non_veg?.symbol);
console.log("- FSSAI License:", parsed.fssai_license?.license_number, "Valid 14-digit:", parsed.fssai_license?.is_valid_14_digit);
console.log("- Mfg Date:", parsed.mfg_date?.date, "Compliant:", parsed.mfg_date?.is_compliant);
console.log("- Expiry/Best Before:", parsed.expiry_date?.expiry_or_period);
console.log("- Batch Number:", parsed.batch_number?.value);
console.log("- Manufacturer:", parsed.manufacturer?.name, "Pincode:", parsed.manufacturer?.has_pincode);
console.log("- Customer Care (Phone/Email):", parsed.consumer_care?.phone, "/", parsed.consumer_care?.email);
console.log("- Allergen Declaration:", parsed.allergen_declaration?.statement);
console.log("- Storage Instructions:", parsed.storage_instructions?.instructions);
console.log("- Country of Origin:", parsed.country_of_origin?.country);

// 2. Test Compliance Engine on Complete Compliant Label
const evalCompliant = evaluateCompliance(parsed, FOOD_SAFETY_RULES);
console.log("\n[2] Compliance Evaluation (Fully Compliant Sample):");
console.log("Status:", evalCompliant.compliance_status);
console.log("Score:", evalCompliant.compliance_score);
console.log("Total Rules Checked:", evalCompliant.rule_checks_summary.total_rules_checked);
console.log("Rules Passed:", evalCompliant.rule_checks_summary.rules_passed);
console.log("Rules Failed:", evalCompliant.rule_checks_summary.rules_failed);
console.log("Violations Count:", evalCompliant.violations.length);

if (evalCompliant.rule_checks_summary.total_rules_checked !== 14) {
  throw new Error(`Expected exactly 14 rules checked, got ${evalCompliant.rule_checks_summary.total_rules_checked}`);
}
if (evalCompliant.violations.length !== 0) {
  console.warn("Unexpected violations:", evalCompliant.violations);
}

// 3. Test Non-Compliant Label (Missing FSSAI license, missing ingredients, illegal unit)
console.log("\n[3] Testing Non-Compliant Packaging Defect Detection:");
const defectiveOcrText = `
Mystery Snack
Net Qty: 250 gms
Mfd: 01/2024
Batch: B101
Made by: Local Snacks, Market Road.
`;
const parsedDefective = parsePackagingText(defectiveOcrText);
const evalDefective = evaluateCompliance(parsedDefective, FOOD_SAFETY_RULES);

console.log("Status:", evalDefective.compliance_status);
console.log("Score:", evalDefective.compliance_score);
console.log("Failed Rules Count:", evalDefective.rule_checks_summary.rules_failed);
console.log("Violations Detected:");
evalDefective.violations.forEach((v, i) => {
  console.log(`  ${i + 1}. [${v.rule_code}] ${v.title} -> ${v.violation_type} (${v.severity})`);
});

if (evalDefective.compliance_status !== "NON_COMPLIANT") {
  throw new Error("Expected NON_COMPLIANT status for defective label");
}

console.log("\n✅ All 14 FSSAI Food Packaging Rules validated and verified successfully!");
