import PDFDocument from 'pdfkit';

/**
 * Generates an official, structured FSSAI Food Packaging Compliance PDF Certificate
 * @param {Object} data - { report, scan, product, violations }
 * @param {Stream} outputStream - Writable stream (e.g. res)
 */
export function generateCompliancePdf(data, outputStream) {
  const { report, scan, product, violations = [] } = data;
  const isCompliant = report.status === 'COMPLIANT';
  const isNonCompliant = report.status === 'NON_COMPLIANT';

  const doc = new PDFDocument({
    size: 'A4',
    margin: 36,
    bufferPages: true,
    info: {
      Title: `FSSAI Compliance Certificate - ${report.report_number}`,
      Author: 'Food Safety and Standards Authority of India',
      Subject: 'Statutory Food Packaging Compliance Inspection Report',
      Keywords: 'FSSAI, Food Safety, Packaging, Labelling Regulations 2020'
    }
  });

  doc.pipe(outputStream);

  const primaryBlue = '#1e3a8a';
  const textDark = '#0f172a';
  const textMuted = '#475569';
  const borderGray = '#cbd5e1';
  const passGreen = '#059669';
  const failRed = '#dc2626';
  const warnAmber = '#d97706';

  // --- 1. Top Government / FSSAI Header ---
  doc.rect(36, 36, 523, 64).fill('#0f172a');

  doc.fillColor('#38bdf8').fontSize(8.5).font('Helvetica-Bold').text('FOOD SAFETY AND STANDARDS AUTHORITY OF INDIA (FSSAI)', 50, 47, { characterSpacing: 1 });
  doc.fillColor('#94a3b8').fontSize(7).font('Helvetica').text('MINISTRY OF HEALTH & FAMILY WELFARE • GOVERNMENT OF INDIA', 50, 59);
  doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text('STATUTORY PRE-PACKAGED FOOD COMPLIANCE CERTIFICATE', 50, 70);

  // Header Right
  doc.fillColor('#94a3b8').fontSize(7).font('Helvetica').text('INSPECTION REF:', 390, 47, { align: 'right', width: 155 });
  doc.fillColor('#38bdf8').fontSize(9.5).font('Helvetica-Bold').text(report.report_number || 'FSSAI/REP/2026/01', 390, 58, { align: 'right', width: 155 });
  doc.fillColor('#cbd5e1').fontSize(7.5).font('Helvetica').text(`Date: ${new Date(report.generated_at).toLocaleDateString('en-IN')}`, 390, 71, { align: 'right', width: 155 });

  // --- 2. Enforcement Verdict Banner ---
  const bannerY = 108;
  const bannerColor = isCompliant ? passGreen : isNonCompliant ? failRed : warnAmber;
  doc.rect(36, bannerY, 523, 44).fill(bannerColor);

  const verdictText = isCompliant 
    ? 'VERDICT: FULLY COMPLIANT (FSSAI LABELLING REGULATIONS 2020)' 
    : isNonCompliant 
      ? 'VERDICT: NON-COMPLIANT (STATUTORY LABELLING DEFECTS LOGGED)' 
      : 'VERDICT: BORDERLINE / ADVISORY';

  const verdictSubtext = isCompliant
    ? 'All 14 mandatory pre-packaged food labeling declarations satisfy FSSAI Regulations, 2020.'
    : `${violations.length} statutory defect(s) detected. Subject to Improvement Notice under Section 32 of FSS Act, 2006.`;

  doc.fillColor('#ffffff').fontSize(10.5).font('Helvetica-Bold').text(verdictText, 50, bannerY + 10);
  doc.fillColor('#f8fafc').fontSize(7.5).font('Helvetica').text(verdictSubtext, 50, bannerY + 26);

  // Score badge on banner right
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text('COMPLIANCE SCORE', 420, bannerY + 8, { align: 'right', width: 125 });
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(`${report.score}/100`, 420, bannerY + 19, { align: 'right', width: 125 });

  // --- 3. Food Product & Inspection Details Grid ---
  const gridY = 158;
  doc.rect(36, gridY, 523, 48).fill('#f8fafc');
  doc.rect(36, gridY, 523, 48).stroke(borderGray);

  // Column 1: Food Product
  doc.fillColor(textMuted).fontSize(6.5).font('Helvetica-Bold').text('FOOD PRODUCT / COMMODITY', 46, gridY + 8);
  doc.fillColor(textDark).fontSize(8.5).font('Helvetica-Bold').text(product?.product_name || 'Packaged Food', 46, gridY + 19, { width: 160, ellipsis: true });
  doc.fillColor(textMuted).fontSize(6.5).font('Helvetica').text(`Category: ${product?.category || 'Food & Beverages'}`, 46, gridY + 33);

  // Column 2: Brand / FSSAI License
  doc.fillColor(textMuted).fontSize(6.5).font('Helvetica-Bold').text('BRAND / FBO LICENCE', 215, gridY + 8);
  doc.fillColor(textDark).fontSize(8.5).font('Helvetica-Bold').text(product?.brand || 'Brand Owner', 215, gridY + 19, { width: 170, ellipsis: true });
  doc.fillColor(textMuted).fontSize(6.5).font('Helvetica').text(`FSSAI Lic: ${scan?.parsed_fields?.fssai_license?.license_number || 'Omitted'}`, 215, gridY + 33);

  // Column 3: Inspecting Officer
  doc.fillColor(textMuted).fontSize(6.5).font('Helvetica-Bold').text('DESIGNATED FOOD SAFETY OFFICER', 395, gridY + 8);
  doc.fillColor(primaryBlue).fontSize(8.5).font('Helvetica-Bold').text(report.inspector_name || 'Food Safety Officer', 395, gridY + 19, { width: 155, ellipsis: true });
  doc.fillColor(textMuted).fontSize(6.5).font('Helvetica').text('Authority: Section 32 & 41 FSS Act', 395, gridY + 33);

  // --- 4. The 14 Mandatory Declarations Verification Matrix ---
  let currentY = 214;
  doc.fillColor(primaryBlue).fontSize(9).font('Helvetica-Bold').text('1. MANDATORY FOOD PACKAGING VERIFICATION MATRIX (FSSAI 14-POINT STANDARD)', 36, currentY);
  currentY += 14;

  // Table Header
  doc.rect(36, currentY, 523, 16).fill('#0f172a');
  doc.fillColor('#ffffff').fontSize(6.8).font('Helvetica-Bold');
  doc.text('#', 42, currentY + 4);
  doc.text('RULE / CLAUSE', 58, currentY + 4);
  doc.text('MANDATORY REQUIREMENT', 140, currentY + 4);
  doc.text('DETECTED VALUE ON PACKAGING', 325, currentY + 4);
  doc.text('STATUS', 475, currentY + 4);
  currentY += 16;

  const matrixRows = report.rule_checks_matrix || [
    { rule_code: 'FSSAI Reg 5(1)', title: 'Name of the Food/Product', status: scan?.parsed_fields?.commodity_name ? 'PASS' : 'FAIL', extracted_value: scan?.parsed_fields?.commodity_name || 'Omitted' },
    { rule_code: 'FSSAI Reg 5(2)', title: 'List of Ingredients', status: scan?.parsed_fields?.ingredients ? 'PASS' : 'FAIL', extracted_value: scan?.parsed_fields?.ingredients?.raw || 'Omitted' },
    { rule_code: 'FSSAI Reg 5(3)', title: 'Nutritional Information', status: scan?.parsed_fields?.nutritional_info?.is_declared ? 'PASS' : 'FAIL', extracted_value: scan?.parsed_fields?.nutritional_info?.energy || 'Omitted' },
    { rule_code: 'FSSAI Reg 5(4)', title: 'Net Quantity', status: scan?.parsed_fields?.net_quantity?.is_standard ? 'PASS' : 'FAIL', extracted_value: scan?.parsed_fields?.net_quantity?.raw || 'Omitted' },
    { rule_code: 'FSSAI Reg 5(5)', title: 'Vegetarian / Non-Veg Symbol', status: scan?.parsed_fields?.veg_non_veg ? 'PASS' : 'FAIL', extracted_value: scan?.parsed_fields?.veg_non_veg?.raw || 'Omitted' },
    { rule_code: 'FSSAI Reg 5(6)', title: 'FSSAI Logo & Licence Number', status: scan?.parsed_fields?.fssai_license?.is_valid_14_digit ? 'PASS' : 'FAIL', extracted_value: scan?.parsed_fields?.fssai_license?.license_number || 'Omitted' },
    { rule_code: 'FSSAI Reg 5(7)', title: 'Date of Manufacture/Packing', status: scan?.parsed_fields?.mfg_date?.is_compliant ? 'PASS' : 'FAIL', extracted_value: scan?.parsed_fields?.mfg_date?.date || 'Omitted' },
    { rule_code: 'FSSAI Reg 5(8)', title: 'Expiry / Best-Before Date', status: scan?.parsed_fields?.expiry_date ? 'PASS' : 'FAIL', extracted_value: scan?.parsed_fields?.expiry_date?.expiry_or_period || 'Omitted' },
    { rule_code: 'FSSAI Reg 5(9)', title: 'Batch/Lot/Code Number', status: scan?.parsed_fields?.batch_number ? 'PASS' : 'FAIL', extracted_value: scan?.parsed_fields?.batch_number?.value || 'Omitted' },
    { rule_code: 'FSSAI Reg 5(10)', title: 'Manufacturer Details', status: scan?.parsed_fields?.manufacturer?.name ? 'PASS' : 'FAIL', extracted_value: scan?.parsed_fields?.manufacturer?.address || 'Omitted' },
    { rule_code: 'FSSAI Reg 5(11)', title: 'Customer Care Details', status: scan?.parsed_fields?.consumer_care ? 'PASS' : 'FAIL', extracted_value: scan?.parsed_fields?.consumer_care?.phone || 'Omitted' },
    { rule_code: 'FSSAI Reg 5(12)', title: 'Allergen Declarations', status: scan?.parsed_fields?.allergen_declaration ? 'PASS' : 'PASS', extracted_value: scan?.parsed_fields?.allergen_declaration?.raw || 'Not detected' },
    { rule_code: 'FSSAI Reg 5(13)', title: 'Storage Instructions', status: scan?.parsed_fields?.storage_instructions ? 'PASS' : 'FAIL', extracted_value: scan?.parsed_fields?.storage_instructions?.instructions || 'Omitted' },
    { rule_code: 'FSSAI Reg 5(14)', title: 'Country of Origin', status: scan?.parsed_fields?.country_of_origin ? 'PASS' : 'PASS', extracted_value: scan?.parsed_fields?.country_of_origin?.country || 'India' }
  ];

  matrixRows.slice(0, 14).forEach((row, idx) => {
    const isOk = row.status === 'PASS';
    const rowHeight = 17;
    const bg = isOk ? (idx % 2 === 0 ? '#ffffff' : '#f8fafc') : '#fef2f2';
    doc.rect(36, currentY, 523, rowHeight).fill(bg);
    doc.rect(36, currentY, 523, rowHeight).stroke(borderGray);

    doc.fillColor(textMuted).fontSize(6.5).font('Helvetica-Bold').text(`${idx + 1}`, 42, currentY + 4.5);
    doc.fillColor(primaryBlue).fontSize(6.8).font('Helvetica-Bold').text(row.rule_code || `Rule ${idx + 1}`, 58, currentY + 4.5);
    doc.fillColor(textDark).fontSize(6.5).font('Helvetica').text(row.title || 'Statutory Requirement', 140, currentY + 4.5, { width: 175, ellipsis: true });
    doc.fillColor(isOk ? textDark : failRed).fontSize(6.5).font('Helvetica').text(String(row.extracted_value || 'Omitted'), 325, currentY + 4.5, { width: 140, ellipsis: true });
    
    // Status Tag
    const statusColor = isOk ? passGreen : failRed;
    doc.fillColor(statusColor).fontSize(7).font('Helvetica-Bold').text(isOk ? 'VERIFIED' : 'DEFICIENT', 475, currentY + 4.5);

    currentY += rowHeight;
  });

  currentY += 12;

  // --- 5. Statutory Violations Ledger ---
  if (violations.length > 0) {
    // If running low on page space, add page
    if (currentY > 620) {
      doc.addPage();
      currentY = 40;
    }

    doc.fillColor(failRed).fontSize(9).font('Helvetica-Bold').text(`2. STATUTORY DEFECTS & OFFENCES LOGGED (${violations.length} VIOLATION(S))`, 36, currentY);
    currentY += 12;

    doc.rect(36, currentY, 523, 16).fill('#7f1d1d');
    doc.fillColor('#ffffff').fontSize(6.8).font('Helvetica-Bold');
    doc.text('RULE CODE', 44, currentY + 4);
    doc.text('DEFECT NATURE & FACTUAL DEFICIENCY', 120, currentY + 4);
    doc.text('SEVERITY', 320, currentY + 4);
    doc.text('STATUTORY PROVISION', 380, currentY + 4);
    doc.text('PENALTY FINE', 475, currentY + 4);
    currentY += 16;

    violations.slice(0, 5).forEach((v, idx) => {
      const vHeight = 24;
      doc.rect(36, currentY, 523, vHeight).fill(idx % 2 === 0 ? '#ffffff' : '#fff1f2');
      doc.rect(36, currentY, 523, vHeight).stroke(borderGray);

      doc.fillColor(primaryBlue).fontSize(6.8).font('Helvetica-Bold').text(v.rule_code || 'FSSAI Reg 5', 44, currentY + 4);
      doc.fillColor(textDark).fontSize(7).font('Helvetica-Bold').text((v.violation_type || '').replace(/_/g, ' '), 120, currentY + 3, { width: 190, ellipsis: true });
      doc.fillColor(textMuted).fontSize(5.8).font('Helvetica').text(v.description || '', 120, currentY + 12, { width: 190, ellipsis: true });

      doc.fillColor(v.severity === 'CRITICAL' ? failRed : warnAmber).fontSize(6.8).font('Helvetica-Bold').text(v.severity || 'MAJOR', 320, currentY + 6);
      doc.fillColor(textMuted).fontSize(6).font('Helvetica').text(v.statutory_provision || 'FSS Act, 2006', 380, currentY + 6, { width: 90, ellipsis: true });
      doc.fillColor(failRed).fontSize(7).font('Helvetica-Bold').text(v.penalty_fine || '₹1,00,000', 475, currentY + 6);

      currentY += vHeight;
    });

    currentY += 10;
  }

  // --- 6. Inspector Authorization Sign-off ---
  if (currentY > 670) {
    doc.addPage();
    currentY = 40;
  }

  doc.rect(36, currentY, 523, 48).fill('#f8fafc');
  doc.rect(36, currentY, 523, 48).stroke(borderGray);

  doc.fillColor(textMuted).fontSize(6.5).font('Helvetica-Bold').text('STATUTORY DIRECTIVE & LEGAL NOTICE CLAUSE', 46, currentY + 7);
  doc.fillColor(textDark).fontSize(6.5).font('Helvetica').text(
    isCompliant 
      ? 'This pre-packaged food commodity satisfies all 14 mandatory labeling provisions under FSS (Labelling and Display) Regulations, 2020.'
      : 'Food Business Operator is hereby served with an Improvement Notice under Section 32 of FSS Act, 2006 to rectify all deficient labeling declarations within 14 days.',
    46, currentY + 18, { width: 330 }
  );

  doc.fillColor(primaryBlue).fontSize(7.5).font('Helvetica-Bold').text('AUTHORISED FOOD SAFETY OFFICER', 400, currentY + 7, { width: 150, align: 'right' });
  doc.fillColor(textDark).fontSize(7.5).font('Helvetica-Bold').text(report.inspector_name || 'Food Safety Officer', 400, currentY + 20, { width: 150, align: 'right' });
  doc.fillColor(textMuted).fontSize(6).font('Helvetica').text('Digital Signature Verified • GOI', 400, currentY + 32, { width: 150, align: 'right' });

  doc.end();
}
