// Benchmark packaging samples for 1-click end-to-end testing

export interface SampleLabel {
  id: string;
  name: string;
  brand: string;
  category: string;
  expectedStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'BORDERLINE';
  description: string;
  keyIssues: Array<{
    type: 'violation' | 'warning' | 'compliant';
    text: string;
  }>;
  rawText: string;
  svgDataUrl: string;
  boundingBoxes: Array<{
    field: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    status: 'valid' | 'invalid' | 'warning';
  }>;
}

// Generate SVG label images
function createSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

const butterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
  <defs>
    <linearGradient id="butterBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff8e7"/>
      <stop offset="100%" stop-color="#fef3c7"/>
    </linearGradient>
  </defs>
  <rect width="600" height="420" fill="url(#butterBg)" rx="16" stroke="#d97706" stroke-width="4"/>
  <rect x="20" y="20" width="560" height="70" fill="#dc2626" rx="8"/>
  <text x="300" y="55" fill="#ffffff" font-family="'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="bold" text-anchor="middle" letter-spacing="2">AMUL PASTEURISED BUTTER</text>
  <text x="300" y="76" fill="#fef08a" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" text-anchor="middle">UTTERLY BUTTERLY DELICIOUS</text>
  
  <!-- Nutrition & Generic -->
  <text x="40" y="125" fill="#1e293b" font-family="'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="bold">Generic Name: <tspan font-weight="normal">Table Butter</tspan></text>
  
  <!-- Net Qty Box -->
  <rect x="400" y="105" width="160" height="45" fill="#ffffff" stroke="#16a34a" stroke-width="2" rx="6"/>
  <text x="480" y="133" fill="#15803d" font-family="'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">Net Qty: 100 g</text>
  
  <!-- Manufacturer details -->
  <text x="40" y="165" fill="#475569" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold">MANUFACTURED &amp; PACKED BY:</text>
  <text x="40" y="185" fill="#1e293b" font-family="'Segoe UI', Roboto, sans-serif" font-size="13">Gujarat Cooperative Milk Marketing Federation Ltd.</text>
  <text x="40" y="205" fill="#334155" font-family="'Segoe UI', Roboto, sans-serif" font-size="13">Amul Dairy Road, Anand - 388001, Gujarat, India.</text>
  <text x="40" y="225" fill="#16a34a" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold">Country of Origin: India</text>
  
  <line x1="40" y1="240" x2="560" y2="240" stroke="#cbd5e1" stroke-width="1"/>
  
  <!-- Pricing & Date -->
  <rect x="40" y="255" width="250" height="70" fill="#ffffff" stroke="#cbd5e1" rx="6"/>
  <text x="55" y="280" fill="#0f172a" font-family="'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="bold">MRP Rs. 58.00</text>
  <text x="55" y="300" fill="#15803d" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold">(inclusive of all taxes)</text>
  <text x="55" y="316" fill="#64748b" font-family="'Segoe UI', Roboto, sans-serif" font-size="11">USP: ₹ 0.58 / g</text>
  
  <rect x="310" y="255" width="250" height="70" fill="#ffffff" stroke="#cbd5e1" rx="6"/>
  <text x="325" y="280" fill="#475569" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold">DATE OF PACKING:</text>
  <text x="325" y="305" fill="#0f172a" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold">Pkd: 08/2024</text>
  
  <!-- Consumer Care -->
  <rect x="40" y="340" width="520" height="60" fill="#f1f5f9" rx="6"/>
  <text x="55" y="360" fill="#334155" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="bold">FOR CONSUMER COMPLAINTS / FEEDBACK WRITE TO:</text>
  <text x="55" y="380" fill="#0284c7" font-family="'Segoe UI', Roboto, sans-serif" font-size="12">Toll Free: 1800-258-3333  |  Email: customercare@amul.coop</text>
  <text x="55" y="395" fill="#64748b" font-family="'Segoe UI', Roboto, sans-serif" font-size="10">Address: PO Box 10, Amul Dairy Road, Anand - 388001, Gujarat</text>
</svg>`;

const detergentSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
  <defs>
    <linearGradient id="detBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff"/>
      <stop offset="100%" stop-color="#dbeafe"/>
    </linearGradient>
  </defs>
  <rect width="600" height="420" fill="url(#detBg)" rx="16" stroke="#2563eb" stroke-width="4"/>
  <rect x="20" y="20" width="560" height="70" fill="#1d4ed8" rx="8"/>
  <text x="300" y="60" fill="#ffffff" font-family="'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="bold" text-anchor="middle">SUPERCLEAN POWER DETERGENT</text>
  
  <!-- Illegal Net Weight Box -->
  <rect x="40" y="105" width="220" height="50" fill="#fee2e2" stroke="#dc2626" stroke-width="2" stroke-dasharray="4" rx="6"/>
  <text x="55" y="135" fill="#b91c1c" font-family="'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="bold">Net Weight: 500 gms</text>
  <text x="55" y="148" fill="#ef4444" font-family="'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="bold">⚠️ NON-STANDARD UNIT SYMBOL 'gms'</text>

  <!-- Non-compliant MRP -->
  <rect x="280" y="105" width="280" height="50" fill="#fee2e2" stroke="#dc2626" stroke-width="2" stroke-dasharray="4" rx="6"/>
  <text x="295" y="135" fill="#b91c1c" font-family="'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="bold">Max Retail Price: Rs. 145.00</text>
  <text x="295" y="148" fill="#ef4444" font-family="'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="bold">⚠️ MISSING 'INCL. OF ALL TAXES'</text>

  <!-- Manufacturer -->
  <rect x="40" y="175" width="520" height="90" fill="#ffffff" stroke="#cbd5e1" rx="6"/>
  <text x="55" y="200" fill="#334155" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold">MANUFACTURED BY:</text>
  <text x="55" y="222" fill="#0f172a" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="bold">SuperClean Chemicals Pvt Ltd</text>
  <text x="55" y="242" fill="#475569" font-family="'Segoe UI', Roboto, sans-serif" font-size="12">Plot 44, Okhla Industrial Area, Phase-III, New Delhi - 110020</text>
  <text x="55" y="258" fill="#64748b" font-family="'Segoe UI', Roboto, sans-serif" font-size="12">Mfg Date: 05/2024  |  Batch No: SC-2405</text>

  <!-- Incomplete Consumer Care -->
  <rect x="40" y="285" width="520" height="80" fill="#fef2f2" stroke="#f87171" stroke-width="1.5" rx="6"/>
  <text x="55" y="310" fill="#991b1b" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold">CUSTOMER CARE SERVICE:</text>
  <text x="55" y="332" fill="#0f172a" font-family="'Segoe UI', Roboto, sans-serif" font-size="13">Helpline Phone: 011-26987455 (Mon-Fri 10am-5pm)</text>
  <text x="55" y="352" fill="#dc2626" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="bold">⚠️ VIOLATION: Mandatory Consumer Care Email ID is omitted!</text>
</svg>`;

const trufflesSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
  <rect width="600" height="420" fill="#18181b" rx="16" stroke="#ca8a04" stroke-width="4"/>
  <text x="300" y="60" fill="#fef08a" font-family="'Cinzel', Georgia, serif" font-size="28" font-weight="bold" text-anchor="middle" letter-spacing="3">ALPINA SWISS DARK TRUFFLES</text>
  <text x="300" y="85" fill="#a1a1aa" font-family="'Segoe UI', sans-serif" font-size="13" text-anchor="middle">Artisanal Cocoa Confectionery</text>
  
  <!-- Net Qty & MRP -->
  <rect x="40" y="115" width="240" height="60" fill="#27272a" stroke="#ca8a04" rx="6"/>
  <text x="55" y="145" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="bold">Net Qty: 150 g</text>
  <text x="55" y="165" fill="#4ade80" font-family="'Segoe UI', sans-serif" font-size="12">Standard Metric Unit</text>

  <rect x="320" y="115" width="240" height="60" fill="#27272a" stroke="#ca8a04" rx="6"/>
  <text x="335" y="145" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="bold">MRP Rs. 490.00</text>
  <text x="335" y="165" fill="#93c5fd" font-family="'Segoe UI', sans-serif" font-size="12">(incl. of all taxes)</text>

  <!-- Violations Section -->
  <rect x="40" y="195" width="520" height="120" fill="#3f1d1d" stroke="#ef4444" stroke-width="2" rx="6"/>
  <text x="55" y="225" fill="#fca5a5" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="bold">IMPORTED GOODS COMPLIANCE DEFECTS:</text>
  <text x="55" y="250" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-size="13">Imported &amp; Distributed by: Euro Gourmet Brands, Mumbai</text>
  <text x="55" y="275" fill="#f87171" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="bold">❌ Missing Mandatory 'Country of Origin' declaration under Rule 6(1)(m)</text>
  <text x="55" y="295" fill="#f87171" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="bold">❌ Incomplete Indian Importer Address (Pin Code omitted) under Rule 6(1)(a)</text>
  <text x="55" y="312" fill="#f87171" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="bold">❌ Missing Consumer Redressal Contact under Rule 6(1)(n)</text>
  
  <text x="55" y="360" fill="#a1a1aa" font-family="'Segoe UI', sans-serif" font-size="13">Mfg: 06/2024  |  Best Before: 12 months from packing</text>
</svg>`;

const shampooSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
  <rect width="600" height="420" fill="#f0fdf4" rx="16" stroke="#16a34a" stroke-width="4"/>
  <rect x="20" y="20" width="560" height="65" fill="#15803d" rx="8"/>
  <text x="300" y="60" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-size="24" font-weight="bold" text-anchor="middle">GLOWHERB ORGANIC SHAMPOO</text>
  
  <rect x="40" y="105" width="250" height="75" fill="#ffffff" stroke="#cbd5e1" rx="6"/>
  <text x="55" y="130" fill="#334155" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="bold">NET QUANTITY (NUMERAL HEIGHT):</text>
  <text x="55" y="152" fill="#d97706" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="bold">Net Vol: 200 ml</text>
  <text x="55" y="170" fill="#f59e0b" font-family="'Segoe UI', sans-serif" font-size="9">⚠️ Height estimated at 1.8mm (Rule 7 requires min 2.0mm)</text>

  <rect x="310" y="105" width="250" height="75" fill="#ffffff" stroke="#cbd5e1" rx="6"/>
  <text x="325" y="130" fill="#334155" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="bold">DATE OF PACKING FORMAT:</text>
  <text x="325" y="152" fill="#d97706" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="bold">Pkd: Sep-24</text>
  <text x="325" y="170" fill="#f59e0b" font-family="'Segoe UI', sans-serif" font-size="9">⚠️ Rule 6(1)(d) prescribes MM/YYYY or Month YYYY</text>

  <rect x="40" y="200" width="520" height="80" fill="#ffffff" stroke="#cbd5e1" rx="6"/>
  <text x="55" y="225" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="bold">MRP Rs. 210.00 (inclusive of all taxes)</text>
  <text x="55" y="245" fill="#475569" font-family="'Segoe UI', sans-serif" font-size="12">Mfd by: GlowHerb Natural Care Ltd, B-12 Industrial Estate, Haridwar - 249403, Uttarakhand</text>
  <text x="55" y="265" fill="#15803d" font-family="'Segoe UI', sans-serif" font-size="12">Consumer Contact: +91-9876543210, support@glowherb.in</text>
</svg>`;

export const SAMPLE_LABELS: SampleLabel[] = [
  {
    id: "sample_butter",
    name: "Amul Pasteurised Table Butter 100g",
    brand: "GCMMF Ltd. (Amul)",
    category: "Dairy & Food",
    expectedStatus: "COMPLIANT",
    description: "Benchmark 100% legally compliant packaged food product with all 14 FSSAI mandatory declarations including 14-digit licence, nutritional panel, veg logo, and allergens.",
    keyIssues: [
      { type: 'compliant', text: "All 14 FSSAI mandatory declarations verified" },
      { type: 'compliant', text: "Valid 14-digit FSSAI licence No. 10012021000071" }
    ],
    svgDataUrl: createSvgDataUrl(butterSvg),
    rawText: `AMUL PASTEURISED TABLE BUTTER
Generic Name: Table Butter
100% VEGETARIAN
Ingredients: Butter, Common Salt, Permitted Natural Colour (Annatto).
Allergen Information: Contains Milk.
Nutritional Information per 100g (Approx.): Energy 722 kcal, Total Fat 80.0 g, Saturated Fat 51.0 g, Trans Fat 0.0 g, Carbohydrate 0.0 g, Protein 0.6 g, Sodium 836 mg.
Net Qty: 100 g
fssai Lic. No. 10012021000071
Date of Pkd: 15/08/2024
Best Before: 12 months from packing
Batch No: AM-2408B
MANUFACTURED & PACKED BY:
Gujarat Cooperative Milk Marketing Federation Ltd.
Amul Dairy Road, Anand - 388001, Gujarat, India.
Customer Care: 1800-258-3333 | customercare@amul.coop | PO Box 10, Anand - 388001
Storage Instructions: Store under refrigeration at 4°C or below.
Country of Origin: India
MRP Rs. 58.00 (inclusive of all taxes)`,
    boundingBoxes: [
      { field: "commodity_name", label: "Rule 6(1)(b) Generic Name", x: 20, y: 20, width: 560, height: 70, status: "valid" },
      { field: "net_quantity", label: "Rule 6(1)(c) Net Qty: 100 g", x: 400, y: 105, width: 160, height: 45, status: "valid" },
      { field: "manufacturer", label: "Rule 6(1)(a) Manufacturer Address", x: 40, y: 155, width: 520, height: 80, status: "valid" },
      { field: "mrp", label: "Rule 6(1)(e) MRP & Taxes", x: 40, y: 255, width: 250, height: 70, status: "valid" },
      { field: "mfg_date", label: "Rule 6(1)(d) Packing Date", x: 310, y: 255, width: 250, height: 70, status: "valid" },
      { field: "consumer_care", label: "Rule 6(1)(n) Consumer Care", x: 40, y: 340, width: 520, height: 60, status: "valid" }
    ]
  },
  {
    id: "sample_detergent",
    name: "SuperClean Power Detergent 500gms",
    brand: "SuperClean Chemicals Pvt Ltd",
    category: "Household & Cleaning",
    expectedStatus: "NON_COMPLIANT",
    description: "High-violation benchmark: Illegal metric unit symbol 'gms' (Rule 12 & 13), omitted tax inclusion clause in MRP (Rule 6(1)(e)), and missing consumer redressal email (Rule 6(1)(n)).",
    keyIssues: [
      { type: 'violation', text: "Illegal unit symbol 'gms' (Rule 12 & 13)" },
      { type: 'violation', text: "Missing '(incl. of all taxes)' on MRP (Rule 6(1)(e))" }
    ],
    svgDataUrl: createSvgDataUrl(detergentSvg),
    rawText: `SUPERCLEAN POWER DETERGENT
Net Weight: 500 gms
Max Retail Price: Rs. 145.00
MANUFACTURED BY:
SuperClean Chemicals Pvt Ltd
Plot 44, Okhla Industrial Area, Phase-III, New Delhi - 110020
Mfg Date: 05/2024
Customer Care Phone: 011-26987455`,
    boundingBoxes: [
      { field: "commodity_name", label: "Rule 6(1)(b) Product Name", x: 20, y: 20, width: 560, height: 70, status: "valid" },
      { field: "net_quantity", label: "Rule 6(1)(c) Net Weight: 500 gms (VIOLATION)", x: 40, y: 105, width: 220, height: 50, status: "invalid" },
      { field: "mrp", label: "Rule 6(1)(e) MRP Rs. 145.00 (VIOLATION - No Tax Clause)", x: 280, y: 105, width: 280, height: 50, status: "invalid" },
      { field: "manufacturer", label: "Rule 6(1)(a) Manufacturer", x: 40, y: 175, width: 520, height: 90, status: "valid" },
      { field: "consumer_care", label: "Rule 6(1)(n) Customer Care (VIOLATION - Missing Email)", x: 40, y: 285, width: 520, height: 80, status: "invalid" }
    ]
  },
  {
    id: "sample_truffles",
    name: "Alpina Swiss Dark Truffles 150g",
    brand: "Alpina Chocolatier AG",
    category: "Confectionery (Imported)",
    expectedStatus: "NON_COMPLIANT",
    description: "Imported food defect: Missing Country of Origin declaration (Reg 5(14)), missing 14-digit FSSAI licence (Reg 5(6)), and missing ingredients list (Reg 5(2)).",
    keyIssues: [
      { type: 'violation', text: "Missing Country of Origin (FSSAI Reg 5(14))" },
      { type: 'violation', text: "Missing FSSAI 14-Digit Licence (FSSAI Reg 5(6))" }
    ],
    svgDataUrl: createSvgDataUrl(trufflesSvg),
    rawText: `ALPINA SWISS DARK TRUFFLES
Generic Name: Cocoa Confectionery
Net Qty: 150 g
MRP Rs. 490.00 (incl. of all taxes)
Imported & Distributed by: Euro Gourmet Brands, Mumbai
Mfg: 06/2024`,
    boundingBoxes: [
      { field: "commodity_name", label: "FSSAI Reg 5(1) Food Name", x: 40, y: 40, width: 520, height: 55, status: "valid" },
      { field: "net_quantity", label: "FSSAI Reg 5(4) Net Qty: 150 g", x: 40, y: 115, width: 240, height: 60, status: "valid" },
      { field: "fssai_license", label: "FSSAI Reg 5(6) Licence (OMITTED)", x: 320, y: 115, width: 240, height: 60, status: "invalid" },
      { field: "country_of_origin", label: "FSSAI Reg 5(14) Country of Origin (OMITTED)", x: 40, y: 195, width: 520, height: 120, status: "invalid" }
    ]
  },
  {
    id: "sample_shampoo",
    name: "GlowHerb Organic Herbal Shampoo 200ml",
    brand: "GlowHerb Natural Care Ltd",
    category: "Personal Care & Cosmetics",
    expectedStatus: "BORDERLINE",
    description: "Borderline case: Low numeral height under Rule 7 (estimated 1.8mm against 2.0mm statutory standard) and non-standard date format 'Sep-24' under Rule 6(1)(d).",
    keyIssues: [
      { type: 'warning', text: "Numeral height 1.8mm < 2.0mm (Rule 7)" },
      { type: 'warning', text: "Non-standard date format 'Sep-24' (Rule 6(1)(d))" }
    ],
    svgDataUrl: createSvgDataUrl(shampooSvg),
    rawText: `GLOWHERB ORGANIC SHAMPOO
Net Vol: 200 ml
Pkd: Sep-24
MRP Rs. 210.00 (inclusive of all taxes)
Mfd by: GlowHerb Natural Care Ltd, B-12 Industrial Estate, Haridwar - 249403, Uttarakhand
Consumer Contact: +91-9876543210, support@glowherb.in`,
    boundingBoxes: [
      { field: "commodity_name", label: "Rule 6(1)(b) Product Name", x: 20, y: 20, width: 560, height: 65, status: "valid" },
      { field: "net_quantity", label: "Rule 7 Font Size Defect: 1.8mm", x: 40, y: 105, width: 250, height: 75, status: "warning" },
      { field: "mfg_date", label: "Rule 6(1)(d) Date Format: Sep-24", x: 310, y: 105, width: 250, height: 75, status: "warning" },
      { field: "mrp", label: "Rule 6(1)(e) MRP", x: 40, y: 200, width: 520, height: 80, status: "valid" }
    ]
  }
];
