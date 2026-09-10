import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, AlertOctagon, AlertTriangle, ScanLine, 
  ArrowUpRight, Clock, FileCheck, FileText, IndianRupee, Layers, 
  CheckCircle2, XCircle, Trash2, Eye, X 
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, User } from '../types';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { MagicCard } from '../components/MagicCard';

interface InspectorDashboardProps {
  user: User;
  onNavigateScan: () => void;
  onSelectSample?: (sample: any) => void;
  onViewReport: (scanId: string) => void;
}

export const InspectorDashboard: React.FC<InspectorDashboardProps> = ({
  user,
  onNavigateScan,
  onViewReport
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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
        padding: '28px 36px',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(22, 23, 27, 0.7) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-squircle)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '9999px',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              letterSpacing: '0.04em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span className="status-dot-ping" />
              OFFICIAL ENFORCEMENT SESSION ACTIVE
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted-fg)' }}>• Circle: Delhi Central</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--fg)', letterSpacing: '-0.03em', margin: 0 }}>
            Inspector Portal: <span className="text-gradient-primary">{user.name}</span>
          </h1>
          <p style={{ color: 'var(--muted-fg)', fontSize: '0.86rem', marginTop: '6px', margin: '6px 0 0' }}>
            {user.designation} • Badge: {user.badgeNumber || 'LM-DEL-2024'}
          </p>
        </div>

        {/* Start New Inspection button strictly for INSPECTOR users */}
        {user.role === 'inspector' && (
          <button
            onClick={onNavigateScan}
            className="btn btn-primary"
            style={{ padding: '12px 26px', fontSize: '0.92rem', fontWeight: 700, gap: '10px' }}
          >
            <ScanLine size={18} />
            Start New Inspection
          </button>
        )}
      </div>

      {/* KPI Counters Bento Grid with MagicCard Mouse Aura */}
      <div className="grid-4" style={{ marginBottom: '32px', gap: '18px' }}>
        {/* Total Scans */}
        <MagicCard
          gradientColor="rgba(139, 92, 246, 0.16)"
          className="kpi-card"
          style={{
            padding: '24px 26px',
            ['--kpi-accent' as any]: '#8b5cf6',
            ['--kpi-glow' as any]: 'rgba(139, 92, 246, 0.3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: 'var(--muted-fg)', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.06em' }}>
              TOTAL INSPECTIONS
            </span>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={18} color="#a78bfa" />
            </div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, margin: '4px 0 2px', color: 'var(--fg)', lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
            <span className="text-gradient-primary">{stats ? stats.total_scans : 0}</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--muted-fg)' }}>
            Packaged commodities analyzed
          </div>
        </MagicCard>

        {/* Compliant Scans */}
        <MagicCard
          gradientColor="rgba(16, 185, 129, 0.16)"
          className="kpi-card"
          style={{
            padding: '24px 26px',
            ['--kpi-accent' as any]: '#10b981',
            ['--kpi-glow' as any]: 'rgba(16, 185, 129, 0.3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#10b981', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.06em' }}>
              COMPLIANT LABELS
            </span>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, margin: '4px 0 2px', color: '#10b981', lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
            {stats ? stats.compliant_scans : 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>●</span>
            <span style={{ fontWeight: 600 }}>{stats ? `${stats.compliance_rate}% statutory pass rate` : '0% pass rate'}</span>
          </div>
        </MagicCard>

        {/* Non-Compliant Scans */}
        <MagicCard
          gradientColor="rgba(244, 63, 94, 0.16)"
          className="kpi-card"
          style={{
            padding: '24px 26px',
            ['--kpi-accent' as any]: '#f43f5e',
            ['--kpi-glow' as any]: 'rgba(244, 63, 94, 0.3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#f43f5e', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.06em' }}>
              VIOLATIONS DETECTED
            </span>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertOctagon size={18} color="#f43f5e" />
            </div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, margin: '4px 0 2px', color: '#f43f5e', lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
            {stats ? stats.total_violations : 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>●</span>
            <span>{stats?.non_compliant_scans ? `Across ${stats.non_compliant_scans} non-compliant packages` : 'Zero violations recorded'}</span>
          </div>
        </MagicCard>

        {/* Penalties Estimated */}
        <MagicCard
          gradientColor="rgba(245, 158, 11, 0.16)"
          className="kpi-card"
          style={{
            padding: '24px 26px',
            ['--kpi-accent' as any]: '#f59e0b',
            ['--kpi-glow' as any]: 'rgba(245, 158, 11, 0.3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#fbbf24', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.06em' }}>
              ESTIMATED PENALTIES
            </span>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IndianRupee size={18} color="#facc15" />
            </div>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, margin: '4px 0 2px', color: '#facc15', lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
            ₹{stats?.total_penalties_estimated ? stats.total_penalties_estimated.toLocaleString('en-IN') : '0'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--muted-fg)' }}>
            Statutory fines under FSS Act, 2006
          </div>
        </MagicCard>
      </div>

      {/* Quick Inspection Action Card */}
      <div className="glass-panel" style={{
        padding: '28px 36px',
        marginBottom: '32px',
        borderRadius: 'var(--radius-squircle)',
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-compliant" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
              ✓ 14 Statutory Rules Active
            </span>
            <span style={{ fontSize: '0.74rem', color: '#93c5fd' }}>
              FSS (Labelling and Display) Regulations, 2020
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: '4px 0 8px', letterSpacing: '-0.02em' }}>
            Statutory Food Packaging Compliance Scanner
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Upload commodity packaging images (either 1 single label photo or multiple panel views: Front, Back, Side). The OCR engine extracts text and validates <strong>all 14 statutory declarations</strong> in a comprehensive tabular report.
          </p>
        </div>

        <button
          onClick={onNavigateScan}
          className="btn btn-primary"
          style={{ padding: '12px 28px', fontSize: '0.92rem', fontWeight: 700, gap: '10px' }}
        >
          <ScanLine size={18} />
          <span>Upload &amp; Inspect Package</span>
        </button>
      </div>

      {/* Recent Inspections Table */}
      <div className="glass-panel" style={{ padding: '28px 32px', borderRadius: 'var(--radius-squircle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--fg)', letterSpacing: '-0.02em', margin: 0 }}>
              Recent Commodity Inspections
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted-fg)', marginTop: '3px', margin: '3px 0 0' }}>
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
