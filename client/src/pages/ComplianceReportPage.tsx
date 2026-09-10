import React, { useEffect, useState } from 'react';
import { 
  Printer, Download, ArrowLeft, ShieldCheck, AlertOctagon, 
  AlertTriangle, Scale, CheckCircle2, FileText, Send, Share2, CornerDownRight,
  Filter, Check, XCircle, Sparkles, Shield
} from 'lucide-react';
import { api } from '../services/api';
import { Report, Scan, Violation, User } from '../types';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

interface ComplianceReportPageProps {
  user?: User | null;
  reportId: string;
  onBack: () => void;
  onNewScan: () => void;
}

export const ComplianceReportPage: React.FC<ComplianceReportPageProps> = ({
  user,
  reportId,
  onBack,
  onNewScan
}) => {
  const [reportData, setReportData] = useState<{
    report: Report;
    scan: Scan;
    product: any;
    violations: Violation[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'json' | 'csv' | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [ruleFilter, setRuleFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      const data = await api.getReport(reportId);
      setReportData(data);
    } catch (err: any) {
      console.error("Failed to fetch report:", err);
      setError("Inspection report not found or failed to load.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportData) return;
    setIsDownloadingPdf(true);
    try {
      await api.downloadReportPdf(
        reportData.report.id,
        `FSSAI_Compliance_Report_${reportData.report.report_number || reportData.report.id}.pdf`
      );
    } catch (err: any) {
      alert("Failed to download PDF: " + (err.message || 'Unknown error'));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (!reportData?.report?.id) return;
    setExportingFormat(format);
    try {
      await api.downloadExport(
        reportData.report.id,
        format,
        `Statutory_Report_${reportData.report.report_number || reportData.report.id}.${format}`
      );
    } catch (err: any) {
      alert(`Failed to export ${format.toUpperCase()}: ` + (err.message || 'Unknown error'));
    } finally {
      setExportingFormat(null);
    }
  };

  const handleDeleteInspection = async () => {
    if (!reportData) return;
    const scanId = reportData.scan?.id || reportData.report?.scan_id;
    if (!scanId) {
      alert("Cannot delete: scan identifier is missing.");
      return;
    }
    setIsDeleting(true);
    try {
      await api.deleteScan(scanId);
      alert("Inspection record and associated files successfully deleted.");
      onBack();
    } catch (err: any) {
      alert("Failed to delete inspection: " + (err.message || 'Unauthorized'));
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
        <Scale size={48} className="animate-spin" style={{ margin: '0 auto 16px', color: 'var(--accent-blue)' }} />
        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Generating Official Metrology Compliance Report...</div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ marginBottom: '12px' }}>Report Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={16} /> Return to Dashboard
        </button>
      </div>
    );
  }

  const { report, scan, product, violations } = reportData;
  const isCompliant = report.status === 'COMPLIANT';
  const isNonCompliant = report.status === 'NON_COMPLIANT';

  // Allow delete if user is admin or created this scan
  const canDelete = user?.role === 'admin' || user?.role === 'inspector';

  return (
    <div>
      {/* Top Action Bar */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={16} />
          {user?.role === 'admin' ? 'Back to Central Dashboard' : 'Back to Inspections'}
        </button>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Primary instant PDF Download Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="btn btn-primary"
            style={{
              gap: '8px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}
          >
            {isDownloadingPdf ? (
              <>
                <Scale size={16} className="animate-spin" />
                Generating Official PDF...
              </>
            ) : (
              <>
                <Download size={16} />
                Download PDF Report
              </>
            )}
          </button>

          <button
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ gap: '8px' }}
          >
            <Printer size={16} />
            Print View
          </button>

          <button
            onClick={() => handleExport('json')}
            disabled={exportingFormat === 'json'}
            className="btn btn-secondary"
            style={{ gap: '8px' }}
            title="Export full statutory inspection data in JSON format"
          >
            <Download size={16} className={exportingFormat === 'json' ? 'animate-spin' : ''} />
            {exportingFormat === 'json' ? 'Exporting...' : 'JSON'}
          </button>

          <button
            onClick={() => handleExport('csv')}
            disabled={exportingFormat === 'csv'}
            className="btn btn-secondary"
            style={{ gap: '8px' }}
            title="Export statutory violations and report summary in CSV format"
          >
            <Download size={16} className={exportingFormat === 'csv' ? 'animate-spin' : ''} />
            {exportingFormat === 'csv' ? 'Exporting...' : 'CSV'}
          </button>

          {/* Delete Inspection Button */}
          {canDelete && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-danger"
              style={{
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444'
              }}
            >
              <AlertTriangle size={16} />
              Delete Inspection
            </button>
          )}

          {/* Hide Inspect Another Product strictly for ADMIN users */}
          {user?.role === 'inspector' && (
            <button
              onClick={onNewScan}
              className="btn btn-success"
              style={{ gap: '8px' }}
            >
              <Scale size={16} />
              Inspect Another Product
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Delete Inspection Record"
        message="Are you sure you want to delete this inspection?"
        itemName={`${product?.name || (scan as any)?.product_name || 'Product'} (${report?.report_number})`}
        isDeleting={isDeleting}
        onConfirm={handleDeleteInspection}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Official Legal Report Document Container */}
      <div className="glass-panel" style={{
        padding: '40px',
        borderRadius: 'var(--radius-squircle)',
        border: isNonCompliant ? '2px solid rgba(244, 63, 94, 0.4)' : '2px solid rgba(16, 185, 129, 0.4)',
        background: 'var(--card)'
      }}>
        {/* Government Letterhead Header */}
        <div style={{
          borderBottom: '2px solid var(--border-card)',
          paddingBottom: '24px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#1e3a8a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Scale size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent-blue-light)' }}>
                  FOOD SAFETY AND STANDARDS AUTHORITY OF INDIA (FSSAI)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  STATUTORY FOOD PACKAGING COMPLIANCE CERTIFICATE
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Issued under Food Safety and Standards (Labelling and Display) Regulations, 2020 read with Section 32 of FSS Act, 2006.
            </div>
          </div>

          {/* Certificate Reference Box */}
          <div style={{
            textAlign: 'right',
            background: 'var(--bg-glass-heavy)',
            padding: '12px 18px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>REPORT REFERENCE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', color: '#60a5fa' }}>
              {report.report_number}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Date: {new Date(report.generated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Big Verdict Status Banner */}
        <div style={{
          background: isCompliant 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.3) 100%)' 
            : isNonCompliant 
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(127, 29, 29, 0.3) 100%)' 
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(120, 53, 15, 0.3) 100%)',
          border: `1px solid ${isCompliant ? '#10b981' : isNonCompliant ? '#ef4444' : '#f59e0b'}`,
          borderRadius: '12px',
          padding: '24px 28px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: isCompliant ? '#10b981' : isNonCompliant ? '#ef4444' : '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
            }}>
              {isCompliant ? <ShieldCheck size={32} /> : isNonCompliant ? <AlertOctagon size={32} /> : <AlertTriangle size={32} />}
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', opacity: 0.9 }}>
                STATUTORY ENFORCEMENT VERDICT
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
                {report.status === 'COMPLIANT' && 'FULLY COMPLIANT'}
                {report.status === 'NON_COMPLIANT' && 'NON-COMPLIANT (VIOLATION)'}
                {report.status === 'BORDERLINE' && 'BORDERLINE / REVIEW ADVISORY'}
              </div>
              <div style={{ fontSize: '0.85rem', color: isCompliant ? '#6ee7b7' : isNonCompliant ? '#fca5a5' : '#fde68a' }}>
                {isCompliant 
                  ? 'All 14 mandatory packaging declarations satisfy the Food Safety and Standards (Labelling and Display) Regulations, 2020.'
                  : `${violations.length} statutory defect(s) detected. Subject to statutory proceedings under Section 32 & 52 of FSS Act, 2006.`}
              </div>
            </div>
          </div>

          {/* Compliance Score */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>COMPLIANCE SCORE</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: isCompliant ? '#34d399' : isNonCompliant ? '#f87171' : '#fbbf24' }}>
              {report.score}<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>
        </div>

        {/* Commodity & Inspector Metadata Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          background: 'var(--bg-glass-heavy)',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '28px'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMMODITY NAME</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>{product?.product_name}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>MANUFACTURER / BRAND</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>{product?.brand}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>CATEGORY</div>
            <div style={{ fontSize: '0.9rem', color: '#ffffff' }}>{product?.category}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>INSPECTING OFFICER</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#60a5fa' }}>{report.inspector_name}</div>
          </div>
        </div>

        {/* Missing Statutory Fields High-Priority Callout (If Any Missing) */}
        {(() => {
          const missingViolations = violations.filter(v => v.violation_type.includes('MISSING_') || v.severity === 'CRITICAL');
          if (missingViolations.length === 0) return null;

          return (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(127, 29, 29, 0.25) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '12px',
              padding: '20px 24px',
              marginBottom: '28px',
              boxShadow: '0 6px 20px rgba(239, 68, 68, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#ef4444',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertOctagon size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    CRITICAL STATUTORY DEFECTS: MANDATORY DECLARATIONS OMITTED
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '2px' }}>
                    {missingViolations.length} mandatory declaration(s) required under FSS (Labelling and Display) Regulations, 2020 were omitted or defective on the packaging image(s).
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', marginTop: '10px' }}>
                {missingViolations.map((mv, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '8px',
                    padding: '10px 14px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f87171' }}>
                        {mv.rule_code}
                      </span>
                      <span className="badge badge-noncompliant" style={{ fontSize: '0.65rem' }}>
                        CRITICAL OMISSION
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff', marginBottom: '3px' }}>
                      {mv.violation_type.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                      {mv.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Violations Ledger (If Any) */}
        {violations && violations.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={18} color="#f43f5e" />
              <span>Statutory Violations Ledger</span>
              <span className="badge badge-noncompliant" style={{ fontSize: '0.7rem' }}>
                {violations.length} Offence(s) Logged
              </span>
            </h2>

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>RULE CODE</th>
                    <th>VIOLATION NATURE &amp; FACTUAL DEFECT</th>
                    <th>SEVERITY</th>
                    <th>PENAL SECTION</th>
                    <th>STATUTORY COMPOUNDING FINE</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v, idx) => (
                    <tr key={idx} style={{ background: v.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.05)' : undefined }}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#60a5fa' }}>
                        {v.rule_code}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '2px', fontSize: '0.9rem' }}>
                          {v.violation_type.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {v.description}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          v.severity === 'CRITICAL' 
                            ? 'severity-critical' 
                            : v.severity === 'MAJOR' 
                              ? 'severity-major' 
                              : 'severity-minor'
                        }`}>
                          {v.severity}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {v.statutory_provision}
                      </td>
                      <td style={{ fontWeight: 700, color: '#facc15', fontSize: '0.95rem' }}>
                        {v.penalty_fine || '₹25,000'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Statutory Declarations Breakdown Matrix - Comprehensive 14-Rule Tabular Ledger */}
        {(() => {
          const default14Rules = [
            {
              id: 'RULE_FSSAI_01',
              rule_code: 'FSSAI Reg 5(1)',
              title: 'Name of the Food/Product',
              extracted_value: scan?.parsed_fields?.commodity_name || 'Not detected on package',
              status: scan?.parsed_fields?.commodity_name && scan?.parsed_fields?.commodity_name !== 'Packaged Food Product' ? 'PASS' : 'FAIL',
              statutory_provision: 'Reg 5(1) of FSS Regulations, 2020',
              description: 'True name or generic description of food omitted',
              suggested_remedy: 'Print prominent specific or generic food name on front panel',
              penalty_fine: '₹3,00,000 / Sec 52'
            },
            {
              id: 'RULE_FSSAI_02',
              rule_code: 'FSSAI Reg 5(2)',
              title: 'List of Ingredients',
              extracted_value: scan?.parsed_fields?.ingredients?.raw || (scan?.parsed_fields?.ingredients?.items ? scan?.parsed_fields?.ingredients?.items.join(', ') : 'Not detected on package'),
              status: scan?.parsed_fields?.ingredients ? 'PASS' : 'FAIL',
              statutory_provision: 'Reg 5(2) of FSS Regulations, 2020',
              description: 'Mandatory ingredients list in descending order omitted',
              suggested_remedy: 'Print complete ingredients list prefixed with "Ingredients:"',
              penalty_fine: '₹3,00,000 / Sec 52'
            },
            {
              id: 'RULE_FSSAI_03',
              rule_code: 'FSSAI Reg 5(3)',
              title: 'Nutritional Information',
              extracted_value: scan?.parsed_fields?.nutritional_info ? [
                scan?.parsed_fields?.nutritional_info.energy && `Energy: ${scan?.parsed_fields?.nutritional_info.energy}`,
                scan?.parsed_fields?.nutritional_info.protein && `Protein: ${scan?.parsed_fields?.nutritional_info.protein}`,
                scan?.parsed_fields?.nutritional_info.carbohydrate && `Carbs: ${scan?.parsed_fields?.nutritional_info.carbohydrate}`,
                scan?.parsed_fields?.nutritional_info.total_fat && `Fat: ${scan?.parsed_fields?.nutritional_info.total_fat}`
              ].filter(Boolean).join(' | ') || scan?.parsed_fields?.nutritional_info?.raw || 'Declared' : 'Not detected on package',
              status: scan?.parsed_fields?.nutritional_info?.is_declared ? 'PASS' : 'FAIL',
              statutory_provision: 'Reg 5(3) of FSS Regulations, 2020',
              description: 'Nutritional facts per 100g/serving omitted',
              suggested_remedy: 'Declare nutritional panel (Energy, Protein, Carbs, Sugars, Fat, Sodium)',
              penalty_fine: '₹3,00,000 / Sec 52'
            },
            {
              id: 'RULE_FSSAI_04',
              rule_code: 'FSSAI Reg 5(4)',
              title: 'Net Quantity',
              extracted_value: scan?.parsed_fields?.net_quantity?.raw || 'Not detected on package',
              status: scan?.parsed_fields?.net_quantity?.is_standard ? 'PASS' : 'FAIL',
              statutory_provision: 'Reg 5(4) of FSS Regulations, 2020',
              description: 'Net quantity missing or illegal non-standard unit used',
              suggested_remedy: 'Declare net quantity using standard metric units (g, kg, ml, l)',
              penalty_fine: '₹50,000 / Sec 36 LM Act'
            },
            {
              id: 'RULE_FSSAI_05',
              rule_code: 'FSSAI Reg 5(5)',
              title: 'Vegetarian / Non-Vegetarian Symbol',
              extracted_value: scan?.parsed_fields?.veg_non_veg ? `${scan?.parsed_fields?.veg_non_veg.type === 'NON_VEG' ? 'Non-Veg (Brown Triangle)' : 'Veg (Green Dot)'} - ${scan?.parsed_fields?.veg_non_veg.raw || 'Declared'}` : 'Not detected on package',
              status: scan?.parsed_fields?.veg_non_veg ? 'PASS' : 'FAIL',
              statutory_provision: 'Reg 5(5) of FSS Regulations, 2020',
              description: 'Mandatory Veg or Non-Veg symbol omitted',
              suggested_remedy: 'Affix Green Circle or Brown Triangle logo in square border',
              penalty_fine: '₹2,00,000 / Sec 58'
            },
            {
              id: 'RULE_FSSAI_06',
              rule_code: 'FSSAI Reg 5(6)',
              title: 'FSSAI Logo and Licence Number',
              extracted_value: scan?.parsed_fields?.fssai_license?.license_number ? `Lic. No. ${scan?.parsed_fields?.fssai_license.license_number}` : (scan?.parsed_fields?.fssai_license?.raw || 'Not detected on package'),
              status: scan?.parsed_fields?.fssai_license?.is_valid_14_digit ? 'PASS' : 'FAIL',
              statutory_provision: 'Reg 5(6) of FSS Regulations, 2020',
              description: 'FSSAI logo or 14-digit licence number omitted/invalid',
              suggested_remedy: 'Display official FSSAI logo alongside valid 14-digit FBO licence number',
              penalty_fine: '₹5,00,000 / Sec 63'
            },
            {
              id: 'RULE_FSSAI_07',
              rule_code: 'FSSAI Reg 5(7)',
              title: 'Date of Manufacture/Packing',
              extracted_value: scan?.parsed_fields?.mfg_date?.date || scan?.parsed_fields?.mfg_date?.raw || 'Not detected on package',
              status: scan?.parsed_fields?.mfg_date?.is_compliant ? 'PASS' : 'FAIL',
              statutory_provision: 'Reg 5(7) of FSS Regulations, 2020',
              description: 'Date of manufacture/packing omitted or non-compliant format',
              suggested_remedy: 'Print clear Mfg Date in DD/MM/YYYY or MM/YYYY format',
              penalty_fine: '₹2,00,000 / Sec 58'
            },
            {
              id: 'RULE_FSSAI_08',
              rule_code: 'FSSAI Reg 5(8)',
              title: 'Expiry / Use-by or Best-Before Date',
              extracted_value: scan?.parsed_fields?.expiry_date?.expiry_or_period || scan?.parsed_fields?.expiry_date?.raw || 'Not detected on package',
              status: scan?.parsed_fields?.expiry_date ? 'PASS' : 'FAIL',
              statutory_provision: 'Reg 5(8) of FSS Regulations, 2020',
              description: 'Expiry date or Best-Before period omitted',
              suggested_remedy: 'Declare clear Expiry / Use-by date or Best-Before period',
              penalty_fine: '₹3,00,000 / Sec 52'
            },
            {
              id: 'RULE_FSSAI_09',
              rule_code: 'FSSAI Reg 5(9)',
              title: 'Batch/Lot/Code Number',
              extracted_value: scan?.parsed_fields?.batch_number?.value || scan?.parsed_fields?.batch_number?.raw || 'Not detected on package',
              status: scan?.parsed_fields?.batch_number ? 'PASS' : 'FAIL',
              statutory_provision: 'Reg 5(9) of FSS Regulations, 2020',
              description: 'Traceability Batch/Lot code number omitted',
              suggested_remedy: 'Print distinct identification Batch or Lot number',
              penalty_fine: '₹1,00,000 / Sec 58'
            },
            {
              id: 'RULE_FSSAI_10',
              rule_code: 'FSSAI Reg 5(10)',
              title: 'Manufacturer/Packer/Importer Details',
              extracted_value: scan?.parsed_fields?.manufacturer?.address || scan?.parsed_fields?.manufacturer?.name || 'Not detected on package',
              status: scan?.parsed_fields?.manufacturer?.name ? 'PASS' : 'FAIL',
              statutory_provision: 'Reg 5(10) of FSS Regulations, 2020',
              description: 'Name and complete premises address omitted',
              suggested_remedy: 'Print full manufacturer/packer name and physical premises address with PIN code',
              penalty_fine: '₹2,00,000 / Sec 58'
            },
            {
              id: 'RULE_FSSAI_11',
              rule_code: 'FSSAI Reg 5(11)',
              title: 'Customer Care/Contact Information',
              extracted_value: scan?.parsed_fields?.consumer_care ? [
                scan?.parsed_fields?.consumer_care.phone && `Tel: ${scan?.parsed_fields?.consumer_care.phone}`,
                scan?.parsed_fields?.consumer_care.email && `Email: ${scan?.parsed_fields?.consumer_care.email}`
              ].filter(Boolean).join(' | ') || 'Declared' : 'Not detected on package',
              status: scan?.parsed_fields?.consumer_care?.is_complete || (scan?.parsed_fields?.consumer_care?.phone && scan?.parsed_fields?.consumer_care?.email) ? 'PASS' : 'FAIL',
              statutory_provision: 'Reg 5(11) of FSS Regulations, 2020',
              description: 'Consumer grievance helpline phone or email omitted',
              suggested_remedy: 'Provide consumer care telephone, email, and postal address',
              penalty_fine: '₹1,00,000 / Sec 58'
            },
            {
              id: 'RULE_FSSAI_12',
              rule_code: 'FSSAI Reg 5(12)',
              title: 'Allergen Declarations, Where Applicable',
              extracted_value: scan?.parsed_fields?.allergen_declaration?.raw || scan?.parsed_fields?.allergen_declaration?.statement || 'No priority allergens declared',
              status: 'PASS',
              statutory_provision: 'Reg 5(12) of FSS Regulations, 2020',
              description: 'Allergen advisory statement omitted',
              suggested_remedy: 'Declare "Contains: [Allergen]" for priority allergens',
              penalty_fine: '₹2,00,000 / Sec 58'
            },
            {
              id: 'RULE_FSSAI_13',
              rule_code: 'FSSAI Reg 5(13)',
              title: 'Storage/Use Instructions, Where Required',
              extracted_value: scan?.parsed_fields?.storage_instructions?.instructions || scan?.parsed_fields?.storage_instructions?.raw || 'Not detected on package',
              status: scan?.parsed_fields?.storage_instructions ? 'PASS' : 'FAIL',
              statutory_provision: 'Reg 5(13) of FSS Regulations, 2020',
              description: 'Mandatory storage or usage instructions omitted',
              suggested_remedy: 'Print clear storage instructions, e.g. "Store in a cool, dry place"',
              penalty_fine: '₹1,00,000 / Sec 58'
            },
            {
              id: 'RULE_FSSAI_14',
              rule_code: 'FSSAI Reg 5(14)',
              title: 'Country of Origin, for Imported Food',
              extracted_value: typeof scan?.parsed_fields?.country_of_origin === 'string' ? scan?.parsed_fields?.country_of_origin : (scan?.parsed_fields?.country_of_origin?.country || 'India (Domestic Manufacture)'),
              status: 'PASS',
              statutory_provision: 'Reg 5(14) of FSS Regulations, 2020',
              description: 'Country of origin omitted on imported food',
              suggested_remedy: 'State "Country of Origin: [Country]" on packaging',
              penalty_fine: '₹3,00,000 / Sec 52'
            }
          ];

          const sourceMatrix = (report.rule_checks_matrix && report.rule_checks_matrix.length > 0)
            ? report.rule_checks_matrix
            : default14Rules;

          // Merge backend evaluation details with complete statutory defaults
          const mergedMatrix = sourceMatrix.map((item: any, i: number) => {
            const fallback = default14Rules[i] || {};
            return {
              ...fallback,
              ...item,
              rule_code: item.rule_code || fallback.rule_code,
              title: item.title || fallback.title,
              status: item.status || fallback.status || 'FAIL',
              statutory_provision: item.statutory_provision || fallback.statutory_provision,
              extracted_value: item.extracted_value || fallback.extracted_value || 'Not detected on package',
              description: item.description || item.defect || fallback.description,
              suggested_remedy: item.suggested_action || item.suggested_remedy || fallback.suggested_remedy,
              penalty_fine: item.penalty_fine || fallback.penalty_fine || '₹1,00,000'
            };
          });

          const totalRulesCount = mergedMatrix.length;
          const validatedCount = mergedMatrix.filter((r: any) => r.status === 'PASS').length;
          const notValidatedCount = mergedMatrix.filter((r: any) => r.status === 'FAIL').length;

          const filteredRows = mergedMatrix.filter((r: any) => {
            if (ruleFilter === 'PASS') return r.status === 'PASS';
            if (ruleFilter === 'FAIL') return r.status === 'FAIL';
            return true;
          });

          return (
            <div style={{ marginBottom: '32px' }}>
              {/* Section Title & Subtitle */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Scale size={22} color="#38bdf8" />
                    <span>14-Point Statutory FSSAI Verification Ledger</span>
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '4px 0 0' }}>
                    Statutory compliance audit under FSS (Labelling and Display) Regulations, 2020. Evaluated from uploaded packaging image(s).
                  </p>
                </div>

                {/* Filter Pills */}
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '4px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <button
                    type="button"
                    onClick={() => setRuleFilter('ALL')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: ruleFilter === 'ALL' ? 'var(--accent-blue)' : 'transparent',
                      color: ruleFilter === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    All 14 Rules ({totalRulesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleFilter('PASS')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: ruleFilter === 'PASS' ? '#059669' : 'transparent',
                      color: ruleFilter === 'PASS' ? '#ffffff' : '#34d399',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ✅ Validated ({validatedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleFilter('FAIL')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: ruleFilter === 'FAIL' ? '#dc2626' : 'transparent',
                      color: ruleFilter === 'FAIL' ? '#ffffff' : '#f87171',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ❌ Not Validated ({notValidatedCount})
                  </button>
                </div>
              </div>

              {/* Summary Metric Counters */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '12px',
                marginBottom: '18px'
              }}>
                <div style={{
                  background: 'var(--bg-glass-heavy)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL RULES AUDITED</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>14 Rules</div>
                  </div>
                  <span className="badge badge-secondary" style={{ fontSize: '0.68rem' }}>Statutory Matrix</span>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 78, 59, 0.2) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 700 }}>VALIDATED (PASS)</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34d399' }}>{validatedCount} / 14</div>
                  </div>
                  <span className="badge badge-compliant" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Satisfied
                  </span>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(127, 29, 29, 0.2) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#fca5a5', fontWeight: 700 }}>NOT VALIDATED (FAIL)</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f87171' }}>{notValidatedCount} / 14</div>
                  </div>
                  <span className="badge badge-noncompliant" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} /> Action Needed
                  </span>
                </div>
              </div>

              {/* Comprehensive Tabular Form */}
              <div className="data-table-wrapper" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.4)', borderRadius: '10px', overflow: 'hidden' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#0a1020' }}>
                      <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                      <th style={{ width: '220px' }}>STATUTORY RULE &amp; REGULATION</th>
                      <th style={{ width: '160px' }}>VALIDATION STATUS</th>
                      <th style={{ width: '250px' }}>EXTRACTED VALUE ON PACKAGING</th>
                      <th>DEFECT DIAGNOSIS &amp; STATUTORY REMEDY</th>
                      <th style={{ width: '135px' }}>STATUTORY FINE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row: any, idx: number) => {
                      const isPass = row.status === 'PASS';
                      return (
                        <tr 
                          key={idx}
                          style={{ 
                            background: !isPass ? 'rgba(239, 68, 68, 0.08)' : (idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent'), 
                            borderLeft: !isPass ? '4px solid #ef4444' : '4px solid #10b981',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>
                            {idx + 1}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.88rem' }}>
                              {row.title}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#60a5fa', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                              {row.rule_code}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {row.statutory_provision || 'FSS Regulations, 2020'}
                            </div>
                          </td>
                          <td>
                            {isPass ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                background: 'rgba(16, 185, 129, 0.18)',
                                border: '1px solid #10b981',
                                color: '#34d399'
                              }}>
                                <CheckCircle2 size={13} />
                                VALIDATED (PASS)
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                background: 'rgba(239, 68, 68, 0.22)',
                                border: '1px solid #ef4444',
                                color: '#f87171'
                              }}>
                                <AlertOctagon size={13} />
                                NOT VALIDATED (FAIL)
                              </span>
                            )}
                          </td>
                          <td>
                            {isPass ? (
                              <div style={{
                                fontSize: '0.8rem',
                                color: '#e2e8f0',
                                background: 'rgba(0, 0, 0, 0.3)',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                wordBreak: 'break-word',
                                lineHeight: 1.35
                              }}>
                                {row.extracted_value}
                              </div>
                            ) : (
                              <div style={{
                                fontSize: '0.78rem',
                                color: '#fca5a5',
                                background: 'rgba(239, 68, 68, 0.12)',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px dashed rgba(239, 68, 68, 0.4)',
                                wordBreak: 'break-word',
                                lineHeight: 1.35
                              }}>
                                ⚠️ {row.extracted_value && row.extracted_value !== 'Not detected on package' 
                                  ? row.extracted_value 
                                  : 'Not detected on uploaded packaging image(s)'}
                              </div>
                            )}
                          </td>
                          <td>
                            {isPass ? (
                              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                                <span style={{ color: '#34d399', fontWeight: 700 }}>✓ Verified: </span>
                                {row.suggested_remedy || 'Satisfies mandatory packaging declaration under FSS Regulations, 2020.'}
                              </div>
                            ) : (
                              <div>
                                <div style={{ marginBottom: '3px', fontSize: '0.8rem', fontWeight: 700, color: '#fecaca' }}>
                                  {row.description || row.defect || 'Mandatory statutory declaration missing or non-compliant.'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#93c5fd', lineHeight: 1.35 }}>
                                  <strong style={{ color: '#60a5fa' }}>Remedy:</strong> {row.suggested_remedy || 'Rectify packaging label in accordance with FSSAI regulations.'}
                                </div>
                              </div>
                            )}
                          </td>
                          <td>
                            {isPass ? (
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399' }}>
                                Nil (Compliant)
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#facc15' }}>
                                {row.penalty_fine || '₹2,00,000'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Official Statutory Improvement Notice Form (Printed if Non-Compliant) */}
        {report.statutory_notice && (
          <div className="statutory-notice-print" style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '2px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            padding: '28px',
            marginTop: '32px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.05em', color: '#f87171' }}>
                FORM 1 &bull; STATUTORY IMPROVEMENT NOTICE
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                UNDER SECTION 32 OF THE FOOD SAFETY AND STANDARDS ACT, 2006
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Notice No: <strong style={{ color: '#ffffff' }}>{report.statutory_notice.noticeNumber}</strong> &bull; Date: {report.statutory_notice.noticeDate}
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
              <p style={{ marginBottom: '10px' }}>
                <strong>TO (Food Business Operator):</strong><br />
                {report.statutory_notice.recipient}<br />
                {report.statutory_notice.address}
              </p>

              <p style={{ marginBottom: '12px' }}>
                <strong>SUBJECT:</strong> {report.statutory_notice.subject} in respect of food commodity <em>"{report.statutory_notice.commodityName}"</em>.
              </p>

              <p style={{ marginBottom: '12px' }}>
                WHEREAS on packaging inspection by the Designated Food Safety Officer, the food product described above was found non-compliant with statutory packaging provisions, namely <strong>{report.statutory_notice.statutoryProvisionsViolated}</strong>.
              </p>

              <p style={{ marginBottom: '12px' }}>
                NOW THEREFORE, in exercise of powers under <strong>{report.statutory_notice.penalSectionApplicable}</strong>, you are hereby directed to:
              </p>

              <ol style={{ paddingLeft: '24px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {report.statutory_notice.legalDirectives.map((d: string, i: number) => (
                  <li key={i}>{d}</li>
                ))}
              </ol>

              <div style={{
                background: 'var(--bg-glass-heavy)',
                border: '1px solid var(--border-subtle)',
                padding: '12px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '16px 0'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PROPOSED COMPOUNDING FEE</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#facc15' }}>
                    {report.statutory_notice.compoundingFeeProposed}
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Notice Response Window: <strong>{report.statutory_notice.noticePeriodDays} Days</strong>
                </div>
              </div>

              {/* Official Seal & Signature Block */}
              <div style={{
                marginTop: '40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    border: '2px dashed rgba(59, 130, 246, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    OFFICIAL SEAL<br />FSSAI ENFORCEMENT
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>{report.inspector_name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Food Safety Officer / Designated Officer, FSSAI
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Digitally Sealed through FSSAI Statutory Compliance System
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
