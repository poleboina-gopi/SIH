import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, AlertOctagon, AlertTriangle, ScanLine, 
  ArrowUpRight, Clock, FileCheck, FileText, IndianRupee, Layers, 
  CheckCircle2, XCircle, Trash2, Eye, X 
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, User } from '../types';
import { SAMPLE_LABELS, SampleLabel } from '../data/sampleLabels';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

interface InspectorDashboardProps {
  user: User;
  onNavigateScan: () => void;
  onSelectSample: (sample: SampleLabel) => void;
  onViewReport: (scanId: string) => void;
}

export const InspectorDashboard: React.FC<InspectorDashboardProps> = ({
  user,
  onNavigateScan,
  onSelectSample,
  onViewReport
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [selectedDetailSample, setSelectedDetailSample] = useState<SampleLabel | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteScan(deleteTarget.id);
      setDeleteTarget(null);
      setFeedbackMessage(res.message || 'Inspection deleted successfully.');
      setTimeout(() => setFeedbackMessage(null), 4000);
      await loadDashboardData();
    } catch (err: any) {
      alert("Failed to delete inspection: " + (err.message || 'Unauthorized'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Top Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '26px 32px',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              border: '1px solid rgba(16, 185, 129, 0.4)'
            }}>
              OFFICIAL ENFORCEMENT SESSION ACTIVE
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• Circle: Delhi Central</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
            Inspector Portal: {user.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px', margin: '4px 0 0' }}>
            {user.designation} • Badge: {user.badgeNumber || 'LM-DEL-2024'}
          </p>
        </div>

        {/* Hide Start New Inspection button strictly for ADMIN users */}
        {user.role === 'inspector' && (
          <button
            onClick={onNavigateScan}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '0.92rem', fontWeight: 700, gap: '10px' }}
          >
            <ScanLine size={18} />
            Start New Inspection
          </button>
        )}
      </div>

      {/* KPI Counters Grid */}
      <div className="grid-4" style={{ marginBottom: '32px', gap: '16px' }}>
        {/* Total Scans */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em' }}>
            <span>TOTAL INSPECTIONS</span>
            <Layers size={18} color="#60a5fa" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 2px', color: '#ffffff', lineHeight: 1.1 }}>
            {stats ? stats.total_scans : 2}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Packaged commodities analyzed
          </div>
        </div>

        {/* Compliant Scans */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#34d399', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em' }}>
            <span>COMPLIANT LABELS</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 2px', color: '#10b981', lineHeight: 1.1 }}>
            {stats ? stats.compliant_scans : 1}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>✅</span>
            <span>{stats ? `${stats.compliance_rate}% pass rate` : '50% pass rate'}</span>
          </div>
        </div>

        {/* Non-Compliant Scans */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#f87171', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em' }}>
            <span>VIOLATIONS DETECTED</span>
            <AlertOctagon size={18} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 2px', color: '#f43f5e', lineHeight: 1.1 }}>
            {stats ? stats.total_violations : 3}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>❌</span>
            <span>Across {stats ? stats.non_compliant_scans : 1} non-compliant packages</span>
          </div>
        </div>

        {/* Penalties Estimated */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fbbf24', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em' }}>
            <span>COMPOUNDING FINES</span>
            <IndianRupee size={18} color="#facc15" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0 2px', color: '#facc15', lineHeight: 1.1 }}>
            ₹{stats ? stats.total_penalties_estimated.toLocaleString('en-IN') : '75,000'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Statutory fines under Sec. 36
          </div>
        </div>
      </div>

      {/* 1-Click Benchmark Test Suite Launcher */}
      <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                1-Click Benchmark Test Suite
              </h2>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                Instant Demo
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              Pre-calibrated packaging samples to test real-time OCR and statutory compliance rules
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          {SAMPLE_LABELS.map((sample) => {
            const isCompliant = sample.expectedStatus === 'COMPLIANT';
            const isNonCompliant = sample.expectedStatus === 'NON_COMPLIANT';

            return (
              <div
                key={sample.id}
                style={{
                  background: 'var(--bg-glass-heavy)',
                  border: `1px solid ${isCompliant ? 'rgba(16, 185, 129, 0.35)' : isNonCompliant ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                  borderRadius: '14px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  {/* Status Badge with Icon & Category */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className={`badge ${isCompliant ? 'badge-compliant' : isNonCompliant ? 'badge-noncompliant' : 'badge-warning'}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 700 }}
                    >
                      <span>{isCompliant ? '✅' : isNonCompliant ? '❌' : '⚠️'}</span>
                      <span>{sample.expectedStatus}</span>
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sample.category}</span>
                  </div>

                  {/* Product Name (Limited to 2 lines max with ellipsis) */}
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.98rem',
                    color: '#ffffff',
                    marginBottom: '3px',
                    lineHeight: 1.35,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {sample.name}
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Brand: {sample.brand}
                  </div>

                  {/* Key Issues (Max 2 bullet points with icons, zero paragraphs) */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '16px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {sample.keyIssues && sample.keyIssues.slice(0, 2).map((issue, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.75rem',
                          color: issue.type === 'violation' ? '#fca5a5' : issue.type === 'warning' ? '#fde68a' : '#a7f3d0'
                        }}
                      >
                        <span style={{ flexShrink: 0, fontSize: '0.72rem' }}>
                          {issue.type === 'violation' ? '❌' : issue.type === 'warning' ? '⚠️' : '✅'}
                        </span>
                        <span style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 500
                        }}>
                          {issue.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action Controls: View Details + Inspect */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDetailSample(sample)}
                    className="btn btn-secondary"
                    style={{
                      padding: '7px 10px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      gap: '5px',
                      justifyContent: 'center'
                    }}
                  >
                    <Eye size={13} />
                    <span>View Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSample(sample)}
                    className="btn btn-primary"
                    style={{
                      padding: '7px 10px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      gap: '5px',
                      justifyContent: 'center'
                    }}
                  >
                    <span>Inspect</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benchmark Sample Details Modal (visible only after click) */}
      {selectedDetailSample && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '600px',
            width: '100%',
            background: '#0f172a',
            border: `1px solid ${
              selectedDetailSample.expectedStatus === 'COMPLIANT' 
                ? 'rgba(16, 185, 129, 0.4)' 
                : selectedDetailSample.expectedStatus === 'NON_COMPLIANT' 
                  ? 'rgba(239, 68, 68, 0.4)' 
                  : 'rgba(245, 158, 11, 0.4)'
            }`,
            borderRadius: '16px',
            padding: '26px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className={`badge ${
                    selectedDetailSample.expectedStatus === 'COMPLIANT' 
                      ? 'badge-compliant' 
                      : selectedDetailSample.expectedStatus === 'NON_COMPLIANT' 
                        ? 'badge-noncompliant' 
                        : 'badge-warning'
                  }`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span>{selectedDetailSample.expectedStatus === 'COMPLIANT' ? '✅' : selectedDetailSample.expectedStatus === 'NON_COMPLIANT' ? '❌' : '⚠️'}</span>
                    <span>{selectedDetailSample.expectedStatus}</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedDetailSample.category}</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {selectedDetailSample.name}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                  Brand: {selectedDetailSample.brand}
                </p>
              </div>

              <button
                onClick={() => setSelectedDetailSample(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Full Technical Description */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Statutory Benchmark Overview
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                {selectedDetailSample.description}
              </p>
            </div>

            {/* Verified Declarations & Breaches */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Key Statutory Declarations &amp; Breaches
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedDetailSample.keyIssues?.map((issue, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: issue.type === 'violation' ? 'rgba(239, 68, 68, 0.1)' : issue.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    border: `1px solid ${issue.type === 'violation' ? 'rgba(239, 68, 68, 0.25)' : issue.type === 'warning' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                    fontSize: '0.82rem'
                  }}>
                    <span>{issue.type === 'violation' ? '❌' : issue.type === 'warning' ? '⚠️' : '✅'}</span>
                    <span style={{ color: issue.type === 'violation' ? '#fca5a5' : issue.type === 'warning' ? '#fde68a' : '#a7f3d0', fontWeight: 600 }}>
                      {issue.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button
                onClick={() => setSelectedDetailSample(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  const sample = selectedDetailSample;
                  setSelectedDetailSample(null);
                  onSelectSample(sample);
                }}
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.85rem', fontWeight: 700, gap: '8px' }}
              >
                <ScanLine size={16} />
                <span>Inspect This Commodity</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Inspections Table */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Recent Commodity Inspections
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px', margin: '3px 0 0' }}>
              Official verification log with legal status and statutory penalties
            </p>
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>COMMODITY &amp; BRAND</th>
                <th>CATEGORY</th>
                <th>STATUS</th>
                <th>COMPLIANCE SCORE</th>
                <th>VIOLATIONS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_inspections && stats.recent_inspections.length > 0 ? (
                stats.recent_inspections.map((scan) => (
                  <tr key={scan.scan_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{scan.product_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{scan.brand}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {scan.category}
                    </td>
                    <td>
                      <span className={`badge ${
                        scan.compliance_status === 'COMPLIANT' 
                          ? 'badge-compliant' 
                          : scan.compliance_status === 'NON_COMPLIANT' 
                            ? 'badge-noncompliant' 
                            : 'badge-warning'
                      }`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span>{scan.compliance_status === 'COMPLIANT' ? '✅' : scan.compliance_status === 'NON_COMPLIANT' ? '❌' : '⚠️'}</span>
                        <span>{scan.compliance_status}</span>
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          flex: 1,
                          height: '6px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          width: '70px'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${scan.compliance_score}%`,
                            background: scan.compliance_score > 80 ? '#10b981' : scan.compliance_score > 50 ? '#f59e0b' : '#ef4444'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{scan.compliance_score}%</span>
                      </div>
                    </td>
                    <td>
                      {scan.violations_count > 0 ? (
                        <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>❌</span>
                          <span>{scan.violations_count} Detected</span>
                        </span>
                      ) : (
                        <span style={{ color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>✅</span>
                          <span>None (Passed)</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => onViewReport(scan.scan_id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
                        >
                          <FileText size={14} />
                          <span>View Report</span>
                        </button>

                        <button
                          onClick={() => setDeleteTarget({ id: scan.scan_id, name: `${scan.product_name} (${scan.brand})` })}
                          className="btn btn-danger"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.78rem',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#ef4444'
                          }}
                          title="Delete Inspection"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No recent inspections recorded.{user.role === 'inspector' ? ' Click "Start New Inspection" above.' : ''}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success Feedback Notification */}
      {feedbackMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#064e3b',
          border: '1px solid #10b981',
          borderRadius: '10px',
          padding: '14px 20px',
          color: '#ecfdf5',
          fontSize: '0.9rem',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Inspection"
        message="Are you sure you want to delete this inspection?"
        itemName={deleteTarget?.name}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
