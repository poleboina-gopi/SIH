/**
 * Food Safety & Standards (FSSAI) Compliance Validation Engine
 * Evaluates extracted product packaging declarations EXCLUSIVELY against
 * the 14 mandatory pre-packaged food labeling rules under FSS (Labelling and Display) Regulations, 2020.
 */

import { FOOD_SAFETY_RULES } from '../rules/foodRules.js';

export function evaluateCompliance(parsedFields = {}, activeRules = FOOD_SAFETY_RULES) {
  const violations = [];
  const matrix = [];
  const rulesMap = new Map(activeRules.map(r => [r.id, r]));

  // -------------------------------------------------------------------------
  // 1. Name of the food/product (FSSAI Reg 5(1))
  // -------------------------------------------------------------------------
  const rule1 = rulesMap.get("RULE_FSSAI_01") || FOOD_SAFETY_RULES[0];
  if (rule1?.isActive !== false) {
    const rawName = typeof parsedFields?.commodity_name === 'string' 
      ? parsedFields.commodity_name.trim() 
      : (parsedFields?.commodity_name?.name || '');
    const isMissing = !rawName || rawName.toLowerCase() === 'packaged food product' || rawName.length < 2;

    if (isMissing) {
      const v = {
        rule_code: "FSSAI Reg 5(1)",
        rule_id: "RULE_FSSAI_01",
        title: "Name of the Food/Product",
        violation_type: "MISSING_FOOD_NAME",
        severity: "CRITICAL",
        description: "Package omits true or specific name of the food item indicating its genuine nature.",
        statutory_provision: "Regulation 5(1) of FSS (Labelling and Display) Regulations, 2020 read with Sec 52 FSS Act",
        penalty_fine: "₹3,00,000",
        field: "commodity_name",
        suggested_action: "Print clear, prominent generic or specific food name on principal display panel"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: "Not detected on package" });
    } else {
      matrix.push({
        id: "RULE_FSSAI_01",
        rule_code: "FSSAI Reg 5(1)",
        title: "Name of the Food/Product",
        status: "PASS",
        severity: "CRITICAL",
        statutory_provision: "Regulation 5(1) of FSS Regulations, 2020",
        extracted_value: rawName,
        defect: null,
        suggested_remedy: "Verified compliant"
      });
    }
  }

  // -------------------------------------------------------------------------
  // 2. List of ingredients (FSSAI Reg 5(2))
  // -------------------------------------------------------------------------
  const rule2 = rulesMap.get("RULE_FSSAI_02") || FOOD_SAFETY_RULES[1];
  if (rule2?.isActive !== false) {
    const ing = parsedFields?.ingredients;
    const isMissing = !ing || (!ing.raw && (!ing.items || ing.items.length === 0));

    if (isMissing) {
      const v = {
        rule_code: "FSSAI Reg 5(2)",
        rule_id: "RULE_FSSAI_02",
        title: "List of Ingredients",
        violation_type: "MISSING_INGREDIENTS_LIST",
        severity: "CRITICAL",
        description: "Package lacks mandatory 'Ingredients:' declaration listing ingredients in descending order of weight.",
        statutory_provision: "Regulation 5(2) of FSS (Labelling and Display) Regulations, 2020",
        penalty_fine: "₹3,00,000",
        field: "ingredients",
        suggested_action: "Add complete ingredients list prefixed with 'Ingredients:' on packaging label"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: "Not detected on package" });
    } else {
      matrix.push({
        id: "RULE_FSSAI_02",
        rule_code: "FSSAI Reg 5(2)",
        title: "List of Ingredients",
        status: "PASS",
        severity: "CRITICAL",
        statutory_provision: "Regulation 5(2) of FSS Regulations, 2020",
        extracted_value: ing.raw || (ing.items ? ing.items.join(', ') : 'Declared'),
        defect: null,
        suggested_remedy: "Verified compliant"
      });
    }
  }

  // -------------------------------------------------------------------------
  // 3. Nutritional information (FSSAI Reg 5(3))
  // -------------------------------------------------------------------------
  const rule3 = rulesMap.get("RULE_FSSAI_03") || FOOD_SAFETY_RULES[2];
  if (rule3?.isActive !== false) {
    const nutri = parsedFields?.nutritional_info;
    const isMissing = !nutri || !nutri.is_declared;

    if (isMissing) {
      const v = {
        rule_code: "FSSAI Reg 5(3)",
        rule_id: "RULE_FSSAI_03",
        title: "Nutritional Information",
        violation_type: "MISSING_NUTRITIONAL_INFO",
        severity: "CRITICAL",
        description: "Package omits mandatory nutritional facts per 100g/100ml (Energy, Protein, Carbs, Sugars, Fat, Sodium).",
        statutory_provision: "Regulation 5(3) of FSS (Labelling and Display) Regulations, 2020",
        penalty_fine: "₹3,00,000",
        field: "nutritional_info",
        suggested_action: "Declare nutritional information panel per 100g/100ml as mandated by FSSAI"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: "Not detected on package" });
    } else {
      const nutriDetails = [
        nutri.energy && `Energy: ${nutri.energy}`,
        nutri.protein && `Protein: ${nutri.protein}`,
        nutri.carbohydrate && `Carbs: ${nutri.carbohydrate}`,
        nutri.total_fat && `Fat: ${nutri.total_fat}`
      ].filter(Boolean).join(' | ');

      matrix.push({
        id: "RULE_FSSAI_03",
        rule_code: "FSSAI Reg 5(3)",
        title: "Nutritional Information",
        status: "PASS",
        severity: "CRITICAL",
        statutory_provision: "Regulation 5(3) of FSS Regulations, 2020",
        extracted_value: nutriDetails || nutri.raw || "Nutritional Information Declared",
        defect: null,
        suggested_remedy: "Verified compliant"
      });
    }
  }

  // -------------------------------------------------------------------------
  // 4. Net quantity (FSSAI Reg 5(4))
  // -------------------------------------------------------------------------
  const rule4 = rulesMap.get("RULE_FSSAI_04") || FOOD_SAFETY_RULES[3];
  if (rule4?.isActive !== false) {
    const nq = parsedFields?.net_quantity;
    const nqRaw = typeof nq === 'string' ? nq : (nq?.raw || (nq?.value ? `${nq.value} ${nq.unit || ''}` : ''));
    let isStandard = typeof nq === 'object' && nq !== null && typeof nq.is_standard === 'boolean' ? nq.is_standard : null;
    let nqError = typeof nq === 'object' && nq !== null ? nq.error : null;

    if (!nq || (!nqRaw && (typeof nq === 'object' && !nq.value))) {
      const v = {
        rule_code: "FSSAI Reg 5(4)",
        rule_id: "RULE_FSSAI_04",
        title: "Net Quantity",
        violation_type: "MISSING_NET_QUANTITY",
        severity: "CRITICAL",
        description: "Package omits mandatory declaration of net quantity in standard metric units.",
        statutory_provision: "Regulation 5(4) of FSS Regulations, 2020 & Section 36(1) LM Act",
        penalty_fine: "₹50,000",
        field: "net_quantity",
        suggested_action: "Declare net quantity using standard units (g, kg, ml, l)"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: "Not detected on package" });
    } else {
      if (isStandard === false) {
        const v = {
          rule_code: "FSSAI Reg 5(4)",
          rule_id: "RULE_FSSAI_04",
          title: "Net Quantity",
          violation_type: "ILLEGAL_NET_QUANTITY_UNIT",
          severity: "CRITICAL",
          description: `Net quantity uses illegal non-standard symbol '${nq.unit || nqRaw}'. ${nqError || 'Only standard symbols (g, kg, ml, l) are permissible.'}`,
          statutory_provision: "Regulation 5(4) of FSS Regulations, 2020",
          penalty_fine: "₹25,000",
          field: "net_quantity",
          suggested_action: `Replace non-standard unit with '${nq.standardized_unit || 'standard metric unit'}'`
        };
        violations.push(v);
        matrix.push({ ...v, status: "FAIL", extracted_value: nqRaw });
      } else {
        matrix.push({
          id: "RULE_FSSAI_04",
          rule_code: "FSSAI Reg 5(4)",
          title: "Net Quantity",
          status: "PASS",
          severity: "CRITICAL",
          statutory_provision: "Regulation 5(4) of FSS Regulations, 2020",
          extracted_value: nqRaw,
          defect: null,
          suggested_remedy: "Verified standard unit"
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // 5. Vegetarian / non-vegetarian symbol (FSSAI Reg 5(5))
  // -------------------------------------------------------------------------
  const rule5 = rulesMap.get("RULE_FSSAI_05") || FOOD_SAFETY_RULES[4];
  if (rule5?.isActive !== false) {
    const veg = parsedFields?.veg_non_veg;
    const isDeclared = veg && (veg.is_declared || veg.type || veg.raw);

    if (!isDeclared) {
      const v = {
        rule_code: "FSSAI Reg 5(5)",
        rule_id: "RULE_FSSAI_05",
        title: "Vegetarian / Non-Vegetarian Symbol",
        violation_type: "MISSING_VEG_NONVEG_LOGO",
        severity: "CRITICAL",
        description: "Package omits mandatory Vegetarian (green circle in square) or Non-Vegetarian (brown triangle in square) logo / declaration.",
        statutory_provision: "Regulation 5(5) of FSS (Labelling and Display) Regulations, 2020",
        penalty_fine: "₹2,00,000",
        field: "veg_non_veg",
        suggested_action: "Affix standard FSSAI Green circle or Brown triangle logo in prominent square border"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: "Not detected on package" });
    } else {
      const typeLabel = veg.type === 'NON_VEG' ? 'Non-Vegetarian (Brown Triangle)' : 'Vegetarian (Green Circle)';
      matrix.push({
        id: "RULE_FSSAI_05",
        rule_code: "FSSAI Reg 5(5)",
        title: "Vegetarian / Non-Vegetarian Symbol",
        status: "PASS",
        severity: "CRITICAL",
        statutory_provision: "Regulation 5(5) of FSS Regulations, 2020",
        extracted_value: `${typeLabel} - ${veg.raw || 'Declared'}`,
        defect: null,
        suggested_remedy: "Verified compliant"
      });
    }
  }

  // -------------------------------------------------------------------------
  // 6. FSSAI logo and licence number (FSSAI Reg 5(6))
  // -------------------------------------------------------------------------
  const rule6 = rulesMap.get("RULE_FSSAI_06") || FOOD_SAFETY_RULES[5];
  if (rule6?.isActive !== false) {
    const lic = parsedFields?.fssai_license;

    if (!lic || (!lic.license_number && !lic.raw)) {
      const v = {
        rule_code: "FSSAI Reg 5(6)",
        rule_id: "RULE_FSSAI_06",
        title: "FSSAI Logo and Licence Number",
        violation_type: "MISSING_FSSAI_LICENSE",
        severity: "CRITICAL",
        description: "Package omits mandatory FSSAI logo and 14-digit food business operator licence number ('Lic. No.').",
        statutory_provision: "Regulation 5(6) of FSS Regulations, 2020 read with Section 63 FSS Act, 2006",
        penalty_fine: "₹5,00,000 & Prosecution",
        field: "fssai_license",
        suggested_action: "Display valid 14-digit FSSAI licence number prefixed with 'Lic. No.' alongside FSSAI logo"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: "Not detected on package" });
    } else if (lic.license_number && !lic.is_valid_14_digit) {
      const v = {
        rule_code: "FSSAI Reg 5(6)",
        rule_id: "RULE_FSSAI_06",
        title: "FSSAI Logo and Licence Number",
        violation_type: "INVALID_FSSAI_LICENSE_NUMBER",
        severity: "CRITICAL",
        description: `Invalid FSSAI licence number '${lic.license_number}'. FSSAI licence must be exactly 14 digits.`,
        statutory_provision: "Regulation 5(6) of FSS (Labelling and Display) Regulations, 2020",
        penalty_fine: "₹2,00,000",
        field: "fssai_license",
        suggested_action: "Rectify licence number to exact 14 digits granted by the State/Central Licensing Authority"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: lic.license_number });
    } else {
      matrix.push({
        id: "RULE_FSSAI_06",
        rule_code: "FSSAI Reg 5(6)",
        title: "FSSAI Logo and Licence Number",
        status: "PASS",
        severity: "CRITICAL",
        statutory_provision: "Regulation 5(6) of FSS Regulations, 2020",
        extracted_value: `Lic. No. ${lic.license_number || lic.raw}`,
        defect: null,
        suggested_remedy: "Verified 14-digit FSSAI licence"
      });
    }
  }

  // -------------------------------------------------------------------------
  // 7. Date of manufacture/packing (FSSAI Reg 5(7))
  // -------------------------------------------------------------------------
  const rule7 = rulesMap.get("RULE_FSSAI_07") || FOOD_SAFETY_RULES[6];
  if (rule7?.isActive !== false) {
    const md = parsedFields?.mfg_date;
    const dateStr = typeof md === 'string' ? md : (md?.date || md?.raw || '');

    if (!md || !dateStr) {
      const v = {
        rule_code: "FSSAI Reg 5(7)",
        rule_id: "RULE_FSSAI_07",
        title: "Date of Manufacture/Packing",
        violation_type: "MISSING_MFG_DATE",
        severity: "CRITICAL",
        description: "Package omits mandatory declaration of date or month & year of manufacture / pre-packing.",
        statutory_provision: "Regulation 5(7) of FSS (Labelling and Display) Regulations, 2020",
        penalty_fine: "₹3,00,000",
        field: "mfg_date",
        suggested_action: "Print date of manufacture/packing in DD/MM/YYYY or MM/YYYY format"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: "Not detected on package" });
    } else if (typeof md === 'object' && md.is_compliant === false) {
      const v = {
        rule_code: "FSSAI Reg 5(7)",
        rule_id: "RULE_FSSAI_07",
        title: "Date of Manufacture/Packing",
        violation_type: "INVALID_MFG_DATE_FORMAT",
        severity: "MAJOR",
        description: `Date of manufacture '${dateStr}' violates standard format (prescribed: DD/MM/YYYY or MM/YYYY).`,
        statutory_provision: "Regulation 5(7) of FSS (Labelling and Display) Regulations, 2020",
        penalty_fine: "₹50,000",
        field: "mfg_date",
        suggested_action: "Format manufacturing date as DD/MM/YYYY or MM/YYYY"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: dateStr });
    } else {
      matrix.push({
        id: "RULE_FSSAI_07",
        rule_code: "FSSAI Reg 5(7)",
        title: "Date of Manufacture/Packing",
        status: "PASS",
        severity: "CRITICAL",
        statutory_provision: "Regulation 5(7) of FSS Regulations, 2020",
        extracted_value: dateStr,
        defect: null,
        suggested_remedy: "Verified compliant date format"
      });
    }
  }

  // -------------------------------------------------------------------------
  // 8. Expiry / use-by or best-before date (FSSAI Reg 5(8))
  // -------------------------------------------------------------------------
  const rule8 = rulesMap.get("RULE_FSSAI_08") || FOOD_SAFETY_RULES[7];
  if (rule8?.isActive !== false) {
    const exp = parsedFields?.expiry_date;
    const expVal = typeof exp === 'string' ? exp : (exp?.expiry_or_period || exp?.raw || '');

    if (!exp || !expVal) {
      const v = {
        rule_code: "FSSAI Reg 5(8)",
        rule_id: "RULE_FSSAI_08",
        title: "Expiry / Use-by or Best-Before Date",
        violation_type: "MISSING_EXPIRY_DATE",
        severity: "CRITICAL",
        description: "Package omits mandatory 'Best Before' date or 'Expiry Date' / 'Use By' declaration.",
        statutory_provision: "Regulation 5(8) of FSS Regulations, 2020 read with Section 59 FSS Act",
        penalty_fine: "₹5,00,000",
        field: "expiry_date",
        suggested_action: "Clearly state 'Best Before [Date/Period]' or 'Expiry Date' on label"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: "Not detected on package" });
    } else {
      matrix.push({
        id: "RULE_FSSAI_08",
        rule_code: "FSSAI Reg 5(8)",
        title: "Expiry / Use-by or Best-Before Date",
        status: "PASS",
        severity: "CRITICAL",
        statutory_provision: "Regulation 5(8) of FSS Regulations, 2020",
        extracted_value: expVal,
        defect: null,
        suggested_remedy: "Verified expiry/best-before declaration"
      });
    }
  }

  // -------------------------------------------------------------------------
  // 9. Batch/Lot/Code number (FSSAI Reg 5(9))
  // -------------------------------------------------------------------------
  const rule9 = rulesMap.get("RULE_FSSAI_09") || FOOD_SAFETY_RULES[8];
  if (rule9?.isActive !== false) {
    const batch = parsedFields?.batch_number;
    const batchVal = typeof batch === 'string' ? batch : (batch?.value || batch?.raw || '');

    if (!batch || !batchVal) {
      const v = {
        rule_code: "FSSAI Reg 5(9)",
        rule_id: "RULE_FSSAI_09",
        title: "Batch/Lot/Code Number",
        violation_type: "MISSING_BATCH_NUMBER",
        severity: "MAJOR",
        description: "Package omits mandatory batch number / lot identification number for production traceability.",
        statutory_provision: "Regulation 5(9) of FSS (Labelling and Display) Regulations, 2020",
        penalty_fine: "₹2,00,000",
        field: "batch_number",
        suggested_action: "Print unique batch number / lot identifier prefixed with 'Batch No:' or 'B. No:'"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: "Not detected on package" });
    } else {
      matrix.push({
        id: "RULE_FSSAI_09",
        rule_code: "FSSAI Reg 5(9)",
        title: "Batch/Lot/Code Number",
        status: "PASS",
        severity: "MAJOR",
        statutory_provision: "Regulation 5(9) of FSS Regulations, 2020",
        extracted_value: batchVal,
        defect: null,
        suggested_remedy: "Verified traceability code"
      });
    }
  }

  // -------------------------------------------------------------------------
  // 10. Manufacturer/packer/importer details (FSSAI Reg 5(10))
  // -------------------------------------------------------------------------
  const rule10 = rulesMap.get("RULE_FSSAI_10") || FOOD_SAFETY_RULES[9];
  if (rule10?.isActive !== false) {
    const mfg = parsedFields?.manufacturer;
    const mfgRaw = typeof mfg === 'string' ? mfg : (mfg?.raw || mfg?.address || '');
    const mfgName = typeof mfg === 'object' && mfg !== null 
      ? (mfg.name || (mfgRaw ? mfgRaw.split(',')[0].trim() : '')) 
      : (typeof mfg === 'string' ? mfg.split(',')[0].trim() : '');
    const mfgAddress = typeof mfg === 'object' && mfg !== null 
      ? (mfg.address || mfgRaw || '') 
      : (typeof mfg === 'string' ? mfg : '');
    const hasPincode = typeof mfg === 'object' && mfg !== null
      ? Boolean(mfg.has_pincode || /\b\d{6}\b/.test(mfgAddress))
      : /\b\d{6}\b/.test(mfgAddress);

    if (!mfg || !mfgName) {
      const v = {
        rule_code: "FSSAI Reg 5(10)",
        rule_id: "RULE_FSSAI_10",
        title: "Manufacturer/Packer/Importer Details",
        violation_type: "MISSING_MANUFACTURER_DETAILS",
        severity: "CRITICAL",
        description: "Package lacks mandatory declaration of complete name and premises address of the manufacturer / packer / importer.",
        statutory_provision: "Regulation 5(10) of FSS (Labelling and Display) Regulations, 2020",
        penalty_fine: "₹3,00,000",
        field: "manufacturer",
        suggested_action: "Declare full legal business entity name and physical address including PIN code"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: "Not detected on package" });
    } else if (!hasPincode && mfgAddress.length < 25) {
      const v = {
        rule_code: "FSSAI Reg 5(10)",
        rule_id: "RULE_FSSAI_10",
        title: "Manufacturer/Packer/Importer Details",
        violation_type: "INCOMPLETE_MANUFACTURER_ADDRESS",
        severity: "MAJOR",
        description: `Incomplete manufacturer address declared ('${mfgAddress || mfgName}'). 6-digit postal PIN code is missing.`,
        statutory_provision: "Regulation 5(10) of FSS (Labelling and Display) Regulations, 2020",
        penalty_fine: "₹1,00,000",
        field: "manufacturer",
        suggested_action: "Include complete physical address with postal PIN code"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: mfgAddress || mfgName });
    } else {
      matrix.push({
        id: "RULE_FSSAI_10",
        rule_code: "FSSAI Reg 5(10)",
        title: "Manufacturer/Packer/Importer Details",
        status: "PASS",
        severity: "CRITICAL",
        statutory_provision: "Regulation 5(10) of FSS Regulations, 2020",
        extracted_value: mfgAddress || mfgName,
        defect: null,
        suggested_remedy: "Verified manufacturer premises"
      });
    }
  }

  // -------------------------------------------------------------------------
  // 11. Customer care/contact information (FSSAI Reg 5(11))
  // -------------------------------------------------------------------------
  const rule11 = rulesMap.get("RULE_FSSAI_11") || FOOD_SAFETY_RULES[10];
  if (rule11?.isActive !== false) {
    const cc = parsedFields?.consumer_care;
    let ccPhone = typeof cc === 'object' && cc !== null ? (cc.phone || '') : '';
    let ccEmail = typeof cc === 'object' && cc !== null ? (cc.email || '') : '';

    if (!cc || (!ccPhone && !ccEmail && typeof cc === 'object')) {
      const v = {
        rule_code: "FSSAI Reg 5(11)",
        rule_id: "RULE_FSSAI_11",
        title: "Customer Care/Contact Information",
        violation_type: "MISSING_CUSTOMER_CARE",
        severity: "MAJOR",
        description: "Package omits mandatory consumer grievance redressal telephone helpline and email contact details.",
        statutory_provision: "Regulation 5(11) of FSS Regulations, 2020 & Consumer Protection Act, 2019",
        penalty_fine: "₹1,00,000",
        field: "consumer_care",
        suggested_action: "Print customer care phone/helpline and official complaint email on the package"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: "Not detected on package" });
    } else {
      const parts = [ccPhone && `Tel: ${ccPhone}`, ccEmail && `Email: ${ccEmail}`].filter(Boolean).join(', ');
      matrix.push({
        id: "RULE_FSSAI_11",
        rule_code: "FSSAI Reg 5(11)",
        title: "Customer Care/Contact Information",
        status: "PASS",
        severity: "MAJOR",
        statutory_provision: "Regulation 5(11) of FSS Regulations, 2020",
        extracted_value: parts || "Consumer care declared",
        defect: null,
        suggested_remedy: "Verified redressal channels"
      });
    }
  }

  // -------------------------------------------------------------------------
  // 12. Allergen declarations, where applicable (FSSAI Reg 5(12))
  // -------------------------------------------------------------------------
  const rule12 = rulesMap.get("RULE_FSSAI_12") || FOOD_SAFETY_RULES[11];
  if (rule12?.isActive !== false) {
    const allergen = parsedFields?.allergen_declaration;
    const isDeclared = allergen && (allergen.is_declared || allergen.raw);

    // If ingredients mention allergens (like milk, wheat, soy, nuts) but no explicit allergen advisory statement exists
    const rawAll = JSON.stringify(parsedFields).toLowerCase();
    const containsCommonAllergen = /milk|wheat|gluten|nuts|peanuts|soy|egg|fish|crustacean/.test(rawAll);

    if (containsCommonAllergen && !isDeclared) {
      const v = {
        rule_code: "FSSAI Reg 5(12)",
        rule_id: "RULE_FSSAI_12",
        title: "Allergen Declarations, Where Applicable",
        violation_type: "MISSING_ALLERGEN_DECLARATION",
        severity: "MAJOR",
        description: "Package ingredients contain potential allergens (e.g., milk/gluten/soy/nuts) but lack mandatory 'Contains: [Allergen]' or 'Allergen Advice' statement.",
        statutory_provision: "Regulation 5(12) of FSS (Labelling and Display) Regulations, 2020",
        penalty_fine: "₹2,00,000",
        field: "allergen_declaration",
        suggested_action: "Provide unambiguous allergen advisory statement, e.g., 'Contains: Milk, Gluten' or 'Allergy Advice: May contain traces of nuts'"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: "Omitted allergen statement" });
    } else {
      matrix.push({
        id: "RULE_FSSAI_12",
        rule_code: "FSSAI Reg 5(12)",
        title: "Allergen Declarations, Where Applicable",
        status: "PASS",
        severity: "MAJOR",
        statutory_provision: "Regulation 5(12) of FSS Regulations, 2020",
        extracted_value: isDeclared ? (allergen.raw || allergen.statement || "Allergen Advisory Declared") : "No priority allergens detected",
        defect: null,
        suggested_remedy: "Verified compliant"
      });
    }
  }

  // -------------------------------------------------------------------------
  // 13. Storage/use instructions, where required (FSSAI Reg 5(13))
  // -------------------------------------------------------------------------
  const rule13 = rulesMap.get("RULE_FSSAI_13") || FOOD_SAFETY_RULES[12];
  if (rule13?.isActive !== false) {
    const storage = parsedFields?.storage_instructions;
    const isDeclared = storage && (storage.is_declared || storage.instructions || storage.raw);

    if (!isDeclared) {
      const v = {
        rule_code: "FSSAI Reg 5(13)",
        rule_id: "RULE_FSSAI_13",
        title: "Storage/Use Instructions, Where Required",
        violation_type: "MISSING_STORAGE_INSTRUCTIONS",
        severity: "MAJOR",
        description: "Package lacks clear storage conditions (e.g., 'Store in a cool and dry place' or 'Refrigerate after opening') essential to maintain food safety and quality.",
        statutory_provision: "Regulation 5(13) of FSS (Labelling and Display) Regulations, 2020",
        penalty_fine: "₹1,00,000",
        field: "storage_instructions",
        suggested_action: "Declare appropriate storage instructions, e.g., 'Store in a cool, dry place away from direct sunlight'"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: "Not detected on package" });
    } else {
      matrix.push({
        id: "RULE_FSSAI_13",
        rule_code: "FSSAI Reg 5(13)",
        title: "Storage/Use Instructions, Where Required",
        status: "PASS",
        severity: "MAJOR",
        statutory_provision: "Regulation 5(13) of FSS Regulations, 2020",
        extracted_value: storage.instructions || storage.raw || "Store in cool dry place",
        defect: null,
        suggested_remedy: "Verified storage conditions"
      });
    }
  }

  // -------------------------------------------------------------------------
  // 14. Country of origin, for imported food (FSSAI Reg 5(14))
  // -------------------------------------------------------------------------
  const rule14 = rulesMap.get("RULE_FSSAI_14") || FOOD_SAFETY_RULES[13];
  if (rule14?.isActive !== false) {
    const origin = parsedFields?.country_of_origin;
    const originCountry = typeof origin === 'string' ? origin : (origin?.country || origin?.raw || '');
    const isImported = origin?.is_imported || /imported|switzerland|germany|usa|china|japan|uk|italy|france|foreign/i.test(JSON.stringify(parsedFields));

    if (isImported && (!originCountry || originCountry.toLowerCase() === 'unspecified')) {
      const v = {
        rule_code: "FSSAI Reg 5(14)",
        rule_id: "RULE_FSSAI_14",
        title: "Country of Origin, for Imported Food",
        violation_type: "MISSING_COUNTRY_OF_ORIGIN",
        severity: "CRITICAL",
        description: "Imported food package fails to declare mandatory Country of Origin ('Country of Origin: [Country]' or 'Product of [Country]').",
        statutory_provision: "Regulation 5(14) of FSS (Labelling and Display) Regulations, 2020 read with Section 52 FSS Act",
        penalty_fine: "₹3,00,000",
        field: "country_of_origin",
        suggested_action: "State 'Country of Origin: [Country of manufacture/origin]' clearly on the imported food label"
      };
      violations.push(v);
      matrix.push({ ...v, status: "FAIL", extracted_value: "Omitted on imported product" });
    } else {
      matrix.push({
        id: "RULE_FSSAI_14",
        rule_code: "FSSAI Reg 5(14)",
        title: "Country of Origin, for Imported Food",
        status: "PASS",
        severity: "MAJOR",
        statutory_provision: "Regulation 5(14) of FSS Regulations, 2020",
        extracted_value: originCountry || "India (Domestic Manufacture)",
        defect: null,
        suggested_remedy: "Verified country of origin"
      });
    }
  }

  // -------------------------------------------------------------------------
  // Compliance Score Calculation (Exclusively based on the 14 rules)
  // -------------------------------------------------------------------------
  const totalRules = matrix.length || 14;
  const passedRules = matrix.filter(m => m.status === 'PASS').length;
  const failedRules = matrix.filter(m => m.status === 'FAIL').length;

  let score = Math.round((passedRules / totalRules) * 100);
  
  // Severe deduction for critical failures
  const criticalFails = violations.filter(v => v.severity === 'CRITICAL').length;
  if (criticalFails > 0) {
    score = Math.min(score, Math.max(0, 100 - (criticalFails * 20 + failedRules * 5)));
  }

  let complianceStatus = "COMPLIANT";
  if (violations.some(v => v.severity === "CRITICAL") || violations.length >= 2) {
    complianceStatus = "NON_COMPLIANT";
  } else if (violations.length > 0) {
    complianceStatus = "BORDERLINE";
  }

  // -------------------------------------------------------------------------
  // Generate Statutory FSSAI Notice Draft if Non-Compliant
  // -------------------------------------------------------------------------
  let statutoryNotice = null;
  if (complianceStatus === "NON_COMPLIANT") {
    const mfg = parsedFields?.manufacturer;
    const recipient = typeof mfg === 'object' && mfg !== null
      ? (mfg.name || (mfg.address ? mfg.address.split(',')[0].trim() : "Food Business Operator (FBO)"))
      : (typeof mfg === 'string' && mfg.trim() ? mfg.split(',')[0].trim() : "Food Business Operator (FBO)");
    const address = typeof mfg === 'object' && mfg !== null
      ? (mfg.address || mfg.raw || "Address as declared on packaging label")
      : (typeof mfg === 'string' && mfg.trim() ? mfg : "Address as declared on packaging label");

    const totalPenalties = violations.length * 100000;

    statutoryNotice = {
      noticeNumber: `FSSAI/INSP/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      noticeDate: new Date().toISOString().split('T')[0],
      recipient,
      address,
      subject: "Statutory Improvement Notice under Section 32 of Food Safety and Standards Act, 2006",
      commodityName: (typeof parsedFields?.commodity_name === 'string' ? parsedFields.commodity_name : '') || "Pre-packaged Food Commodity",
      violationsCount: violations.length,
      statutoryProvisionsViolated: violations.map(v => v.rule_code).join(", "),
      penalSectionApplicable: "Section 32, Section 52 & Section 53 of Food Safety and Standards Act, 2006",
      compoundingFeeProposed: `₹${totalPenalties.toLocaleString('en-IN')}`,
      noticePeriodDays: 14,
      legalDirectives: [
        "Rectify all labeling deficiencies listed above within 14 days of receipt of this Improvement Notice under Section 32 of FSS Act, 2006.",
        "Immediately withhold further dispatch/sale of offending non-compliant packaging batches until over-stickered or compliant labels are approved.",
        "Show cause before the Designated Food Safety Officer why legal proceedings should not be initiated before the Adjudicating Officer."
      ]
    };
  }

  return {
    compliance_status: complianceStatus,
    compliance_score: score,
    violations,
    rule_checks_matrix: matrix,
    statutory_notice: statutoryNotice,
    rule_checks_summary: {
      total_rules_checked: totalRules,
      rules_passed: passedRules,
      rules_failed: failedRules
    }
  };
}
