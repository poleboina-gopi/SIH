import React, { useEffect, useState } from 'react';
import { 
  BarChart3, Settings, Shield, AlertTriangle, CheckCircle2, 
  Layers, Users, Sliders, Save, RefreshCw, IndianRupee, Trash2 
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, StatutoryRule, User } from '../types';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rules, setRules] = useState<StatutoryRule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRuleId, setUpdatingRuleId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [userSuccessMessage, setUserSuccessMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'rules'>('analytics');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [statsData, rulesData, usersData] = await Promise.all([
        api.getStats(),
        api.getRules(),
        api.getAdminUsers()
      ]);
      setStats(statsData);
      setRules(rulesData.rules);
      setUsers(usersData.users);
    } catch (err) {
      console.error("Failed to load admin data:", err);
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
      setActionSuccessMessage(res.message || 'Inspection deleted successfully.');
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await loadAdminData();
    } catch (err: any) {
      alert("Failed to delete inspection: " + (err.message || 'Error deleting inspection'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      const res = await api.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      setUserSuccessMessage(`Updated ${res.user.name}'s role to ${newRole.toUpperCase()}`);
      setTimeout(() => setUserSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const toggleRuleActive = async (rule: StatutoryRule) => {
    setUpdatingRuleId(rule.id);
    try {
      const newStatus = !rule.isActive;
      await api.updateRule(rule.id, { isActive: newStatus });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: newStatus } : r));
    } catch (err) {
      console.error("Error updating rule:", err);
      alert("Failed to update rule setting.");
    } finally {
      setUpdatingRuleId(null);
    }
  };

  const changeRuleSeverity = async (rule: StatutoryRule, newSeverity: 'CRITICAL' | 'MAJOR' | 'MINOR') => {
    setUpdatingRuleId(rule.id);
    try {
      await api.updateRule(rule.id, { severity: newSeverity });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, severity: newSeverity } : r));
    } catch (err) {
      console.error("Error updating severity:", err);
    } finally {
      setUpdatingRuleId(null);
    }
  };

  return (
    <div>
      {/* Top Admin Header */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(202, 138, 4, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(234, 179, 8, 0.35)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              background: 'rgba(234, 179, 8, 0.2)',
              color: '#facc15',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              border: '1px solid rgba(234, 179, 8, 0.4)'
            }}>
              JOINT CONTROLLER / DIRECTORATE HEADQUARTERS
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Central Enforcement Intelligence &amp; Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            System-wide compliance monitoring, department metrics, and statutory rule configuration.
          </p>
        </div>

        {/* Tab switcher inside header */}
        <div className="tab-list">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`tab-trigger ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            Analytics &amp; Trends
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`tab-trigger ${activeTab === 'users' ? 'active' : ''}`}
          >
            Officer Directory &amp; Roles
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`tab-trigger ${activeTab === 'rules' ? 'active' : ''}`}
          >
            Statutory Rules Configurator
          </button>
        </div>
      </div>

      {activeTab === 'analytics' && (
        <div>
          {/* Top Admin KPI Counters */}
          <div className="grid-4" style={{ marginBottom: '28px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>TOTAL COMMODITY SCANS</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 4px', color: '#ffffff' }}>
                {stats?.total_scans || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across all circles</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>NON-COMPLIANCE RATE</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 4px', color: '#f43f5e' }}>
                {stats && stats.total_scans > 0 ? Math.round((stats.non_compliant_scans / stats.total_scans) * 100) : 0}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#f87171' }}>Requires enforcement intervention</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>COMPOUNDING REVENUE</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 4px', color: '#facc15' }}>
                ₹{stats?.total_penalties_estimated ? stats.total_penalties_estimated.toLocaleString('en-IN') : 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Penalties under Section 36</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>ACTIVE ENFORCEMENT RULES</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 4px', color: '#60a5fa' }}>
                {rules.filter(r => r.isActive).length} / {rules.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rules 2011 Engine v2.4</div>
            </div>
          </div>

          {/* Rule Breakdown & Category Distribution */}
          <div className="grid-2" style={{ gap: '24px', marginBottom: '28px' }}>
            {/* Rule Violations Frequency */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                Violation Frequency by Statutory Rule
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Most frequently breached provisions in inspected commodities
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {stats?.violations_by_rule && Object.keys(stats.violations_by_rule).length > 0 ? (
                  Object.entries(stats.violations_by_rule).map(([ruleCode, count]) => {
                    const pct = Math.min(100, Math.round((count / (stats.total_violations || 1)) * 100));
                    return (
                      <div key={ruleCode}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: '#ffffff' }}>{ruleCode}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{count} violation(s) ({pct}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: pct > 40 ? '#ef4444' : pct > 20 ? '#f59e0b' : '#3b82f6',
                            borderRadius: '4px'
                          }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No violation data logged yet.</div>
                )}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                Category-wise Inspection Coverage
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Distribution of inspected packaged commodities by market segment
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats?.category_distribution && Object.keys(stats.category_distribution).length > 0 ? (
                  Object.entries(stats.category_distribution).map(([cat, count]) => (
                    <div
                      key={cat}
                      style={{
                        background: 'var(--bg-glass-heavy)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{cat}</span>
                      <span className="badge badge-neutral">{count} Inspections</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No categories registered yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Central Scan History Register */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Recent Statutory Package Inspections
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Audit log of commodities inspected across all departmental circles
                </p>
              </div>
              <span className="badge badge-neutral">
                {stats?.recent_inspections?.length || 0} Sealed Logs
              </span>
            </div>

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>COMMODITY &amp; BRAND</th>
                    <th>CATEGORY</th>
                    <th>STATUTORY STATUS</th>
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
                          <span style={{
                            fontWeight: 700,
                            color: scan.compliance_score >= 80 ? '#34d399' : scan.compliance_score >= 50 ? '#fbbf24' : '#f87171'
                          }}>
                            {scan.compliance_score}%
                          </span>
                        </td>
                        <td>
                          {scan.violations_count > 0 ? (
                            <span style={{ color: '#f87171', fontWeight: 700 }}>{scan.violations_count} Detected</span>
                          ) : (
                            <span style={{ color: '#34d399' }}>None (Compliant)</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => setDeleteTarget({ id: scan.scan_id, name: `${scan.product_name} (${scan.brand})` })}
                            className="btn btn-danger"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              background: 'rgba(239, 68, 68, 0.15)',
                              borderColor: 'rgba(239, 68, 68, 0.4)',
                              color: '#ef4444',
                              gap: '6px'
                            }}
                            title="Delete Inspection"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No commodity inspection logs registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Officer Directory & Role Management Tab */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>
                Authorized Officer Directory &amp; RBAC Control
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Manage sworn inspectors and administrators. Sworn Inspectors hold statutory authority to upload and scan packages under the Legal Metrology Act.
              </p>
            </div>
            {userSuccessMessage && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600
              }}>
                ✓ {userSuccessMessage}
              </div>
            )}
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>OFFICER NAME &amp; DETAILS</th>
                  <th>OFFICIAL EMAIL</th>
                  <th>INDIAN MOBILE</th>
                  <th>BADGE &amp; CIRCLE</th>
                  <th>CURRENT ROLE</th>
                  <th>ROLE PERMISSION</th>
                </tr>
              </thead>
              <tbody>
                {users && users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {u.designation || 'Enforcement Officer'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {u.department}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: '#93c5fd' }}>
                        {u.email}
                      </td>
                      <td style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                        {u.phone || 'N/A'}
                      </td>
                      <td>
                        <span style={{
                          background: 'rgba(255,255,255,0.06)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          color: '#e2e8f0'
                        }}>
                          {u.badgeNumber || 'LM-REG-1001'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-compliant'}`}>
                          {u.role === 'admin' ? 'ADMINISTRATOR' : 'INSPECTOR'}
                        </span>
                      </td>
                      <td>
                        <select
                          value={u.role}
                          disabled={updatingUserId === u.id || u.id === user.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: 'var(--bg-glass-heavy)',
                            border: '1px solid var(--border-card)',
                            color: u.role === 'admin' ? '#facc15' : '#60a5fa',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: u.id === user.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <option value="inspector">INSPECTOR (Field Authority)</option>
                          <option value="admin">ADMINISTRATOR (Central Control)</option>
                        </select>
                        {u.id === user.id && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            (Current Active Session)
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No registered officers found in directory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statutory Rules Configurator Tab */}
      {activeTab === 'rules' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>
              Statutory Rules Engine Configuration
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Enable, disable, or adjust severity levels for automated Legal Metrology (Packaged Commodities) Rules, 2011 checks.
            </p>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>RULE CODE &amp; TITLE</th>
                  <th>CATEGORY</th>
                  <th>STATUTORY CITATION</th>
                  <th>SEVERITY</th>
                  <th>PENALTY STANDARD</th>
                  <th>STATUS / TOGGLE</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{rule.ruleCode}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {rule.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '380px' }}>
                        {rule.description}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {rule.category}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {rule.penaltySection}
                    </td>
                    <td>
                      <select
                        value={rule.severity}
                        onChange={(e) => changeRuleSeverity(rule, e.target.value as any)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: 'var(--bg-glass-heavy)',
                          border: '1px solid var(--border-card)',
                          color: rule.severity === 'CRITICAL' ? '#f87171' : rule.severity === 'MAJOR' ? '#fbbf24' : '#60a5fa',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}
                      >
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="MAJOR">MAJOR</option>
                        <option value="MINOR">MINOR</option>
                      </select>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#facc15' }}>
                      {rule.fineRange}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleRuleActive(rule)}
                        disabled={updatingRuleId === rule.id}
                        className={`btn ${rule.isActive ? 'btn-success' : 'btn-secondary'}`}
                        style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                      >
                        {rule.isActive ? 'Active (Enforced)' : 'Inactive'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Success Feedback Notification */}
      {actionSuccessMessage && (
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
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Inspection Record"
        message="Are you sure you want to delete this inspection?"
        itemName={deleteTarget?.name}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
