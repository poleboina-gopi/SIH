/**
 * Intelligent Packaging Declaration Extractor & NLP Regex Parser
 * Extracts all 14 statutory FSSAI food product packaging declarations from raw OCR text.
 */

import { ILLEGAL_UNIT_SYMBOLS, VALID_STANDARDIZED_UNITS } from '../rules/foodRules.js';

export function parsePackagingText(rawText = "") {
  const text = (rawText || "").trim();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const parsed = {
    // 1. Name of the food/product
    commodity_name: extractProductName(text, lines),

    // 2. List of ingredients
    ingredients: extractIngredients(text),

    // 3. Nutritional information
    nutritional_info: extractNutritionalInfo(text),

    // 4. Net quantity
    net_quantity: extractNetQuantity(text),

    // 5. Vegetarian / non-vegetarian symbol
    veg_non_veg: extractVegNonVeg(text),

    // 6. FSSAI logo and licence number
    fssai_license: extractFssaiLicense(text),

    // 7. Date of manufacture/packing
    mfg_date: extractMfgDate(text),

    // 8. Expiry / use-by or best-before date
    expiry_date: extractExpiryDate(text),

    // 9. Batch/Lot/Code number
    batch_number: extractBatchNumber(text),

    // 10. Manufacturer/packer/importer details
    manufacturer: extractManufacturer(text, lines),

    // 11. Customer care/contact information
    consumer_care: extractConsumerCare(text),

    // 12. Allergen declarations, where applicable
    allergen_declaration: extractAllergenDeclaration(text),

    // 13. Storage/use instructions, where required
    storage_instructions: extractStorageInstructions(text),

    // 14. Country of origin, for imported food
    country_of_origin: extractCountryOfOrigin(text),

    // Retain legacy fields for UI backward-compatibility
    mrp: extractMRP(text),
    unit_sale_price: extractUSP(text),
    readability: analyzeReadability(text)
  };

  return parsed;
}

// 1. Name of the food/product
function extractProductName(text, lines) {
  const explicitPrefix = text.match(/(?:product\s*name|name\s*of\s*(?:the\s*)?food|commodity|generic\s*name|item)[:\s-]+([^\n]+)/i);
  if (explicitPrefix && explicitPrefix[1]) {
    const val = explicitPrefix[1].trim();
    if (val.length >= 3 && !/ingredients|nutrition|mrp|net/i.test(val)) {
      return val;
    }
  }

  // Check headline lines before "Ingredients:" or "Nutrition" for prominent product name
  for (const line of lines.slice(0, 5)) {
    const clean = line.trim();
    if (
      clean.length >= 4 && 
      clean.length <= 70 && 
      !/^(?:ingredients|nutrition|nutritive|per\s*100|mrp|net\s*qty|mfd|pkd|exp|best\s*before|fssai|lic|batch|consumer|for\s*feedback|storage|country|100%\s*veg|vegetarian|pure\s*veg|non[\s-]*veg)/i.test(clean)
    ) {
      return clean;
    }
  }

  return "Packaged Food Product";
}

// 2. List of ingredients
function extractIngredients(text) {
  const ingRegex = /(?:ingredients|contains\s*ingredients|list\s*of\s*ingredients)[:\s-]+([\s\S]+?)(?=(?:nutri|storage|mfd|pkd|mrp|net\s*qty|fssai|lic|batch|best\s*before|exp|customer|consumer|allergen|mfg|packed|marketed|$))/i;
  const match = text.match(ingRegex);

  if (match && match[1]) {
    const rawIng = match[1].trim().replace(/[\r\n]+/g, ' ');
    // Split ingredients by comma, semicolon or parentheses
    const items = rawIng.split(/[,;•|]/).map(s => s.trim()).filter(s => s.length > 1);
    if (items.length > 0) {
      return {
        raw: rawIng.slice(0, 300),
        items: items.slice(0, 25),
        count: items.length,
        has_heading: true
      };
    }
  }

  // Keyword check
  if (/ingredients\s*:/i.test(text)) {
    return {
      raw: "Ingredients declared on label",
      items: ["Ingredients listed"],
      count: 1,
      has_heading: true
    };
  }

  return null;
}

// 3. Nutritional information
function extractNutritionalInfo(text) {
  const nutritionHeader = /(?:nutritional?\s*information|nutrition\s*facts|nutritive\s*values?|per\s*100\s*(?:g|ml)|approx(?:\.|\s*values)?)/i.test(text);

  // Look for key mandatory parameters
  const energy = text.match(/(?:energy|calories)[:\s-]*([\d.]+)\s*(?:kcal|kj)?/i);
  const protein = text.match(/(?:protein)[:\s-]*([\d.]+)\s*g?/i);
  const carbs = text.match(/(?:carbohydrate|carbs)[:\s-]*([\d.]+)\s*g?/i);
  const totalSugars = text.match(/(?:total\s*sugars?|sugars?)[:\s-]*([\d.]+)\s*g?/i);
  const addedSugars = text.match(/(?:added\s*sugars?)[:\s-]*([\d.]+)\s*g?/i);
  const fat = text.match(/(?:total\s*fat|fat)[:\s-]*([\d.]+)\s*g?/i);
  const satFat = text.match(/(?:saturated\s*fat)[:\s-]*([\d.]+)\s*g?/i);
  const transFat = text.match(/(?:trans\s*fat)[:\s-]*([\d.]+)\s*g?/i);
  const sodium = text.match(/(?:sodium)[:\s-]*([\d.]+)\s*(?:mg|g)?/i);

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
      raw: (text.match(/(?:nutritional?\s*information|nutrition\s*facts)[\s\S]{10,250}/i)?.[0] || "Nutritional Information Declared").replace(/[\r\n]+/g, ' ')
    };
  }

  return null;
}

// 4. Net quantity
function extractNetQuantity(text) {
  const netLineMatch = text.match(/(?:net\s*(?:qty|quantity|weight|wt|contents?|volume))[:\s]*(\d+(?:\.\d+)?)\s*([a-zA-Z.]+)/i);
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
function extractVegNonVeg(text) {
  const vegMatch = text.match(/\b(?:100%\s*vegetarian|vegetarian|pure\s*veg|veg\s*(?:food|product|logo|symbol)?|green\s*dot)\b/i);
  const nonVegMatch = text.match(/\b(?:non[\s-]*vegetarian|contains\s*(?:egg|meat|chicken|fish|pork|beef)|non[\s-]*veg|brown\s*triangle)\b/i);

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

  return null;
}

// 6. FSSAI logo and licence number
function extractFssaiLicense(text) {
  // FSSAI license numbers in India are exactly 14 numeric digits:
  // e.g., "Lic. No. 10012345678901" or "fssai 10012345678901" or standalone 14 digits near fssai
  const hasFssaiLogo = /fssai|food\s*safety\s*and\s*standards/i.test(text);

  const licPatterns = [
    /(?:lic(?:ence)?\.?\s*(?:no\.?|number)?|fssai(?:\s*lic(?:ence)?)?)[:\s-]*([0-9]{14})\b/i,
    /(?:lic(?:ence)?\.?\s*(?:no\.?|number)?)[:\s-]*([0-9\s-]{14,18})/i,
    /\b([0-9]{14})\b/
  ];

  for (const regex of licPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const cleanDigits = match[1].replace(/[\s-]/g, '');
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
    /(?:mfg|mfd|date\s*of\s*mfg|manufactur(?:ed)?|date\s*of\s*pack(?:ing)?|pkd|packed)[:\s.-]*\b([0-3]?\d[\/\-\.][0-1]?\d[\/\-\.](?:20\d{2}|\d{2}))\b/i,
    /(?:mfg|mfd|date\s*of\s*mfg|manufactur(?:ed)?|date\s*of\s*pack(?:ing)?|pkd|packed)[:\s.-]*\b([0-1]?\d[\/\-\.](?:20\d{2}|\d{2}))\b/i,
    /(?:mfg|mfd|date\s*of\s*mfg|pkd|packed)[:\s.-]*\b([a-z]{3,9}\s+(?:20)?\d{2,4})\b/i,
    /\b(?:mfg|pkd)[:\s]*([0-9]{2}[\/\-][0-9]{4})\b/i
  ];

  for (const regex of datePatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const rawDate = match[1].trim();
      const isDDMMYYYY = /^(?:0?[1-9]|[12]\d|3[01])[\/\-\.](?:0?[1-9]|1[0-2])[\/\-\.](?:20\d{2}|\d{2})$/.test(rawDate);
      const isMMYYYY = /^(?:0?[1-9]|1[0-2])[\/\-\.](?:20\d{2}|\d{2})$/.test(rawDate);
      const isMonthYYYY = /^[a-z]{3,9}\s+(?:20)?\d{2,4}$/i.test(rawDate);

      const isCompliant = isDDMMYYYY || isMMYYYY || isMonthYYYY;
      return {
        date: rawDate,
        raw: match[0].trim(),
        format: isDDMMYYYY ? "DD/MM/YYYY" : isMMYYYY ? "MM/YYYY" : "Month YYYY",
        is_compliant: isCompliant,
        error: isCompliant ? null : "Invalid manufacture date format. Prescribed: DD/MM/YYYY, MM/YYYY, or Month YYYY."
      };
    }
  }

  return null;
}

// 8. Expiry / use-by or best-before date
function extractExpiryDate(text) {
  // Best Before XX Months or Expiry Date
  const expPatterns = [
    /(?:best\s*before|use\s*by|expiry\s*(?:date)?|exp\.?\s*date|exp\.?)[:\s.-]*\b([0-3]?\d[\/\-\.][0-1]?\d[\/\-\.](?:20\d{2}|\d{2}))\b/i,
    /(?:best\s*before|use\s*by|expiry\s*(?:date)?|exp\.?\s*date|exp\.?)[:\s.-]*\b([0-1]?\d[\/\-\.](?:20\d{2}|\d{2}))\b/i,
    /(?:best\s*before|use\s*by|expiry)[:\s.-]*\b([a-z]{3,9}\s+(?:20)?\d{2,4})\b/i,
    /(?:best\s*before)[:\s-]+(\d{1,2}\s*(?:months?|days?|weeks?|years?)\s*(?:from\s*(?:date\s*of\s*)?(?:mfg|packing|manufacture|pkd))?)/i,
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
    /(?:batch\s*(?:no\.?|number|code)|lot\s*(?:no\.?|number|code)|b\.?\s*no\.?|lot)[:\s-]+([a-z0-9\/-]{3,20})/i,
    /\b(?:b\.?\s*no|batch)[:\s]*([a-z0-9]{3,15})\b/i
  ];

  for (const regex of batchPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const bVal = match[1].trim();
      if (!/mrp|date|exp|fssai/i.test(bVal)) {
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
    /(?:mfd\.?\s*by|manufactured\s*(?:&|and)?\s*packed\s*by|packed\s*by|marketed\s*by|imported\s*(?:&|and)?\s*packed\s*by)[:\s-]+([^\n]+(?:\n[^\n]+){0,2})/i,
    /(?:pkg\.?\s*by|pkd\.?\s*by)[:\s-]+([^\n]+(?:\n[^\n]+){0,2})/i,
    /([a-z0-9\s.,&-]+(?:pvt\.?\s*ltd|limited|ltd|industries|foods|laboratories|enterprises|cooperative|federation|beverages|bakery)[^\n]*)/i
  ];

  for (const regex of mfgPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const cleaned = match[1].replace(/[\r\n]+/g, ', ').trim();
      if (cleaned.length > 5) {
        return {
          raw: cleaned,
          name: cleaned.split(',')[0].trim(),
          address: cleaned,
          has_pincode: /\b\d{6}\b/.test(cleaned)
        };
      }
    }
  }

  for (const line of lines) {
    if (/mfd|mfg|manufactur|packer|import/i.test(line) && line.length > 10) {
      return {
        raw: line,
        name: line,
        address: line,
        has_pincode: /\b\d{6}\b/.test(line)
      };
    }
  }

  return null;
}

// 11. Customer care/contact information
function extractConsumerCare(text) {
  const phoneMatch = text.match(/(?:consumer\s*care|customer\s*care|consumer\s*cell|helpline|toll[\s-]*free|call|phone|tel|contact)[:\s]*([+0-9\s-]{8,18})|(?:1800[-\s]?[0-9]{3}[-\s]?[0-9]{3,4})/i);
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const addressMention = /(?:feedback|queries|complaints|consumer\s*cell|write\s*to)[:\s-]+([^\n]+)/i.exec(text);

  const phone = phoneMatch ? phoneMatch[0].replace(/(?:consumer\s*care|customer\s*care|consumer\s*cell|helpline|toll[\s-]*free|call|phone|tel|contact)[:\s]*/i, '').trim() : null;
  const email = emailMatch ? emailMatch[1].trim() : null;

  if (phone || email || addressMention) {
    return {
      phone,
      email,
      address: addressMention ? addressMention[1].trim() : null,
      is_complete: Boolean(phone && email)
    };
  }

  return null;
}

// 12. Allergen declarations, where applicable
function extractAllergenDeclaration(text) {
  const allergenMatch = text.match(/(?:allergen(?:\s*declaration|\s*information|\s*advice)?|contains|allergy\s*advice)[:\s-]+([^\n.]+)/i);
  const commonAllergens = /(?:gluten|wheat|milk|nuts?|peanuts?|soy|soya|soybean|egg|fish|crustacean|sulphite|tree\s*nuts)/i;

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

  // Not declared or absent
  return null;
}

// 13. Storage/use instructions, where required
function extractStorageInstructions(text) {
  const storageMatch = text.match(/(?:storage(?:\s*instructions|\s*conditions)?|store\s*in|keep\s*in|instructions\s*for\s*(?:storage|use)|directions\s*for\s*use)[:\s-]+([^\n.]+)/i);
  
  if (storageMatch) {
    return {
      is_declared: true,
      instructions: storageMatch[0].trim(),
      raw: storageMatch[0].trim()
    };
  }

  if (/store\s*in\s*a?\s*cool(?:,|\s*and)?\s*dry\s*place|refrigerate\s*after\s*opening|keep\s*away\s*from\s*sunlight/i.test(text)) {
    const found = text.match(/store\s*in\s*a?\s*cool(?:,|\s*and)?\s*dry\s*place|refrigerate\s*after\s*opening|keep\s*away\s*from\s*sunlight/i);
    return {
      is_declared: true,
      instructions: found[0],
      raw: found[0]
    };
  }

  return null;
}

// 14. Country of origin, for imported food
function extractCountryOfOrigin(text) {
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

  const foreign = text.match(/switzerland|germany|usa|china|japan|uk|italy|france|australia|canada|thailand/i);
  if (foreign) {
    return {
      country: foreign[0],
      is_imported: true,
      raw: `Imported from ${foreign[0]}`
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
