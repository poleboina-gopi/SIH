/**
 * Legal Metrology (Packaged Commodities) Rules, 2011 - Statutory Rules Specification
 * Enacted under the Legal Metrology Act, 2009 (Act No. 1 of 2010), India.
 */

export const STATUTORY_RULES = [
  {
    id: "RULE_6_1_A",
    ruleCode: "Rule 6(1)(a)",
    title: "Manufacturer / Packer / Importer Details",
    category: "Manufacturer Information",
    description: "Every package shall bear the name and complete physical address of the manufacturer, or where manufacturer is not packer, name and address of manufacturer and packer.",
    severity: "CRITICAL",
    penaltySection: "Section 36(1) of Legal Metrology Act, 2009",
    fineRange: "₹25,000 for first offence, up to ₹50,000 for second offence",
    isActive: true,
  },
  {
    id: "RULE_6_1_B",
    ruleCode: "Rule 6(1)(b)",
    title: "Generic or Common Name of Commodity",
    category: "Product Identification",
    description: "Every package shall bear the common or generic names of the commodity contained in the package.",
    severity: "MAJOR",
    penaltySection: "Section 36(1) of Legal Metrology Act, 2009",
    fineRange: "₹25,000 for first offence",
    isActive: true,
  },
  {
    id: "RULE_6_1_C",
    ruleCode: "Rule 6(1)(c)",
    title: "Net Quantity Declaration",
    category: "Net Quantity",
    description: "Every package shall bear the net quantity in terms of standard unit of weight, measure or number (Rules 12 and 13). Non-standard units (e.g., 'gms', 'gm', 'g.', 'ml.', 'kilos') are strictly prohibited.",
    severity: "CRITICAL",
    penaltySection: "Section 36(1) of Legal Metrology Act, 2009",
    fineRange: "₹25,000 to ₹50,000",
    isActive: true,
  },
  {
    id: "RULE_6_1_D",
    ruleCode: "Rule 6(1)(d)",
    title: "Month & Year of Manufacture / Packing / Import",
    category: "Date Information",
    description: "Every package shall bear the month and year in which commodity is manufactured or pre-packed or imported (Format: MM/YYYY or Month YYYY).",
    severity: "CRITICAL",
    penaltySection: "Section 36(1) of Legal Metrology Act, 2009",
    fineRange: "₹25,000 for first offence",
    isActive: true,
  },
  {
    id: "RULE_6_1_E",
    ruleCode: "Rule 6(1)(e)",
    title: "Maximum Retail Price (MRP) & Tax Clause",
    category: "Pricing",
    description: "Every package shall declare Maximum Retail Price (MRP) including the mandatory phrase: 'inclusive of all taxes' or 'incl. of all taxes'. Dual MRP or omitting tax declaration is illegal.",
    severity: "CRITICAL",
    penaltySection: "Section 36(1) & 36(2) of Legal Metrology Act, 2009",
    fineRange: "₹25,000 to ₹1,00,000 or imprisonment",
    isActive: true,
  },
  {
    id: "RULE_6_1_M",
    ruleCode: "Rule 6(1)(m)",
    title: "Country of Origin",
    category: "Origin Details",
    description: "For imported commodities, the name of the country of origin or manufacture shall be prominently mentioned.",
    severity: "MAJOR",
    penaltySection: "Section 36(1) of Legal Metrology Act, 2009",
    fineRange: "₹25,000 for first offence",
    isActive: true,
  },
  {
    id: "RULE_6_1_N",
    ruleCode: "Rule 6(1)(n)",
    title: "Consumer Care Details",
    category: "Consumer Redressal",
    description: "Every package shall bear name, address, telephone number and email address of person/office to be contacted in case of consumer complaints.",
    severity: "MAJOR",
    penaltySection: "Section 36(1) of Legal Metrology Act, 2009",
    fineRange: "₹25,000 for first offence",
    isActive: true,
  },
  {
    id: "RULE_7",
    ruleCode: "Rule 7",
    title: "Minimum Height of Numerals & Letters (Font Size)",
    category: "Display & Readability",
    description: "The height of any numeral and letter shall not be less than the minimum statutory heights prescribed in the Second Schedule based on net quantity/package area.",
    severity: "MINOR",
    penaltySection: "Section 36(1) of Legal Metrology Act, 2009",
    fineRange: "₹20,000 to ₹25,000",
    isActive: true,
  },
  {
    id: "RULE_6_11",
    ruleCode: "Rule 6(11)",
    title: "Unit Sale Price (USP)",
    category: "Pricing Transparency",
    description: "For packages containing net quantity greater than 1kg/1L or containing multiple items, unit sale price (e.g., ₹/g, ₹/ml, ₹/unit) must be declared.",
    severity: "MINOR",
    penaltySection: "Section 36(1) of Legal Metrology Act, 2009",
    fineRange: "₹25,000",
    isActive: true,
  }
];

export const VALID_STANDARDIZED_UNITS = [
  "g", "kg", "mg",
  "ml", "l", "cl",
  "m", "cm", "mm",
  "u", "N", "pieces", "units"
];

export const ILLEGAL_UNIT_SYMBOLS = [
  { pattern: /\b(?:gms|gm|g\.)\b/i, replacement: "g", reason: "Standard symbol for gram is 'g' (no 's', no period)" },
  { pattern: /\b(?:kgs|kilos|kg\.)\b/i, replacement: "kg", reason: "Standard symbol for kilogram is 'kg'" },
  { pattern: /\b(?:ml\.|mls)\b/i, replacement: "ml", reason: "Standard symbol for millilitre is 'ml'" },
  { pattern: /\b(?:ltrs|ltr|litres|liters)\b/i, replacement: "l", reason: "Standard symbol for litre is 'l'" },
  { pattern: /\b(?:m\.|mtr|mtrs)\b/i, replacement: "m", reason: "Standard symbol for metre is 'm'" },
  { pattern: /\b(?:cms|cm\.)\b/i, replacement: "cm", reason: "Standard symbol for centimetre is 'cm'" }
];

export const STATUTORY_PENALTIES = {
  firstOffence: {
    fine: "₹25,000",
    noticePeriodDays: 15,
    provision: "Section 36(1), Legal Metrology Act, 2009"
  },
  secondOffence: {
    fine: "₹50,000",
    noticePeriodDays: 7,
    provision: "Section 36(2), Legal Metrology Act, 2009"
  },
  subsequentOffence: {
    fine: "Up to ₹1,00,000 or imprisonment up to 1 year or both",
    noticePeriodDays: 3,
    provision: "Section 36(2), Legal Metrology Act, 2009"
  }
};
