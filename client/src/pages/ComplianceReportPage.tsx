import React, { useEffect, useState } from 'react';
import { 
  Printer, Download, ArrowLeft, ShieldCheck, AlertOctagon, 
  AlertTriangle, Scale, CheckCircle2, FileText, Send, Share2, CornerDownRight 
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

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownloadPdf = async () => {
    if (!reportData) return;
    setIsDownloadingPdf(true);
    try {
      await api.downloadReportPdf(
        reportData.report.id,
        `Legal_Metrology_Report_${reportData.report.report_number || reportData.report.id}.pdf`
      );
    } catch (err: any) {
      alert("Failed to download PDF: " + (err.message || 'Unknown error'));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDeleteInspection = async () => {
    if (!reportData) return;
    setIsDeleting(true);
    try {
      await api.deleteScan(reportData.scan.id);
      alert("Inspection record and associated files successfully deleted.");
      onBack();
    } catch (err: any) {
      alert("Failed to delete inspection: " + (err.message || 'Unauthorized'));
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

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

          <a
            href={api.getExportUrl(report.id, 'json')}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ gap: '8px' }}
          >
            <Download size={16} />
            JSON
          </a>

          <a
            href={api.getExportUrl(report.id, 'csv')}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ gap: '8px' }}
          >
            <Download size={16} />
            CSV
          </a>

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
        border: isNonCompliant ? '2px solid rgba(244, 63, 94, 0.4)' : '2px solid rgba(16, 185, 129, 0.4)',
        background: 'var(--bg-surface)'
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
                  DIRECTORATE OF LEGAL METROLOGY
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  STATUTORY COMMODITY INSPECTION CERTIFICATE
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Issued pursuant to Powers under Section 15 of Legal Metrology Act, 2009 &amp; Packaged Commodities Rules, 2011.
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
                  ? 'All mandatory packaging declarations satisfy the Legal Metrology (Packaged Commodities) Rules, 2011.'
                  : `${violations.length} statutory violation(s) detected. Subject to penal proceedings under Section 36.`}
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
                    {missingViolations.length} essential declaration(s) required under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011 were not found on this packaging.
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

        {/* Statutory Declarations Breakdown Matrix with Visual Missing Field Highlights */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--accent-blue-light)" />
            <span>Declarations Verification Matrix (Rules 2011)</span>
          </h2>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>STATUTORY CLAUSE</th>
                  <th>MANDATORY REQUIREMENT</th>
                  <th>VALUE EXTRACTED FROM PACKAGE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {/* Rule 6(1)(a) */}
                {(() => {
                  const isMissing = !scan?.parsed_fields?.manufacturer || !scan?.parsed_fields?.manufacturer?.name;
                  return (
                    <tr style={{ background: isMissing ? 'rgba(239, 68, 68, 0.08)' : undefined, borderLeft: isMissing ? '4px solid #ef4444' : undefined }}>
                      <td style={{ fontWeight: 700 }}>Rule 6(1)(a)</td>
                      <td>Complete name and physical address of Manufacturer / Packer / Importer</td>
                      <td style={{ fontSize: '0.82rem', color: isMissing ? '#f87171' : undefined }}>
                        {scan?.parsed_fields?.manufacturer?.address || scan?.parsed_fields?.manufacturer?.raw || 'Not detected on package'}
                      </td>
                      <td>
                        {!isMissing ? (
                          <span className="badge badge-compliant">VERIFIED</span>
                        ) : (
                          <span className="badge badge-noncompliant">OMITTED (CRITICAL DEFECT)</span>
                        )}
                      </td>
                    </tr>
                  );
                })()}

                {/* Rule 6(1)(b) */}
                {(() => {
                  const isMissing = !scan?.parsed_fields?.commodity_name || scan?.parsed_fields?.commodity_name === 'Packaged Commodity';
                  return (
                    <tr style={{ background: isMissing ? 'rgba(239, 68, 68, 0.08)' : undefined, borderLeft: isMissing ? '4px solid #ef4444' : undefined }}>
                      <td style={{ fontWeight: 700 }}>Rule 6(1)(b)</td>
                      <td>Common or generic name of commodity</td>
                      <td style={{ fontSize: '0.82rem', color: isMissing ? '#f87171' : undefined }}>
                        {scan?.parsed_fields?.commodity_name || 'Generic Commodity'}
                      </td>
                      <td>
                        {!isMissing ? (
                          <span className="badge badge-compliant">VERIFIED</span>
                        ) : (
                          <span className="badge badge-noncompliant">OMITTED</span>
                        )}
                      </td>
                    </tr>
                  );
                })()}

                {/* Rule 6(1)(c) */}
                {(() => {
                  const isMissing = !scan?.parsed_fields?.net_quantity || !scan?.parsed_fields?.net_quantity?.raw;
                  const isIllegal = scan?.parsed_fields?.net_quantity && !scan?.parsed_fields?.net_quantity?.is_standard;
                  return (
                    <tr style={{ 
                      background: isMissing ? 'rgba(239, 68, 68, 0.08)' : isIllegal ? 'rgba(245, 158, 11, 0.08)' : undefined, 
                      borderLeft: isMissing ? '4px solid #ef4444' : isIllegal ? '4px solid #f59e0b' : undefined 
                    }}>
                      <td style={{ fontWeight: 700 }}>Rule 6(1)(c)</td>
                      <td>Net quantity in standard metric units (Rule 12 &amp; 13: g, kg, ml, l)</td>
                      <td style={{ fontSize: '0.82rem', color: isMissing ? '#f87171' : isIllegal ? '#fbbf24' : undefined }}>
                        {scan?.parsed_fields?.net_quantity?.raw || 'Not detected on package'}
                      </td>
                      <td>
                        {isMissing ? (
                          <span className="badge badge-noncompliant">OMITTED (CRITICAL DEFECT)</span>
                        ) : isIllegal ? (
                          <span className="badge badge-warning">ILLEGAL UNIT ('{scan?.parsed_fields?.net_quantity?.unit}')</span>
                        ) : (
                          <span className="badge badge-compliant">STANDARD</span>
                        )}
                      </td>
                    </tr>
                  );
                })()}

                {/* Rule 6(1)(d) */}
                {(() => {
                  const isMissing = !scan?.parsed_fields?.mfg_date || !scan?.parsed_fields?.mfg_date?.date;
                  const isInvalid = scan?.parsed_fields?.mfg_date && !scan?.parsed_fields?.mfg_date?.is_compliant;
                  return (
                    <tr style={{ 
                      background: isMissing ? 'rgba(239, 68, 68, 0.08)' : isInvalid ? 'rgba(245, 158, 11, 0.08)' : undefined, 
                      borderLeft: isMissing ? '4px solid #ef4444' : isInvalid ? '4px solid #f59e0b' : undefined 
                    }}>
                      <td style={{ fontWeight: 700 }}>Rule 6(1)(d)</td>
                      <td>Month and year of manufacture or pre-packing (MM/YYYY or Month YYYY)</td>
                      <td style={{ fontSize: '0.82rem', color: isMissing ? '#f87171' : isInvalid ? '#fbbf24' : undefined }}>
                        {scan?.parsed_fields?.mfg_date?.date || 'Not detected on package'}
                      </td>
                      <td>
                        {isMissing ? (
                          <span className="badge badge-noncompliant">OMITTED (CRITICAL DEFECT)</span>
                        ) : isInvalid ? (
                          <span className="badge badge-warning">INVALID DATE FORMAT</span>
                        ) : (
                          <span className="badge badge-compliant">VERIFIED</span>
                        )}
                      </td>
                    </tr>
                  );
                })()}

                {/* Rule 6(1)(e) */}
                {(() => {
                  const isMissing = !scan?.parsed_fields?.mrp || !scan?.parsed_fields?.mrp?.raw;
                  const noTaxClause = scan?.parsed_fields?.mrp && !scan?.parsed_fields?.mrp?.includes_taxes;
                  return (
                    <tr style={{ 
                      background: isMissing ? 'rgba(239, 68, 68, 0.08)' : noTaxClause ? 'rgba(245, 158, 11, 0.08)' : undefined, 
                      borderLeft: isMissing ? '4px solid #ef4444' : noTaxClause ? '4px solid #f59e0b' : undefined 
                    }}>
                      <td style={{ fontWeight: 700 }}>Rule 6(1)(e)</td>
                      <td>Maximum Retail Price (MRP) including "(inclusive of all taxes)"</td>
                      <td style={{ fontSize: '0.82rem', color: isMissing ? '#f87171' : noTaxClause ? '#fbbf24' : undefined }}>
                        {scan?.parsed_fields?.mrp?.raw || 'Not detected on package'}
                      </td>
                      <td>
                        {isMissing ? (
                          <span className="badge badge-noncompliant">MRP MISSING (CRITICAL)</span>
                        ) : noTaxClause ? (
                          <span className="badge badge-warning">MISSING TAX CLAUSE</span>
                        ) : (
                          <span className="badge badge-compliant">VERIFIED</span>
                        )}
                      </td>
                    </tr>
                  );
                })()}

                {/* Rule 6(1)(n) */}
                {(() => {
                  const isMissing = !scan?.parsed_fields?.consumer_care;
                  const missingEmail = scan?.parsed_fields?.consumer_care && !scan?.parsed_fields?.consumer_care?.email;
                  const missingPhone = scan?.parsed_fields?.consumer_care && !scan?.parsed_fields?.consumer_care?.phone;
                  return (
                    <tr style={{ 
                      background: isMissing ? 'rgba(239, 68, 68, 0.08)' : (missingEmail || missingPhone) ? 'rgba(245, 158, 11, 0.08)' : undefined, 
                      borderLeft: isMissing ? '4px solid #ef4444' : (missingEmail || missingPhone) ? '4px solid #f59e0b' : undefined 
                    }}>
                      <td style={{ fontWeight: 700 }}>Rule 6(1)(n)</td>
                      <td>Consumer grievance redressal details (Phone number AND Email ID mandatory)</td>
                      <td style={{ fontSize: '0.82rem' }}>
                        Tel: {scan?.parsed_fields?.consumer_care?.phone || 'Omitted'} &bull; Email: {scan?.parsed_fields?.consumer_care?.email || 'Omitted'}
                      </td>
                      <td>
                        {isMissing ? (
                          <span className="badge badge-noncompliant">OMITTED (CRITICAL)</span>
                        ) : (missingEmail || missingPhone) ? (
                          <span className="badge badge-warning">INCOMPLETE (EMAIL/PHONE MISSING)</span>
                        ) : (
                          <span className="badge badge-compliant">COMPLETE</span>
                        )}
                      </td>
                    </tr>
                  );
                })()}

                {/* Rule 7 */}
                <tr>
                  <td style={{ fontWeight: 700 }}>Rule 7</td>
                  <td>Minimum height of numerals and letters based on net quantity</td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {scan?.parsed_fields?.readability?.estimated_font_size || '>= 3.0mm'}
                  </td>
                  <td>
                    {scan?.parsed_fields?.readability?.clarity === 'LOW' ? (
                      <span className="badge badge-warning">BORDERLINE</span>
                    ) : (
                      <span className="badge badge-compliant">ADEQUATE</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Statutory Show Cause Notice Form (Printed if Non-Compliant) */}
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
                FORM 1 • STATUTORY SHOW CAUSE NOTICE
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                UNDER SECTION 36 READ WITH SECTION 48 OF THE LEGAL METROLOGY ACT, 2009
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Notice No: <strong style={{ color: '#ffffff' }}>{report.statutory_notice.noticeNumber}</strong> • Date: {report.statutory_notice.noticeDate}
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
              <p style={{ marginBottom: '10px' }}>
                <strong>TO:</strong><br />
                {report.statutory_notice.recipient}<br />
                {report.statutory_notice.address}
              </p>

              <p style={{ marginBottom: '12px' }}>
                <strong>SUBJECT:</strong> {report.statutory_notice.subject} in respect of commodity <em>"{report.statutory_notice.commodityName}"</em>.
              </p>

              <p style={{ marginBottom: '12px' }}>
                WHEREAS on inspection by the undersigned Legal Metrology Officer, the packaged commodity described above was found to be in contravention of statutory rules, namely <strong>{report.statutory_notice.statutoryProvisionsViolated}</strong>.
              </p>

              <p style={{ marginBottom: '12px' }}>
                NOW THEREFORE, in exercise of powers under <strong>{report.statutory_notice.penalSectionApplicable}</strong>, you are hereby called upon to:
              </p>

              <ol style={{ paddingLeft: '24px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {report.statutory_notice.legalDirectives.map((d, i) => (
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
                    OFFICIAL SEAL<br />LEGAL METROLOGY
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>{report.inspector_name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Inspector / Enforcement Officer, Legal Metrology
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Digitally Sealed through Legal Metrology Compliance System
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
