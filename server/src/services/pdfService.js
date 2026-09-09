import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

/**
 * Generates an official, structured Legal Metrology Compliance PDF Report
 * @param {Object} data - { report, scan, product, violations }
 * @param {Stream} outputStream - Writable stream (e.g. res)
 */
export function generateCompliancePdf(data, outputStream) {
  const { report, scan, product, violations = [] } = data;
  const isCompliant = report.status === 'COMPLIANT';
  const isNonCompliant = report.status === 'NON_COMPLIANT';

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Legal Metrology Report - ${report.report_number}`,
      Author: 'Directorate of Legal Metrology',
      Subject: 'Statutory Packaging Compliance Certificate',
      Keywords: 'Legal Metrology, Compliance, Packaged Commodities, Rules 2011'
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

  // --- 1. Top Government Header ---
  doc.rect(40, 40, 515, 65).fill('#0f172a');

  doc.fillColor('#60a5fa').fontSize(9).font('Helvetica-Bold').text('DIRECTORATE OF LEGAL METROLOGY', 55, 52, { characterSpacing: 1 });
  doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica').text('DEPARTMENT OF CONSUMER AFFAIRS • GOVERNMENT OF INDIA', 55, 66);
  doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold').text('STATUTORY COMMODITY INSPECTION CERTIFICATE', 55, 78);

  // Reference number in header right
  doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica').text('CERTIFICATE REF:', 400, 52, { align: 'right', width: 140 });
  doc.fillColor('#38bdf8').fontSize(10).font('Helvetica-Bold').text(report.report_number || 'CLM/DEL/2026/01', 400, 64, { align: 'right', width: 140 });
  doc.fillColor('#cbd5e1').fontSize(8).font('Helvetica').text(`Date: ${new Date(report.generated_at).toLocaleDateString('en-IN')}`, 400, 78, { align: 'right', width: 140 });

  doc.moveDown(3);

  // --- 2. Statutory Enforcement Verdict Banner ---
  const bannerY = 118;
  const bannerColor = isCompliant ? passGreen : isNonCompliant ? failRed : warnAmber;
  doc.rect(40, bannerY, 515, 50).fill(bannerColor);

  const verdictText = isCompliant 
    ? 'VERDICT: FULLY COMPLIANT' 
    : isNonCompliant 
      ? 'VERDICT: NON-COMPLIANT (STATUTORY OFFENCE LOGGED)' 
      : 'VERDICT: BORDERLINE / ADVISORY';

  const verdictSubtext = isCompliant
    ? 'All mandatory packaging declarations satisfy the Legal Metrology (Packaged Commodities) Rules, 2011.'
    : `${violations.length} statutory violation(s) detected. Subject to legal notice & compounding under Section 36 & 48.`;

  doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text(verdictText, 55, bannerY + 12);
  doc.fillColor('#f8fafc').fontSize(8.5).font('Helvetica').text(verdictSubtext, 55, bannerY + 30);

  // Score badge on banner right
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold').text('COMPLIANCE SCORE', 415, bannerY + 10, { align: 'right', width: 125 });
  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text(`${report.score}/100`, 415, bannerY + 22, { align: 'right', width: 125 });

  // --- 3. Commodity & Inspection Details Grid ---
  const gridY = 178;
  doc.rect(40, gridY, 515, 60).fill('#f8fafc');
  doc.rect(40, gridY, 515, 60).stroke(borderGray);

  // Column 1: Commodity
  doc.fillColor(textMuted).fontSize(7).font('Helvetica-Bold').text('COMMODITY NAME', 52, gridY + 10);
  doc.fillColor(textDark).fontSize(9).font('Helvetica-Bold').text(product?.product_name || 'Packaged Commodity', 52, gridY + 22, { width: 155, ellipsis: true });
  doc.fillColor(textMuted).fontSize(7).font('Helvetica').text(`Category: ${product?.category || 'General'}`, 52, gridY + 44);

  // Column 2: Brand / Manufacturer
  doc.fillColor(textMuted).fontSize(7).font('Helvetica-Bold').text('MANUFACTURER / BRAND', 220, gridY + 10);
  doc.fillColor(textDark).fontSize(9).font('Helvetica-Bold').text(product?.brand || 'Unbranded', 220, gridY + 22, { width: 160, ellipsis: true });
  doc.fillColor(textMuted).fontSize(7).font('Helvetica').text(`Net Quantity: ${scan?.parsed_fields?.net_quantity?.raw || 'Omitted'}`, 220, gridY + 44);

  // Column 3: Inspector Officer
  doc.fillColor(textMuted).fontSize(7).font('Helvetica-Bold').text('INSPECTING OFFICER', 395, gridY + 10);
  doc.fillColor(primaryBlue).fontSize(9).font('Helvetica-Bold').text(report.inspector_name || 'Sworn Inspector', 395, gridY + 22, { width: 150, ellipsis: true });
  doc.fillColor(textMuted).fontSize(7).font('Helvetica').text('Authority: Section 15 LM Act', 395, gridY + 44);

  // --- 4. Declarations Verification Matrix ---
  let currentY = 250;
  doc.fillColor(primaryBlue).fontSize(10).font('Helvetica-Bold').text('1. STATUTORY DECLARATIONS VERIFICATION MATRIX (RULES 2011)', 40, currentY);
  currentY += 16;

  // Table Header
  doc.rect(40, currentY, 515, 18).fill('#0f172a');
  doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
  doc.text('RULE CODE', 48, currentY + 5);
  doc.text('MANDATORY REQUIREMENT', 120, currentY + 5);
  doc.text('DETECTED VALUE ON PACKAGING', 320, currentY + 5);
  doc.text('LEGAL STATUS', 465, currentY + 5);
  currentY += 18;

  const matrixRows = [
    {
      rule: 'Rule 6(1)(a)',
      req: 'Manufacturer / Packer Name & Physical Address',
      val: scan?.parsed_fields?.manufacturer?.address || scan?.parsed_fields?.manufacturer?.raw || 'Omitted / Not found',
      status: scan?.parsed_fields?.manufacturer ? 'VERIFIED' : 'OMITTED',
      isOk: Boolean(scan?.parsed_fields?.manufacturer)
    },
    {
      rule: 'Rule 6(1)(b)',
      req: 'Generic or Common Name of Commodity',
      val: scan?.parsed_fields?.commodity_name || 'Generic Commodity',
      status: scan?.parsed_fields?.commodity_name ? 'VERIFIED' : 'OMITTED',
      isOk: Boolean(scan?.parsed_fields?.commodity_name)
    },
    {
      rule: 'Rule 6(1)(c)',
      req: 'Net Quantity in Standard Metric Units (g, kg, ml, l)',
      val: scan?.parsed_fields?.net_quantity?.raw || 'Omitted',
      status: scan?.parsed_fields?.net_quantity?.is_standard ? 'STANDARD' : scan?.parsed_fields?.net_quantity ? 'ILLEGAL UNIT' : 'OMITTED',
      isOk: Boolean(scan?.parsed_fields?.net_quantity?.is_standard)
    },
    {
      rule: 'Rule 6(1)(d)',
      req: 'Month & Year of Manufacture/Packing (MM/YYYY)',
      val: scan?.parsed_fields?.mfg_date?.date || 'Omitted',
      status: scan?.parsed_fields?.mfg_date?.is_compliant ? 'VERIFIED' : scan?.parsed_fields?.mfg_date ? 'BAD FORMAT' : 'OMITTED',
      isOk: Boolean(scan?.parsed_fields?.mfg_date?.is_compliant)
    },
    {
      rule: 'Rule 6(1)(e)',
      req: 'Maximum Retail Price with "(inclusive of all taxes)"',
      val: scan?.parsed_fields?.mrp?.raw || 'Omitted',
      status: (scan?.parsed_fields?.mrp?.includes_taxes && scan?.parsed_fields?.mrp?.raw) ? 'VERIFIED' : scan?.parsed_fields?.mrp ? 'NO TAX CLAUSE' : 'OMITTED',
      isOk: Boolean(scan?.parsed_fields?.mrp?.includes_taxes && scan?.parsed_fields?.mrp?.raw)
    },
    {
      rule: 'Rule 6(1)(n)',
      req: 'Consumer Care Helpline Number AND Email ID',
      val: `Tel: ${scan?.parsed_fields?.consumer_care?.phone || 'Omitted'} | Email: ${scan?.parsed_fields?.consumer_care?.email || 'Omitted'}`,
      status: scan?.parsed_fields?.consumer_care?.is_complete ? 'COMPLETE' : 'DEFICIENT',
      isOk: Boolean(scan?.parsed_fields?.consumer_care?.is_complete)
    }
  ];

  matrixRows.forEach((row, idx) => {
    const rowHeight = 22;
    const bg = row.isOk ? (idx % 2 === 0 ? '#ffffff' : '#f8fafc') : '#fef2f2';
    doc.rect(40, currentY, 515, rowHeight).fill(bg);
    doc.rect(40, currentY, 515, rowHeight).stroke(borderGray);

    doc.fillColor(primaryBlue).fontSize(7.5).font('Helvetica-Bold').text(row.rule, 48, currentY + 6);
    doc.fillColor(textDark).fontSize(7).font('Helvetica').text(row.req, 120, currentY + 6, { width: 190, ellipsis: true });
    doc.fillColor(row.isOk ? textDark : failRed).fontSize(7).font('Helvetica').text(row.val, 320, currentY + 6, { width: 140, ellipsis: true });
    
    // Status Tag
    const statusColor = row.isOk ? passGreen : failRed;
    doc.fillColor(statusColor).fontSize(7.5).font('Helvetica-Bold').text(row.status, 465, currentY + 6);

    currentY += rowHeight;
  });

  currentY += 16;

  // --- 5. Statutory Violations Ledger ---
  if (violations.length > 0) {
    doc.fillColor(failRed).fontSize(10).font('Helvetica-Bold').text(`2. STATUTORY VIOLATIONS LEDGER (${violations.length} OFFENCES DETECTED)`, 40, currentY);
    currentY += 16;

    // Violations table header
    doc.rect(40, currentY, 515, 18).fill('#7f1d1d');
    doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
    doc.text('RULE CODE', 48, currentY + 5);
    doc.text('VIOLATION NATURE & DEFECT DETAILS', 120, currentY + 5);
    doc.text('SEVERITY', 340, currentY + 5);
    doc.text('PENAL PROVISION', 400, currentY + 5);
    doc.text('FINE', 495, currentY + 5);
    currentY += 18;

    violations.forEach((v, idx) => {
      const vHeight = 32;
      doc.rect(40, currentY, 515, vHeight).fill(idx % 2 === 0 ? '#ffffff' : '#fff1f2');
      doc.rect(40, currentY, 515, vHeight).stroke(borderGray);

      doc.fillColor(primaryBlue).fontSize(7.5).font('Helvetica-Bold').text(v.rule_code || 'Rule 6', 48, currentY + 5);
      
      doc.fillColor(textDark).fontSize(7.5).font('Helvetica-Bold').text((v.violation_type || '').replace(/_/g, ' '), 120, currentY + 4, { width: 215, ellipsis: true });
      doc.fillColor(textMuted).fontSize(6.5).font('Helvetica').text(v.description || '', 120, currentY + 15, { width: 215, height: 14, ellipsis: true });

      doc.fillColor(v.severity === 'CRITICAL' ? failRed : warnAmber).fontSize(7.5).font('Helvetica-Bold').text(v.severity || 'MAJOR', 340, currentY + 8);
      doc.fillColor(textMuted).fontSize(6.5).font('Helvetica').text(v.statutory_provision || 'Sec 36 LM Act', 400, currentY + 8, { width: 90 });
      doc.fillColor(failRed).fontSize(8).font('Helvetica-Bold').text(v.penalty_fine || '₹25,000', 495, currentY + 8);

      currentY += vHeight;
    });

    currentY += 16;
  } else {
    doc.fillColor(passGreen).fontSize(9.5).font('Helvetica-Bold').text('2. STATUTORY VIOLATIONS: NONE DETECTED (FULL LEGAL CONFORMITY)', 40, currentY);
    currentY += 20;
  }

  // --- 6. Form 1 Show Cause Notice (If Non-Compliant) ---
  if (report.statutory_notice && currentY < 680) {
    const sn = report.statutory_notice;
    doc.rect(40, currentY, 515, 62).fill('#fef2f2');
    doc.rect(40, currentY, 515, 62).stroke(failRed);

    doc.fillColor(failRed).fontSize(8.5).font('Helvetica-Bold').text('FORM 1: STATUTORY SHOW CAUSE NOTICE UNDER SECTION 36 READ WITH SEC 48', 52, currentY + 8);
    doc.fillColor(textDark).fontSize(7.5).font('Helvetica').text(`Notice Ref: ${sn.noticeNumber || 'SCN/LM/2026/01'} • Proposed Compounding Fee: ${sn.compoundingFeeProposed || '₹25,000'} • Notice Window: ${sn.noticePeriodDays || 15} Days`, 52, currentY + 22);
    doc.fillColor(textMuted).fontSize(7).font('Helvetica').text(`Addressed to: ${sn.recipient || 'Manufacturer/Packer'} — Offending commodity: "${sn.commodityName}". Option to compound offences or face prosecution in Judicial Magistrate Court.`, 52, currentY + 36, { width: 490 });

    currentY += 76;
  }

  // --- 7. Official Seal, Digital Signature & Legal Disclaimer Footer ---
  const footerY = 745;
  doc.rect(40, footerY, 515, 1).fill(borderGray);

  // Official Seal Stamp Graphic
  doc.circle(75, footerY + 26, 20).stroke(primaryBlue);
  doc.fillColor(primaryBlue).fontSize(5.5).font('Helvetica-Bold').text('DIRECTORATE OF\nLEGAL METROLOGY\nOFFICIAL SEAL', 58, footerY + 16, { align: 'center', width: 34 });

  // Signature Details
  doc.fillColor(textDark).fontSize(8).font('Helvetica-Bold').text(report.inspector_name || 'Enforcement Officer', 115, footerY + 12);
  doc.fillColor(textMuted).fontSize(7).font('Helvetica').text('Sworn Legal Metrology Officer • Authorized under Section 15 of Legal Metrology Act, 2009', 115, footerY + 23);
  doc.fillColor('#64748b').fontSize(6.5).font('Helvetica').text('Digitally validated and cryptographically recorded in the Central Compliance Registry.', 115, footerY + 33);

  // Security Verification QR / ID
  doc.fillColor(primaryBlue).fontSize(7.5).font('Helvetica-Bold').text(`VERIFIED RECORD`, 420, footerY + 12, { align: 'right', width: 130 });
  doc.fillColor(textMuted).fontSize(6.5).font('Helvetica').text(`ID: ${report.id}`, 420, footerY + 23, { align: 'right', width: 130 });
  doc.fillColor(textMuted).fontSize(6.5).font('Helvetica').text('Authenticity: legal-metrology.gov.in', 420, footerY + 33, { align: 'right', width: 130 });

  doc.end();
}
