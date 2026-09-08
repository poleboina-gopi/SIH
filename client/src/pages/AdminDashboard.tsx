import React, { useEffect, useState } from 'react';
import { 
  BarChart3, Settings, Shield, AlertTriangle, CheckCircle2, 
  Layers, Users, Sliders, Save, RefreshCw, IndianRupee 
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, StatutoryRule, User } from '../types';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rules, setRules] = useState<StatutoryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRuleId, setUpdatingRuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'rules'>('analytics');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [statsData, rulesData] = await Promise.all([
        api.getStats(),
        api.getRules()
      ]);
      setStats(statsData);
      setRules(rulesData.rules);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
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
            onClick={() => setActiveTab('rules')}
            className={`tab-trigger ${activeTab === 'rules' ? 'active' : ''}`}
          >
            Statutory Rules Configurator
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
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
        </div>
      ) : (
        /* Statutory Rules Configurator Tab */
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
    </div>
  );
};
