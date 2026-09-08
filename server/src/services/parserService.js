/**
 * Intelligent Declaration Extractor & NLP Regex Parser
 * Extracts statutory fields from raw OCR text according to Legal Metrology Standards.
 */

import { ILLEGAL_UNIT_SYMBOLS, VALID_STANDARDIZED_UNITS } from '../rules/metrologyRules.js';

export function parsePackagingText(rawText = "") {
  const text = rawText.trim();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const parsed = {
    manufacturer: extractManufacturer(text, lines),
    commodity_name: extractCommodityName(text, lines),
    net_quantity: extractNetQuantity(text),
    mfg_date: extractDates(text),
    mrp: extractMRP(text),
    consumer_care: extractConsumerCare(text),
    country_of_origin: extractCountryOfOrigin(text),
    unit_sale_price: extractUSP(text),
    readability: analyzeReadability(text)
  };

  return parsed;
}

function extractManufacturer(text, lines) {
  // Common prefixes in Indian packaged goods
  const mfgPatterns = [
    /(?:mfd\.?\s*by|manufactured\s*(?:&|and)?\s*packed\s*by|packed\s*by|marketed\s*by|imported\s*(?:&|and)?\s*packed\s*by)[:\s-]+([^\n]+(?:\n[^\n]+){0,2})/i,
    /(?:pkg\.?\s*by|pkd\.?\s*by)[:\s-]+([^\n]+(?:\n[^\n]+){0,2})/i,
    /([a-z0-9\s.,&-]+(?:pvt\.?\s*ltd|limited|ltd|industries|foods|laboratories|enterprises|cooperative|federation)[^\n]*)/i
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

  // Fallback: search lines for keywords
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

function extractCommodityName(text, lines) {
  // Generic or common name
  const namePatterns = [
    /(?:commodity|generic\s*name|product\s*name|item)[:\s-]+([^\n]+)/i,
    /(?:pure|pasteurised|instant|refined|organic|table)\s+([a-z\s]+(?:butter|powder|oil|shampoo|soap|truffles|cookies|rice|flour|salt|tea|coffee|detergent))/i
  ];

  for (const regex of namePatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // If first line looks like a title
  if (lines.length > 0 && lines[0].length < 40 && !/mrp|net|date|call|email/i.test(lines[0])) {
    return lines[0];
  }

  return "Packaged Commodity";
}

function extractNetQuantity(text) {
  // Matches "Net Qty: 100 g", "Net Weight: 500 gms", "Net Content: 750 ml", "500g", "1 kg"
  const regex = /(?:net\s*(?:qty|quantity|weight|wt|contents?|volume)?[:\s]*)?(\d+(?:\.\d+)?)\s*([a-zA-Z.]+)\b/i;
  
  // Specific lookups for Net Qty line
  const netLineMatch = text.match(/(?:net\s*(?:qty|quantity|weight|wt|contents?|volume))[:\s]*(\d+(?:\.\d+)?)\s*([a-zA-Z.]+)/i);
  const match = netLineMatch || text.match(/\b(\d+(?:\.\d+)?)\s*(gms|gm|g\.|g|kg|kgs|kilos|ml|mls|ml\.|l|ltr|ltrs|cl|m|cm|mm|units?|pieces?|N|u)\b/i);

  if (match) {
    const val = parseFloat(match[1]);
    const rawUnit = match[2].trim();
    const unitLower = rawUnit.toLowerCase();

    // Check against illegal unit symbols
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
      error = `Unrecognized unit symbol '${rawUnit}'. Must adhere to Legal Metrology Rule 12 & 13.`;
    }

    return {
      value: val,
      unit: rawUnit,
      standardized_unit: suggestedUnit,
      raw: `${val} ${rawUnit}`,
      is_standard: isStandard,
      error: error
    };
  }

  return null;
}

function extractDates(text) {
  // Checks MM/YYYY, MM/YY, Month YYYY, "Pkd Date", "Mfg Date", "Best Before"
  const datePatterns = [
    /(?:mfg|mfd|packed|pkd|date\s*of\s*pkd|date\s*of\s*mfg|dom|dop)[:\s.-]*([0-1]?\d\/(?:20)?\d{2})/i,
    /(?:mfg|mfd|packed|pkd)[:\s.-]*([a-z]{3,9}\s+(?:20)?\d{2,4})/i,
    /\b([0-1]\d\/(?:20\d{2}|\d{2}))\b/
  ];

  for (const regex of datePatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const rawDate = match[1].trim();
      const isCompliantFormat = /^([0-1]?\d\/(?:20\d{2}|\d{2}))|([a-z]{3,9}\s+20\d{2})$/i.test(rawDate);
      return {
        date: rawDate,
        is_compliant: isCompliantFormat,
        error: isCompliantFormat ? null : "Non-standard date format. Must be MM/YYYY or Month YYYY as per Rule 6(1)(d)."
      };
    }
  }

  return null;
}

function extractMRP(text) {
  // Maximum Retail Price declaration
  // Must check "inclusive of all taxes" or "incl. of all taxes"
  const mrpRegex = /(?:m\.?r\.?p\.?|max(?:imum)?\s*retail\s*price|retail\s*price)[:\s]*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d{1,2})?)/i;
  const match = text.match(mrpRegex);

  const rawMrpSection = (text.match(/(?:m\.?r\.?p\.?|maximum\s*retail\s*price)[^\n.]*(?:\n[^\n.]*)?/i) || [""])[0];

  const hasTaxClause = /(?:incl(?:usive)?\.?\s*of\s*all\s*taxes|incl\.\s*taxes)/i.test(text);

  if (match) {
    const price = parseFloat(match[1]);
    return {
      value: price,
      raw: rawMrpSection.trim() || `MRP Rs. ${price}`,
      includes_taxes: hasTaxClause,
      error: hasTaxClause ? null : "Missing mandatory statutory clause '(inclusive of all taxes)'. Mandatory under Rule 6(1)(e)."
    };
  }

  // Fallback if ₹ or Rs followed by digits
  const fallback = text.match(/(?:rs\.?|₹)\s*(\d+(?:\.\d{1,2})?)/i);
  if (fallback) {
    return {
      value: parseFloat(fallback[1]),
      raw: fallback[0],
      includes_taxes: hasTaxClause,
      error: "Omitted explicit 'MRP' declaration and tax inclusion clause."
    };
  }

  return null;
}

function extractConsumerCare(text) {
  // Phone/toll free: 1800-xxx-xxxx, 011-xxxx, etc.
  const phoneMatch = text.match(/(?:call|phone|tel|contact|helpline|care)[:\s]*([0-9\s-]{8,15})|(?:1800[-\s]?[0-9]{3}[-\s]?[0-9]{3,4})/i);
  
  // Email: something@domain.ext
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

  // Postal/Physical address
  const addressMention = /(?:feedback|queries|complaints|consumer\s*cell|write\s*to)[:\s-]+([^\n]+)/i.exec(text);

  const phone = phoneMatch ? phoneMatch[0].replace(/(?:call|phone|tel|contact|helpline|care)[:\s]*/i, '').trim() : null;
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

function extractCountryOfOrigin(text) {
  const originMatch = text.match(/(?:country\s*of\s*origin|made\s*in|origin|product\s*of)[:\s-]+([a-zA-Z\s]+)/i);
  if (originMatch) {
    return originMatch[1].trim().split(/[\n,.]/)[0].trim();
  }

  if (/made\s*in\s*india/i.test(text)) return "India";
  if (/product\s*of\s*india/i.test(text)) return "India";
  if (/switzerland|germany|usa|china|japan|uk|italy|france/i.test(text)) {
    const found = text.match(/switzerland|germany|usa|china|japan|uk|italy|france/i);
    return found ? found[0] : null;
  }

  return null;
}

function extractUSP(text) {
  // Unit Sale Price: e.g. "USP: ₹ 0.58 / g" or "Rs. 1.20 per ml"
  const uspMatch = text.match(/(?:u\.?s\.?p\.?|unit\s*sale\s*price)[:\s]*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per)\s*([a-zA-Z]+)/i);
  if (uspMatch) {
    return {
      value: parseFloat(uspMatch[1]),
      unit: uspMatch[2].trim(),
      raw: uspMatch[0].trim()
    };
  }
  return null;
}

function analyzeReadability(text) {
  // Character clarity heuristics
  const lineCount = text.split('\n').filter(Boolean).length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const specialCharRatio = (text.match(/[^a-zA-Z0-9\s]/g) || []).length / (text.length || 1);

  let clarity = "HIGH";
  let fontEstimate = ">= 3.0mm (Compliant)";

  if (specialCharRatio > 0.35 || wordCount < 5) {
    clarity = "LOW";
    fontEstimate = "Unclear / Pixelated";
  } else if (specialCharRatio > 0.2) {
    clarity = "MEDIUM";
    fontEstimate = "~2.0mm - 2.5mm (Borderline)";
  }

  return {
    clarity,
    estimated_font_size: fontEstimate,
    word_count: wordCount,
    line_count: lineCount
  };
}
