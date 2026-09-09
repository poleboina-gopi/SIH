import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, AlertOctagon, AlertTriangle, ScanLine, 
  ArrowUpRight, Clock, FileCheck, IndianRupee, Layers, CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, User } from '../types';
import { SAMPLE_LABELS, SampleLabel } from '../data/sampleLabels';

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

  return (
    <div>
      {/* Top Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• Circle: Delhi Central</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Inspector Portal: {user.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            {user.designation} • Badge: {user.badgeNumber || 'LM-DEL-2024'}
          </p>
        </div>

        {/* Hide Start New Inspection button strictly for ADMIN users */}
        {user.role === 'inspector' && (
          <button
            onClick={onNavigateScan}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '0.95rem', gap: '10px' }}
          >
            <ScanLine size={18} />
            Start New Inspection
          </button>
        )}
      </div>

      {/* KPI Counters Grid */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        {/* Total Scans */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>TOTAL INSPECTIONS</span>
            <Layers size={18} color="#60a5fa" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 4px', color: '#ffffff' }}>
            {stats ? stats.total_scans : 2}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Packaged commodities analyzed
          </div>
        </div>

        {/* Compliant Scans */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>COMPLIANT LABELS</span>
            <ShieldCheck size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 4px', color: '#10b981' }}>
            {stats ? stats.compliant_scans : 1}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>
            {stats ? `${stats.compliance_rate}% compliance rate` : '50% compliance rate'}
          </div>
        </div>

        {/* Non-Compliant Scans */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>VIOLATIONS DETECTED</span>
            <AlertOctagon size={18} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 4px', color: '#f43f5e' }}>
            {stats ? stats.total_violations : 3}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#f87171' }}>
            Across {stats ? stats.non_compliant_scans : 1} non-compliant packages
          </div>
        </div>

        {/* Penalties Estimated */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>COMPOUNDING FINES</span>
            <IndianRupee size={18} color="#facc15" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 4px', color: '#facc15' }}>
            ₹{stats ? stats.total_penalties_estimated.toLocaleString('en-IN') : '75,000'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Statutory fines under Sec. 36
          </div>
        </div>
      </div>

      {/* 1-Click Benchmark Test Suite Launcher */}
      <div className="glass-panel" style={{ padding: '22px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚀 1-Click Benchmark Test Suite</span>
              <span style={{
                fontSize: '0.7rem',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}>
                Instant Demonstration
              </span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Test the OCR and statutory rule engine with pre-verified compliant and non-compliant packaged commodity samples:
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {SAMPLE_LABELS.map((sample) => {
            const isCompliant = sample.expectedStatus === 'COMPLIANT';
            const isNonCompliant = sample.expectedStatus === 'NON_COMPLIANT';

            return (
              <div
                key={sample.id}
                onClick={() => onSelectSample(sample)}
                style={{
                  background: 'var(--bg-glass-heavy)',
                  border: `1px solid ${isCompliant ? 'rgba(16, 185, 129, 0.4)' : isNonCompliant ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span className={`badge ${isCompliant ? 'badge-compliant' : isNonCompliant ? 'badge-noncompliant' : 'badge-warning'}`}>
                    {sample.expectedStatus}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sample.category}</span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff', marginBottom: '4px' }}>
                  {sample.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Brand: {sample.brand}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {sample.description}
                </div>

                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: isCompliant ? '#34d399' : isNonCompliant ? '#f87171' : '#fbbf24'
                }}>
                  <span>Inspect This Sample</span>
                  <ArrowUpRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Recent Commodity Inspections
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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
                      }`}>
                        {scan.compliance_status}
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
                        <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.85rem' }}>
                          {scan.violations_count} Detected
                        </span>
                      ) : (
                        <span style={{ color: '#34d399', fontSize: '0.85rem' }}>None (Passed)</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => onViewReport(scan.scan_id)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        <FileCheck size={14} />
                        View Legal Report
                      </button>
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
    </div>
  );
};
