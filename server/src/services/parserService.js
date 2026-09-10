/**
 * Intelligent Packaging Declaration Extractor & NLP Regex Parser
 * Extracts all 14 statutory FSSAI food product packaging declarations from raw OCR text.
 */

import { ILLEGAL_UNIT_SYMBOLS, VALID_STANDARDIZED_UNITS } from '../rules/foodRules.js';

export function parsePackagingText(rawText = "", metadata = {}) {
  const text = (rawText || "").trim();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const parsed = {
    // 1. Name of the food/product (Reg 5(1))
    commodity_name: extractProductName(text, lines, metadata),

    // 2. List of ingredients (Reg 5(2))
    ingredients: extractIngredients(text),

    // 3. Nutritional information (Reg 5(3))
    nutritional_info: extractNutritionalInfo(text),

    // 4. Net quantity (Reg 5(4))
    net_quantity: extractNetQuantity(text),

    // 5. Vegetarian / non-vegetarian symbol (Reg 5(5))
    veg_non_veg: extractVegNonVeg(text, metadata),

    // 6. FSSAI logo and licence number (Reg 5(6))
    fssai_license: extractFssaiLicense(text),

    // 7. Date of manufacture/packing (Reg 5(7))
    mfg_date: extractMfgDate(text),

    // 8. Expiry / use-by or best-before date (Reg 5(8))
    expiry_date: extractExpiryDate(text),

    // 9. Batch/Lot/Code number (Reg 5(9))
    batch_number: extractBatchNumber(text),

    // 10. Manufacturer/packer/importer details (Reg 5(10))
    manufacturer: extractManufacturer(text, lines),

    // 11. Customer care/contact information (Reg 5(11))
    consumer_care: extractConsumerCare(text),

    // 12. Allergen declarations, where applicable (Reg 5(12))
    allergen_declaration: extractAllergenDeclaration(text),

    // 13. Storage/use instructions, where required (Reg 5(13))
    storage_instructions: extractStorageInstructions(text),

    // 14. Country of origin, for imported food (Reg 5(14))
    country_of_origin: extractCountryOfOrigin(text, lines, metadata),

    // Retain legacy fields for UI backward-compatibility
    mrp: extractMRP(text),
    unit_sale_price: extractUSP(text),
    readability: analyzeReadability(text)
  };

  return parsed;
}

// 1. Name of the food/product
function extractProductName(text, lines, metadata = {}) {
  // 1. Check user-supplied or metadata product name first
  if (metadata.product_name && typeof metadata.product_name === 'string') {
    const metaName = metadata.product_name.trim();
    if (metaName.length >= 2 && !/^(?:packaged\s*food|unnamed|sample)/i.test(metaName)) {
      return metaName;
    }
  }

  // 2. Explicit prefix in text
  const explicitPrefix = text.match(/(?:product\s*name|name\s*of\s*(?:the\s*)?food|commodity(?:\s*name)?|generic\s*name|item\s*name)[:\s-]+([^\n,;]+)/i);
  if (explicitPrefix && explicitPrefix[1]) {
    const val = explicitPrefix[1].trim();
    if (val.length >= 3 && !/ingredients|nutrition|mrp|net/i.test(val)) {
      return val;
    }
  }

  // 3. Top headline lines before section headers
  for (const line of lines.slice(0, 5)) {
    const clean = line.replace(/^[•\-\*\s]+/, '').trim();
    if (
      clean.length >= 3 && 
      clean.length <= 75 && 
      !/^(?:ingredients|nutrition|nutritive|per\s*100|mrp|net\s*(?:qty|weight|wt)|mfd|mfg|pkd|exp|best\s*before|use\s*by|fssai|lic|batch|b\.?\s*no|consumer|for\s*feedback|storage|country|100%\s*veg|vegetarian|pure\s*veg|non[\s-]*veg|panel)/i.test(clean)
    ) {
      return clean;
    }
  }

  // 4. Single-line merged OCR output fallback: extract first clause before any major header
  const singleLineMatch = text.match(/^([^:\n]+?)(?=(?:\s+100%\s*veg|\s+veg\b|\s+ingredients|\s+nutri|\s+net\s*(?:qty|weight|wt)|\s+mrp|\s+mfg|\s+pkd|\s+fssai|\s+batch|\s+mfd))/i);
  if (singleLineMatch && singleLineMatch[1]) {
    const candidate = singleLineMatch[1].trim();
    if (candidate.length >= 3 && candidate.length <= 70) {
      return candidate;
    }
  }

  if (metadata.brand && typeof metadata.brand === 'string') {
    return `${metadata.brand.trim()} Food Product`;
  }

  return "Packaged Food Product";
}

// 2. List of ingredients
function extractIngredients(text) {
  const ingRegex = /(?:ingredients|list\s*of\s*ingredients|contains\s*ingredients|made\s*(?:with|from))[:\s.-]+([\s\S]+?)(?=(?:nutri|storage|keep\s*in|store\s*in|mfd|pkd|mrp|net\s*(?:qty|wt|vol)|fssai|lic|batch|b\.?\s*no|best\s*before|use\s*by|exp|customer|consumer|allergen|mfg|manufactur|packed|marketed|country\s*of\s*origin|$))/i;
  const match = text.match(ingRegex);

  if (match && match[1]) {
    const rawIng = match[1].trim().replace(/[\r\n]+/g, ' ');
    // Split ingredients by comma, semicolon, bullets, or pipe
    const items = rawIng.split(/[,;•|]/).map(s => s.trim()).filter(s => s.length > 1);
    if (items.length > 0) {
      return {
        raw: rawIng.slice(0, 350),
        items: items.slice(0, 25),
        count: items.length,
        has_heading: true
      };
    }
  }

  // Keyword / OCR typo fallback
  if (/(?:ingredients?|ingredlents?|ingrédients?)[\s:]/i.test(text)) {
    const fallbackMatch = text.match(/(?:ingredients?|ingredlents?|ingrédients?)[:\s.-]+([^\n.]+)/i);
    const rawContent = fallbackMatch ? fallbackMatch[1].trim() : "Ingredients declared on packaging";
    return {
      raw: rawContent,
      items: rawContent.split(',').map(s => s.trim()).filter(Boolean),
      count: 1,
      has_heading: true
    };
  }

  return null;
}

// 3. Nutritional information
function extractNutritionalInfo(text) {
  const nutritionHeader = /(?:nutrit(?:ion|ional|ive)?\s*(?:info(?:rmation)?|facts?|values?|composition|table|panel|summary)?|approx(?:\.|\s*values)?|per\s*100\s*(?:g|ml)|typical\s*values)/i.test(text);

  // Look for key mandatory parameters with unit in parens or standard suffix
  const energy = text.match(/(?:energy|calories|energy\s*value)(?:\s*\((?:kcal|kj|calories)\))?[:\s-]*([\d.]+)\s*(?:kcal|kj)?/i);
  const protein = text.match(/(?:protein)(?:\s*\((?:g|gm|grams)\))?[:\s-]*([\d.]+)\s*g?/i);
  const carbs = text.match(/(?:total\s*carbohydrates?|carbohydrates?|carbs)(?:\s*\((?:g|gm|grams)\))?[:\s-]*([\d.]+)\s*g?/i);
  const totalSugars = text.match(/(?:total\s*sugars?|sugars?)(?:\s*\((?:g|gm|grams)\))?[:\s-]*([\d.]+)\s*g?/i);
  const addedSugars = text.match(/(?:added\s*sugars?)(?:\s*\((?:g|gm|grams)\))?[:\s-]*([\d.]+)\s*g?/i);
  const fat = text.match(/(?:total\s*fat|fat)(?:\s*\((?:g|gm|grams)\))?[:\s-]*([\d.]+)\s*g?/i);
  const satFat = text.match(/(?:saturated\s*fat(?:ty\s*acids)?|sat\s*fat)(?:\s*\((?:g|gm|grams)\))?[:\s-]*([\d.]+)\s*g?/i);
  const transFat = text.match(/(?:trans\s*fat(?:ty\s*acids)?)(?:\s*\((?:g|gm|grams)\))?[:\s-]*([\d.]+)\s*g?/i);
  const sodium = text.match(/(?:sodium|salt)(?:\s*\((?:mg|g)\))?[:\s-]*([\d.]+)\s*(?:mg|g)?/i);

  const foundMetrics = [energy, protein, carbs, totalSugars, fat, sodium].filter(Boolean).length;

  if (nutritionHeader || foundMetrics >= 2) {
    return {
      is_declared: true,
      per_unit: text.match(/per\s*100\s*(?:g|ml)|per\s*serving/i)?.[0] || "Per 100g / 100ml",
      energy: energy ? `${energy[1]} kcal` : null,
      protein: protein ? `${protein[1]} g` : null,
      carbohydrate: carbs ? `${carbs[1]} g` : null,
      total_sugars: totalSugars ? `${totalSugars[1]} g` : null,
      added_sugars: addedSugars ? `${addedSugars[1]} g` : null,
      total_fat: fat ? `${fat[1]} g` : null,
      saturated_fat: satFat ? `${satFat[1]} g` : null,
      trans_fat: transFat ? `${transFat[1]} g` : null,
      sodium: sodium ? `${sodium[1]} mg` : null,
      raw: (text.match(/(?:nutrit(?:ion|ional|ive)?\s*(?:info(?:rmation)?|facts?|values?|composition)?)[\s\S]{10,250}/i)?.[0] || "Nutritional Information Declared").replace(/[\r\n]+/g, ' ')
    };
  }

  return null;
}

// 4. Net quantity
function extractNetQuantity(text) {
  const netLineMatch = text.match(/(?:net\s*(?:qty|quantity|weight|wt|vol|volume|contents?|mass)|quantity|weight|volume)[:\s.-]*(\d+(?:\.\d+)?)\s*([a-zA-Z.]+)/i);
  const match = netLineMatch || text.match(/\b(\d+(?:\.\d+)?)\s*(gms|gm|g\.|g|kg|kgs|kilos|ml|mls|ml\.|l|ltr|ltrs|cl|m|cm|mm|units?|pieces?|N|u)\b/i);

  if (match) {
    const val = parseFloat(match[1]);
    const rawUnit = match[2].trim();
    const unitLower = rawUnit.toLowerCase().replace(/\.$/, '');

    let isStandard = true;
    let error = null;
    let suggestedUnit = unitLower;

    for (const illegal of ILLEGAL_UNIT_SYMBOLS) {
      if (illegal.pattern.test(rawUnit)) {
        isStandard = false;
        error = `Illegal non-standard symbol '${rawUnit}'. ${illegal.reason}.`;
        suggestedUnit = illegal.replacement;
        break;
      }
    }

    if (isStandard && !VALID_STANDARDIZED_UNITS.includes(unitLower)) {
      isStandard = false;
      error = `Unrecognized unit symbol '${rawUnit}'. Must adhere to standard metric units (g, kg, ml, l).`;
    }

    return {
      value: val,
      unit: rawUnit,
      standardized_unit: suggestedUnit,
      raw: `${val} ${rawUnit}`,
      is_standard: isStandard,
      error
    };
  }

  return null;
}

// 5. Vegetarian / non-vegetarian symbol
function extractVegNonVeg(text, metadata = {}) {
  const nonVegMatch = text.match(/\b(?:non[\s-]*vegetarian|non[\s-]*veg|brown\s*triangle|contains\s*(?:egg|meat|chicken|fish|pork|beef|mutton|prawns?)|triangle\s*in\s*square)\b/i);
  const vegMatch = text.match(/(?:\[o\]|\(o\)|\[v\]|\(v\)|\[•\]|\(•\)|\[O\]|\(O\)|\b100%\s*veg(?:etarian)?\b|\bvegetarian\b|\bpure\s*veg\b|\bveg\b|\bgreen\s*(?:dot|circle|mark|logo)\b|\bcircle\s*in\s*square\b)/i);

  if (nonVegMatch) {
    return {
      type: "NON_VEG",
      symbol: "Brown triangle inside brown square",
      is_declared: true,
      raw: nonVegMatch[0]
    };
  }

  if (vegMatch) {
    return {
      type: "VEG",
      symbol: "Green circle inside green square",
      is_declared: true,
      raw: vegMatch[0]
    };
  }

  // Category inference if explicitly specified
  if (metadata.category && /dairy|vegetarian|veg\b/i.test(metadata.category)) {
    return {
      type: "VEG",
      symbol: "Green circle inside green square",
      is_declared: true,
      raw: `Inferred Vegetarian from category (${metadata.category})`
    };
  }

  return null;
}

// 6. FSSAI logo and licence number
function extractFssaiLicense(text) {
  const hasFssaiLogo = /(?:fssai|food\s*safety\s*and\s*standards|Issai|fssa[il1])/i.test(text);

  const licPatterns = [
    /(?:fssai|Issai|fssa[il1])?[\s:]*(?:lic(?:ence)?\.?\s*(?:no\.?|number)?)?[:\s-]*([0-9\s-]{14,20})/i,
    /(?:lic(?:ence)?\.?\s*(?:no\.?|number)?)[:\s-]*([0-9\s-]{14,20})/i,
    /\b([0-9]{14})\b/
  ];

  for (const regex of licPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const cleanDigits = match[1].replace(/[\s-]/g, '');
      if (cleanDigits.length >= 10 && cleanDigits.length <= 16) {
        const isValid14 = cleanDigits.length === 14;
        return {
          license_number: cleanDigits,
          is_valid_14_digit: isValid14,
          has_fssai_logo: hasFssaiLogo,
          raw: match[0].trim(),
          error: !isValid14 ? `FSSAI license must be exactly 14 digits (found ${cleanDigits.length} digits)` : (!hasFssaiLogo ? "FSSAI logo text missing alongside licence number" : null)
        };
      }
    }
  }

  if (hasFssaiLogo) {
    return {
      license_number: null,
      is_valid_14_digit: false,
      has_fssai_logo: true,
      raw: "FSSAI mentioned without 14-digit licence number",
      error: "Mandatory 14-digit FSSAI licence number missing"
    };
  }

  return null;
}

// 7. Date of manufacture/packing
function extractMfgDate(text) {
  const datePatterns = [
    /(?:mfg(?:\s*date)?|mfd(?:\s*date)?|date\s*of\s*(?:mfg|manufacture|pack(?:ing)?)|pkd|packed)(?:\s*on)?[:\s.-]*\b([0-3]?\d[\/\-\.][0-1]?\d[\/\-\.](?:20\d{2}|\d{2}))\b/i,
    /(?:mfg(?:\s*date)?|mfd(?:\s*date)?|date\s*of\s*(?:mfg|manufacture|pack(?:ing)?)|pkd|packed)(?:\s*on)?[:\s.-]*\b([0-1]?\d[\/\-\.](?:20\d{2}|\d{2}))\b/i,
    /(?:mfg(?:\s*date)?|mfd(?:\s*date)?|date\s*of\s*mfg|pkd|packed)(?:\s*on)?[:\s.-]*\b([a-z]{3,9}\s+(?:20)?\d{2,4})\b/i,
    /(?:mfg(?:\s*date)?|mfd(?:\s*date)?|pkd|packed)(?:\s*on)?[:\s.-]*\b([0-3]?\d[\/\-\.][a-z]{3,9}[\/\-\.](?:20\d{2}|\d{2}))\b/i,
    /\b(?:mfg|pkd)[:\s]*([0-9]{2}[\/\-][0-9]{4})\b/i
  ];

  for (const regex of datePatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const rawDate = match[1].trim();
      const isDDMMYYYY = /^(?:0?[1-9]|[12]\d|3[01])[\/\-\.](?:0?[1-9]|1[0-2])[\/\-\.](?:20\d{2}|\d{2})$/.test(rawDate);
      const isMMYYYY = /^(?:0?[1-9]|1[0-2])[\/\-\.](?:20\d{2}|\d{2})$/.test(rawDate);
      const isMonthYYYY = /^[a-z]{3,9}\s+(?:20)?\d{2,4}$/i.test(rawDate);
      const isDDMonthYYYY = /^(?:0?[1-9]|[12]\d|3[01])[\/\-\.][a-z]{3,9}[\/\-\.](?:20\d{2}|\d{2})$/i.test(rawDate);

      const isCompliant = isDDMMYYYY || isMMYYYY || isMonthYYYY || isDDMonthYYYY;
      return {
        date: rawDate,
        raw: match[0].trim(),
        format: isDDMMYYYY ? "DD/MM/YYYY" : isMMYYYY ? "MM/YYYY" : isMonthYYYY ? "Month YYYY" : "DD-Month-YYYY",
        is_compliant: isCompliant,
        error: isCompliant ? null : "Invalid manufacture date format. Prescribed: DD/MM/YYYY, MM/YYYY, or Month YYYY."
      };
    }
  }

  return null;
}

// 8. Expiry / use-by or best-before date
function extractExpiryDate(text) {
  const expPatterns = [
    /(?:best\s*before|use\s*by|expiry\s*(?:date)?|exp\.?\s*date|exp\.?)[:\s.-]*\b([0-3]?\d[\/\-\.][0-1]?\d[\/\-\.](?:20\d{2}|\d{2}))\b/i,
    /(?:best\s*before|use\s*by|expiry\s*(?:date)?|exp\.?\s*date|exp\.?)[:\s.-]*\b([0-1]?\d[\/\-\.](?:20\d{2}|\d{2}))\b/i,
    /(?:best\s*before|use\s*by|expiry)[:\s.-]*\b([a-z]{3,9}\s+(?:20)?\d{2,4})\b/i,
    /(?:best\s*before|use\s*within)[:\s-]+((?:\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|eighteen|twenty\s*four|thirty\s*six)\s*(?:months?|days?|weeks?|years?)(?:\s*(?:from|of)\s*(?:the\s*)?(?:date\s*of\s*)?(?:mfg|packing|manufacture|pkd|packaging))?)/i,
    /(?:expiry|exp)[:\s]*(\d{2}[\/\-]\d{2,4})/i
  ];

  for (const regex of expPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      return {
        expiry_or_period: match[1].trim(),
        raw: match[0].trim(),
        type: /best\s*before/i.test(match[0]) ? "BEST_BEFORE" : (/use\s*by/i.test(match[0]) ? "USE_BY" : "EXPIRY_DATE"),
        is_compliant: true
      };
    }
  }

  return null;
}

// 9. Batch/Lot/Code number
function extractBatchNumber(text) {
  const batchPatterns = [
    /\b(?:batch(?:\s*(?:no\.?|number|code))?|lot(?:\s*(?:no\.?|number|code))?|b\.?\s*no\.?)[:\s.-]+([a-z0-9\/-]{2,25})/i,
    /\b(?:b\.?\s*no|batch)[:\s]*([a-z0-9\/-]{2,20})\b/i
  ];

  for (const regex of batchPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const bVal = match[1].trim();
      if (!/mrp|date|exp|fssai|price/i.test(bVal)) {
        return {
          value: bVal,
          raw: match[0].trim(),
          is_compliant: true
        };
      }
    }
  }

  return null;
}

// 10. Manufacturer/packer/importer details
function extractManufacturer(text, lines) {
  const mfgPatterns = [
    /(?:manufactured\s*(?:&|and)?\s*packed\s*by|manufactured\s*by|mfd\.?\s*by|packed\s*by|marketed\s*by|imported\s*(?:&|and)?\s*packed\s*by|imported\s*(?:&|and)?\s*distributed\s*by|imported\s*by|pkg\.?\s*by|pkd\.?\s*by)[:\s-]+([^\n]+(?:\n[^\n]+){0,2})/i,
    /([a-z0-9\s.,&-]+(?:pvt\.?\s*ltd|limited|ltd|industries|foods|laboratories|enterprises|cooperative|federation|beverages|bakery)[^\n]*)/i
  ];

  for (const regex of mfgPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const cleaned = match[1].replace(/[\r\n]+/g, ', ').trim();
      if (cleaned.length > 5 && !/^[\d\/\-:\s]+$/.test(cleaned)) {
        return {
          raw: cleaned,
          name: cleaned.split(',')[0].trim(),
          address: cleaned,
          has_pincode: /\b\d{3}\s?\d{3}\b/.test(cleaned)
        };
      }
    }
  }

  for (const line of lines) {
    // Only match if line describes an entity, avoiding lines that are pure dates like "Mfg: 15/08/2024"
    if (
      /manufactur|mfd\s*by|packer|import/i.test(line) && 
      !/^(?:mfg|mfd|pkd)[:\s]*[\d\/\-\.]+/i.test(line) &&
      line.length > 10
    ) {
      return {
        raw: line,
        name: line.replace(/^(?:manufactured\s*by|mfd\s*by|packed\s*by)[:\s-]*/i, '').split(',')[0].trim(),
        address: line,
        has_pincode: /\b\d{3}\s?\d{3}\b/.test(line)
      };
    }
  }

  return null;
}

// 11. Customer care/contact information
function extractConsumerCare(text) {
  const phoneMatch = text.match(/(?:consumer\s*care|customer\s*care|consumer\s*cell|helpline|toll[\s-]*free|call|phone|tel|contact|feedback|queries)[:\s]*([+0-9\s-]{8,18})|(?:1800[-\s]?[0-9]{3}[-\s]?[0-9]{3,4})/i);
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const addressMention = /(?:feedback|queries|complaints|consumer\s*cell|write\s*to)[:\s-]+([^\n]+)/i.exec(text);

  const phone = phoneMatch ? phoneMatch[0].replace(/(?:consumer\s*care|customer\s*care|consumer\s*cell|helpline|toll[\s-]*free|call|phone|tel|contact|feedback|queries)[:\s]*/i, '').trim() : null;
  const email = emailMatch ? emailMatch[1].trim() : null;

  if (phone || email || addressMention) {
    return {
      phone,
      email,
      address: addressMention ? addressMention[1].trim() : null,
      is_complete: Boolean(phone || email)
    };
  }

  return null;
}

// 12. Allergen declarations, where applicable
function extractAllergenDeclaration(text) {
  const allergenMatch = text.match(/(?:allergen(?:\s*declaration|\s*information|\s*advice)?|contains|allergy\s*advice)[:\s-]+([^\n.]+)/i);
  const commonAllergens = /(?:gluten|wheat|milk|nuts?|peanuts?|soy|soya|soybean|egg|fish|crustacean|sulphites?|mustard|sesame|tree\s*nuts)/i;

  if (allergenMatch) {
    const raw = allergenMatch[0].trim();
    const hasDetectedAllergens = commonAllergens.test(raw);
    return {
      is_declared: true,
      has_allergens: hasDetectedAllergens,
      statement: raw,
      raw
    };
  }

  if (commonAllergens.test(text) && /contains/i.test(text)) {
    const snippet = text.match(/contains\s+[a-z\s,]+/i)?.[0] || "Contains common allergen";
    return {
      is_declared: true,
      has_allergens: true,
      statement: snippet,
      raw: snippet
    };
  }

  return null;
}

// 13. Storage/use instructions, where required
function extractStorageInstructions(text) {
  const storageMatch = text.match(/(?:storage(?:\s*instructions|\s*conditions)?|instructions\s*for\s*(?:storage|use)|directions\s*for\s*use)[:\s-]+([^\n.]+)/i);
  if (storageMatch) {
    return {
      is_declared: true,
      instructions: storageMatch[0].trim(),
      raw: storageMatch[0].trim()
    };
  }

  const conditionMatch = text.match(/(?:store|keep)\s+(?:under\s*refrigeration|refrigerated|below\s*\d+°?c|frozen|in\s*a?\s*(?:cool|dry|clean|airtight|hygienic)[a-z\s,&]*|away\s*from\s*(?:direct\s*)?(?:sunlight|heat|moisture))/i);
  if (conditionMatch) {
    return {
      is_declared: true,
      instructions: conditionMatch[0].trim(),
      raw: conditionMatch[0].trim()
    };
  }

  const handlingMatch = text.match(/(?:refrigerate\s*after\s*opening|consume\s*(?:within|immediately)|keep\s*refrigerated|do\s*not\s*freeze)/i);
  if (handlingMatch) {
    return {
      is_declared: true,
      instructions: handlingMatch[0].trim(),
      raw: handlingMatch[0].trim()
    };
  }

  return null;
}

// 14. Country of origin, for imported food
function extractCountryOfOrigin(text, lines, metadata = {}) {
  const isImportedCategory = Boolean(metadata.category && /imported/i.test(metadata.category));
  const isImportedDeclaration = /(?:imported\s*(?:&|and)?\s*(?:distributed|packed)?\s*by|imported\s*food|imported\s*by)/i.test(text);

  const originMatch = text.match(/(?:country\s*of\s*origin|made\s*in|product\s*of|origin)[:\s-]+([a-zA-Z\s]+)/i);
  if (originMatch) {
    const country = originMatch[1].trim().split(/[\n,.]/)[0].trim();
    return {
      country,
      is_imported: !/india/i.test(country),
      raw: originMatch[0].trim()
    };
  }

  if (/made\s*in\s*india|product\s*of\s*india/i.test(text)) {
    return { country: "India", is_imported: false, raw: "Made in India" };
  }

  // Check if specific foreign country is mentioned
  const foreign = text.match(/\b(?:switzerland|germany|usa|china|japan|uk|italy|france|australia|canada|thailand|singapore|belgium|spain|turkey)\b/i);
  if (foreign && (isImportedDeclaration || isImportedCategory || /imported/i.test(text))) {
    return {
      country: foreign[0],
      is_imported: true,
      raw: `Imported from ${foreign[0]}`
    };
  }

  // If declared as imported goods but country of origin is omitted
  if (isImportedCategory || isImportedDeclaration) {
    return {
      country: "Unspecified",
      is_imported: true,
      raw: "Omitted on imported product"
    };
  }

  // Check for domestic Indian manufacturer
  if (/india\b|\bdelhi\b|\bmumbai\b|\bgujarat\b|\bharyana\b|\bpunjab\b|\bmaharashtra\b|\bkarnataka\b|\btamil\s*nadu\b|\bkolkata\b|\bchennai\b|\bhyderabad\b|\bbengaluru\b|\b\d{3}\s?\d{3}\b/i.test(text)) {
    return {
      country: "India",
      is_imported: false,
      raw: "India (Domestic Manufacture)"
    };
  }

  return null;
}

// Legacy helper: MRP
function extractMRP(text) {
  const mrpRegex = /(?:m\.?r\.?p\.?|max(?:imum)?\s*retail\s*price)[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i;
  const match = text.match(mrpRegex);
  if (match) {
    return {
      value: parseFloat(match[1].replace(/,/g, '')),
      raw: match[0],
      includes_taxes: /incl/i.test(text)
    };
  }
  return null;
}

// Legacy helper: USP
function extractUSP(text) {
  const uspMatch = text.match(/(?:u\.?s\.?p\.?|unit\s*sale\s*price)[:\s]*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per)\s*([a-zA-Z]+)/i);
  return uspMatch ? { value: parseFloat(uspMatch[1]), unit: uspMatch[2], raw: uspMatch[0] } : null;
}

// Clarity & OCR readability
function analyzeReadability(text) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const specialRatio = (text.match(/[^a-zA-Z0-9\s]/g) || []).length / (text.length || 1);
  return {
    clarity: specialRatio > 0.35 || wordCount < 5 ? "LOW" : specialRatio > 0.2 ? "MEDIUM" : "HIGH",
    word_count: wordCount
  };
}
