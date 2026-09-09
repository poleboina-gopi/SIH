/**
 * Legal Metrology Compliance Validation Engine
 * Evaluates extracted product packaging declarations against
 * Legal Metrology (Packaged Commodities) Rules, 2011.
 */

import { STATUTORY_RULES, STATUTORY_PENALTIES } from '../rules/metrologyRules.js';

export function evaluateCompliance(parsedFields = {}, activeRules = STATUTORY_RULES) {
  const violations = [];
  const rulesMap = new Map(activeRules.map(r => [r.id, r]));

  // 1. Check Rule 6(1)(a) - Manufacturer / Packer / Importer
  const rule61a = rulesMap.get("RULE_6_1_A");
  if (rule61a?.isActive) {
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
      violations.push({
        rule_code: "Rule 6(1)(a)",
        rule_id: "RULE_6_1_A",
        violation_type: "MISSING_MANUFACTURER_DECLARATION",
        severity: "CRITICAL",
        description: "Package lacks mandatory declaration of the name and complete address of the manufacturer / packer / importer.",
        statutory_provision: "Section 36(1), Legal Metrology Act, 2009",
        penalty_fine: "₹25,000",
        field: "manufacturer"
      });
    } else if (!hasPincode && mfgAddress.length < 20) {
      violations.push({
        rule_code: "Rule 6(1)(a)",
        rule_id: "RULE_6_1_A",
        violation_type: "INCOMPLETE_MANUFACTURER_ADDRESS",
        severity: "MAJOR",
        description: `Incomplete manufacturer address detected ('${mfgRaw || mfgAddress || mfgName}'). Pin code or district name omitted.`,
        statutory_provision: "Rule 6(1)(a) of Legal Metrology (PC) Rules, 2011",
        penalty_fine: "₹25,000",
        field: "manufacturer"
      });
    }
  }

  // 2. Check Rule 6(1)(b) - Generic or Common Commodity Name
  const rule61b = rulesMap.get("RULE_6_1_B");
  if (rule61b?.isActive) {
    const cName = typeof parsedFields?.commodity_name === 'string'
      ? parsedFields.commodity_name.trim()
      : (parsedFields?.commodity_name?.name || '');
    if (!cName || cName.toLowerCase() === "packaged commodity") {
      violations.push({
        rule_code: "Rule 6(1)(b)",
        rule_id: "RULE_6_1_B",
        violation_type: "MISSING_GENERIC_COMMODITY_NAME",
        severity: "MAJOR",
        description: "Package omits prominent declaration of the common or generic name of the commodity.",
        statutory_provision: "Rule 6(1)(b) of Legal Metrology (PC) Rules, 2011",
        penalty_fine: "₹25,000",
        field: "commodity_name"
      });
    }
  }

  // 3. Check Rule 6(1)(c) - Net Quantity & Standard Metric Units
  const rule61c = rulesMap.get("RULE_6_1_C");
  if (rule61c?.isActive) {
    const nq = parsedFields?.net_quantity;
    const nqRaw = typeof nq === 'string' ? nq : (nq?.raw || (nq?.value ? `${nq.value} ${nq.unit || ''}` : ''));
    let isStandard = typeof nq === 'object' && nq !== null && typeof nq.is_standard === 'boolean' ? nq.is_standard : null;
    let nqUnit = typeof nq === 'object' && nq !== null && nq.unit ? nq.unit : '';
    let nqError = typeof nq === 'object' && nq !== null ? nq.error : null;

    if (!nq || (!nqRaw && (typeof nq === 'object' && !nq.value))) {
      violations.push({
        rule_code: "Rule 6(1)(c)",
        rule_id: "RULE_6_1_C",
        violation_type: "MISSING_NET_QUANTITY",
        severity: "CRITICAL",
        description: "Package omits mandatory declaration of net quantity in standard units of weight, measure, or count.",
        statutory_provision: "Section 36(1), Legal Metrology Act, 2009",
        penalty_fine: "₹25,000",
        field: "net_quantity"
      });
    } else {
      if (isStandard === null && nqRaw) {
        const match = nqRaw.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z.]+)/);
        if (match) {
          nqUnit = match[2].toLowerCase().replace(/\.$/, '');
          const illegalUnits = ['gm', 'gms', 'g.', 'kg.', 'kgs', 'kilos', 'mls', 'ml.', 'ltr', 'ltrs'];
          if (illegalUnits.includes(nqUnit)) {
            isStandard = false;
            nqError = `Illegal symbol '${match[2]}'. Standard unit is '${nqUnit.startsWith('k') ? 'kg' : nqUnit.startsWith('l') ? 'l' : nqUnit.startsWith('m') ? 'ml' : 'g'}'.`;
          } else {
            isStandard = true;
          }
        } else {
          isStandard = true;
        }
      }

      if (isStandard === false) {
        violations.push({
          rule_code: "Rule 6(1)(c)",
          rule_id: "RULE_6_1_C",
          violation_type: "NON_STANDARD_UNIT_SYMBOL",
          severity: "CRITICAL",
          description: `Net quantity uses illegal symbol '${nqUnit || nqRaw}'. ${nqError || 'Only standard symbols (g, kg, ml, l, etc.) are permissible.'}`,
          statutory_provision: "Rule 12 & 13 of Legal Metrology (PC) Rules, 2011 read with Sec 36(1) LM Act",
          penalty_fine: "₹25,000 to ₹50,000",
          field: "net_quantity"
        });
      }
    }
  }

  // 4. Check Rule 6(1)(d) - Month & Year of Mfg/Packing/Import
  const rule61d = rulesMap.get("RULE_6_1_D");
  if (rule61d?.isActive) {
    const mfgDate = parsedFields?.mfg_date;
    const dateStr = typeof mfgDate === 'string' ? mfgDate : (mfgDate?.date || mfgDate?.raw || '');
    let isCompliantDate = typeof mfgDate === 'object' && mfgDate !== null && typeof mfgDate.is_compliant === 'boolean'
      ? mfgDate.is_compliant
      : null;

    if (!mfgDate || (!dateStr && (typeof mfgDate === 'object' && !mfgDate.date))) {
      violations.push({
        rule_code: "Rule 6(1)(d)",
        rule_id: "RULE_6_1_D",
        violation_type: "MISSING_MFG_DATE",
        severity: "CRITICAL",
        description: "Package omits mandatory declaration of month and year of manufacture, packing, or import.",
        statutory_provision: "Section 36(1), Legal Metrology Act, 2009",
        penalty_fine: "₹25,000",
        field: "mfg_date"
      });
    } else {
      if (isCompliantDate === null && dateStr) {
        const dateRegex = /^(?:0[1-9]|1[0-2])\/(?:20\d{2}|\d{2})$|^(?:0[1-9]|[12]\d|3[01])\/(?:0[1-9]|1[0-2])\/(?:20\d{2}|\d{2})$|^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(?:20\d{2}|\d{2})$/i;
        isCompliantDate = dateRegex.test(dateStr.trim());
      }

      if (isCompliantDate === false) {
        violations.push({
          rule_code: "Rule 6(1)(d)",
          rule_id: "RULE_6_1_D",
          violation_type: "INVALID_DATE_FORMAT",
          severity: "MAJOR",
          description: `Date '${dateStr || 'Unspecified'}' violates prescribed format (must be MM/YYYY or Month YYYY).`,
          statutory_provision: "Rule 6(1)(d) of Legal Metrology (PC) Rules, 2011",
          penalty_fine: "₹20,000",
          field: "mfg_date"
        });
      }
    }
  }

  // 5. Check Rule 6(1)(e) - MRP & Tax Clause
  const rule61e = rulesMap.get("RULE_6_1_E");
  if (rule61e?.isActive) {
    const mrp = parsedFields?.mrp;
    const mrpRaw = typeof mrp === 'string' ? mrp : (mrp?.raw || (mrp?.value ? `Rs. ${mrp.value}` : ''));
    let includesTaxes = typeof mrp === 'object' && mrp !== null && typeof mrp.includes_taxes === 'boolean'
      ? mrp.includes_taxes
      : null;
    let hasCurrencySymbol = typeof mrp === 'object' && mrp !== null && typeof mrp.has_currency_symbol === 'boolean'
      ? mrp.has_currency_symbol
      : null;

    if (!mrp || (!mrpRaw && (typeof mrp === 'object' && !mrp.value))) {
      violations.push({
        rule_code: "Rule 6(1)(e)",
        rule_id: "RULE_6_1_E",
        violation_type: "MISSING_MRP",
        severity: "CRITICAL",
        description: "Package fails to declare Maximum Retail Price (MRP).",
        statutory_provision: "Section 36(1) & (2) of Legal Metrology Act, 2009",
        penalty_fine: "₹25,000 to ₹1,00,000",
        field: "mrp"
      });
    } else {
      if (includesTaxes === null && mrpRaw) {
        includesTaxes = /incl\w*\s*(?:of)?\s*all\s*taxes/i.test(mrpRaw);
      }
      if (hasCurrencySymbol === null && mrpRaw) {
        hasCurrencySymbol = /(?:₹|rs\.?|inr)/i.test(mrpRaw);
      }

      if (includesTaxes === false) {
        violations.push({
          rule_code: "Rule 6(1)(e)",
          rule_id: "RULE_6_1_E",
          violation_type: "MISSING_TAX_CLAUSE",
          severity: "CRITICAL",
          description: "Maximum Retail Price declaration fails to mention mandatory statutory clause '(inclusive of all taxes)' or '(incl. of all taxes)'.",
          statutory_provision: "Rule 6(1)(e) of Legal Metrology (PC) Rules, 2011",
          penalty_fine: "₹25,000",
          field: "mrp"
        });
      } else if (hasCurrencySymbol === false) {
        violations.push({
          rule_code: "Rule 6(1)(e)",
          rule_id: "RULE_6_1_E",
          violation_type: "MISSING_CURRENCY_SYMBOL",
          severity: "MAJOR",
          description: "Maximum Retail Price declaration fails to display official currency symbol ('₹' or 'Rs.').",
          statutory_provision: "Rule 6(1)(e) of Legal Metrology (PC) Rules, 2011",
          penalty_fine: "₹25,000",
          field: "mrp"
        });
      }
    }
  }

  // 6. Check Rule 6(1)(n) - Consumer Care Details
  const rule61n = rulesMap.get("RULE_6_1_N");
  if (rule61n?.isActive) {
    const cc = parsedFields?.consumer_care;
    let ccPhone = typeof cc === 'object' && cc !== null ? (cc.phone || '') : '';
    let ccEmail = typeof cc === 'object' && cc !== null ? (cc.email || '') : '';
    if (typeof cc === 'string') {
      const phoneMatch = cc.match(/(?:\+91|0)?\d{3,5}[-\s]?\d{6,8}|\b1800[-\s]?\d{3}[-\s]?\d{3,4}\b/);
      if (phoneMatch) ccPhone = phoneMatch[0];
      const emailMatch = cc.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) ccEmail = emailMatch[0];
    }

    if (!cc || (!ccPhone && !ccEmail && typeof cc === 'object')) {
      violations.push({
        rule_code: "Rule 6(1)(n)",
        rule_id: "RULE_6_1_N",
        violation_type: "MISSING_CONSUMER_CARE",
        severity: "MAJOR",
        description: "Package omits consumer grievance redressal contact details (telephone number and email address).",
        statutory_provision: "Rule 6(1)(n) of Legal Metrology (PC) Rules, 2011",
        penalty_fine: "₹25,000",
        field: "consumer_care"
      });
    } else {
      if (!ccEmail) {
        violations.push({
          rule_code: "Rule 6(1)(n)",
          rule_id: "RULE_6_1_N",
          violation_type: "MISSING_CONSUMER_CARE_EMAIL",
          severity: "MAJOR",
          description: "Consumer care details omit mandatory email address. Both telephone and email are legally mandatory.",
          statutory_provision: "Rule 6(1)(n) of Legal Metrology (PC) Rules, 2011",
          penalty_fine: "₹25,000",
          field: "consumer_care"
        });
      }
      if (!ccPhone) {
        violations.push({
          rule_code: "Rule 6(1)(n)",
          rule_id: "RULE_6_1_N",
          violation_type: "MISSING_CONSUMER_CARE_PHONE",
          severity: "MAJOR",
          description: "Consumer care details omit telephone contact number.",
          statutory_provision: "Rule 6(1)(n) of Legal Metrology (PC) Rules, 2011",
          penalty_fine: "₹25,000",
          field: "consumer_care"
        });
      }
    }
  }

  // 7. Check Rule 6(1)(m) - Country of Origin (for imported or general)
  const rule61m = rulesMap.get("RULE_6_1_M");
  if (rule61m?.isActive) {
    const isImported = /import|switzerland|germany|usa|china|foreign/i.test(JSON.stringify(parsedFields));
    if (isImported && !parsedFields?.country_of_origin) {
      violations.push({
        rule_code: "Rule 6(1)(m)",
        rule_id: "RULE_6_1_M",
        violation_type: "MISSING_COUNTRY_OF_ORIGIN",
        severity: "CRITICAL",
        description: "Package contains imported goods but fails to declare mandatory Country of Origin.",
        statutory_provision: "Rule 6(1)(m) of Legal Metrology (PC) Rules, 2011",
        penalty_fine: "₹25,000",
        field: "country_of_origin"
      });
    }
  }

  // 8. Readability & Font Size Check (Rule 7)
  const rule7 = rulesMap.get("RULE_7");
  if (rule7?.isActive) {
    if (parsedFields?.readability?.clarity === "LOW") {
      violations.push({
        rule_code: "Rule 7",
        rule_id: "RULE_7",
        violation_type: "DEFICIENT_LABEL_READABILITY",
        severity: "MINOR",
        description: "Text clarity and numeral height appear below prescribed minimum statutory size or illegible. Re-inspection recommended.",
        statutory_provision: "Rule 7 & Second Schedule of Legal Metrology (PC) Rules, 2011",
        penalty_fine: "₹20,000",
        field: "readability"
      });
    }
  }

  // Calculate compliance score
  let score = 100;
  for (const v of violations) {
    if (v.severity === "CRITICAL") score -= 25;
    else if (v.severity === "MAJOR") score -= 15;
    else if (v.severity === "MINOR") score -= 8;
  }
  score = Math.max(0, Math.min(100, score));

  let complianceStatus = "COMPLIANT";
  if (violations.some(v => v.severity === "CRITICAL") || violations.length >= 2) {
    complianceStatus = "NON_COMPLIANT";
  } else if (violations.length > 0) {
    complianceStatus = "BORDERLINE";
  }

  // Generate statutory legal notice draft if non-compliant
  let statutoryNotice = null;
  if (complianceStatus === "NON_COMPLIANT") {
    const totalPenalties = violations.length * 25000;
    const mfg = parsedFields?.manufacturer;
    const recipient = typeof mfg === 'object' && mfg !== null
      ? (mfg.name || (mfg.address ? mfg.address.split(',')[0].trim() : "The Manufacturer / Packer / Importer"))
      : (typeof mfg === 'string' && mfg.trim() ? mfg.split(',')[0].trim() : "The Manufacturer / Packer / Importer");
    const address = typeof mfg === 'object' && mfg !== null
      ? (mfg.address || mfg.raw || "Address as declared on package")
      : (typeof mfg === 'string' && mfg.trim() ? mfg : "Address as declared on package");

    statutoryNotice = {
      noticeNumber: `SCN/LM/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      noticeDate: new Date().toISOString().split('T')[0],
      recipient,
      address,
      subject: `Show Cause Notice for Violations under Legal Metrology (Packaged Commodities) Rules, 2011`,
      commodityName: (typeof parsedFields?.commodity_name === 'string' ? parsedFields.commodity_name : '') || "Packaged Commodity",
      violationsCount: violations.length,
      statutoryProvisionsViolated: violations.map(v => v.rule_code).join(", "),
      penalSectionApplicable: "Section 36(1) and Section 36(2) of Legal Metrology Act, 2009",
      compoundingFeeProposed: `₹${totalPenalties.toLocaleString('en-IN')}`,
      noticePeriodDays: 15,
      legalDirectives: [
        "Show cause within 15 days of receipt why legal proceedings should not be initiated in the competent Court of Metropolitan Magistrate / Judicial Magistrate.",
        "Immediately withdraw the offending batch from distribution channels until compliant over-stickering or re-labeling is approved.",
        "Option to compound the offences under Section 48 of the Legal Metrology Act, 2009 before the Designated Controller."
      ]
    };
  }

  return {
    compliance_status: complianceStatus,
    compliance_score: score,
    violations,
    statutory_notice: statutoryNotice,
    rule_checks_summary: {
      total_rules_checked: activeRules.length,
      rules_passed: activeRules.length - violations.length,
      rules_failed: violations.length
    }
  };
}
