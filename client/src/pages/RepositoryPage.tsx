import React, { useEffect, useState } from 'react';
import { 
  Database, Search, Filter, FileText, ArrowRight, 
  Calendar, ShieldCheck, AlertOctagon, AlertTriangle, Layers, Trash2 
} from 'lucide-react';
import { api } from '../services/api';
import { Report, User } from '../types';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { MagicCard } from '../components/MagicCard';

interface RepositoryPageProps {
  user?: User | null;
  onViewReport: (scanId: string) => void;
  onNewScan: () => void;
}

export const RepositoryPage: React.FC<RepositoryPageProps> = ({
  user,
  onViewReport,
  onNewScan
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLIANT' | 'NON_COMPLIANT' | 'BORDERLINE'>('ALL');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await api.getReports();
      setReports(data.reports);
    } catch (err) {
      console.error("Failed to load audit repository:", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteScan(deleteTarget.id);
      setDeleteTarget(null);
      await loadReports();
    } catch (err: any) {
      alert("Failed to delete inspection: " + (err.message || 'Error deleting inspection'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = (
      (r.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.report_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.inspector_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '4px', color: 'var(--fg)', letterSpacing: '-0.025em' }}>
            Statutory <span className="text-gradient-primary">Audit Repository</span>
          </h1>
          <p style={{ color: 'var(--muted-fg)', fontSize: '0.88rem' }}>
            Comprehensive register of packaging inspections, legal notices, and compliance records.
          </p>
        </div>

        {/* Hide New Inspection button strictly for ADMIN users */}
        {user?.role === 'inspector' && (
          <button
            onClick={onNewScan}
            className="btn btn-primary"
            style={{ gap: '8px', padding: '10px 22px' }}
          >
            <Layers size={16} />
            New Inspection
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel" style={{
        padding: '20px 26px',
        marginBottom: '28px',
        borderRadius: 'var(--radius-squircle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={16} color="var(--muted-fg)" style={{ position: 'absolute', left: '16px', top: '12px' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by commodity name, brand, inspector or report number..."
            style={{
              width: '100%',
              padding: '10px 18px 10px 42px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '9999px',
              color: 'var(--fg)',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ALL', 'COMPLIANT', 'NON_COMPLIANT', 'BORDERLINE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '0.76rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                border: '1px solid var(--border)',
                background: statusFilter === status ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'rgba(255, 255, 255, 0.04)',
                color: statusFilter === status ? '#ffffff' : 'var(--muted-fg)',
                boxShadow: statusFilter === status ? '0 0 14px rgba(139, 92, 246, 0.4)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Repository Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          Loading repository records...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 'var(--radius-squircle)' }}>
          <Database size={48} color="var(--muted-fg)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ marginBottom: '8px', color: 'var(--fg)' }}>No Inspection Records Found</h3>
          <p style={{ color: 'var(--muted-fg)', fontSize: '0.85rem' }}>
            No packaging inspections match your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid-3" style={{ gap: '22px' }}>
          {filteredReports.map((report) => {
            const isCompliant = report.status === 'COMPLIANT';
            const isNonCompliant = report.status === 'NON_COMPLIANT';

            return (
              <MagicCard
                key={report.id}
                gradientColor={isCompliant ? 'rgba(16, 185, 129, 0.15)' : isNonCompliant ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)'}
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-squircle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span className={`badge ${
                      isCompliant ? 'badge-compliant' : isNonCompliant ? 'badge-noncompliant' : 'badge-warning'
                    }`}>
                      {report.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--muted-fg)' }}>
                      {report.report_number}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--fg)', marginBottom: '4px', letterSpacing: '-0.015em' }}>
                    {report.product_name}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted-fg)', marginBottom: '14px' }}>
                    Brand: {report.brand}
                  </div>

                  {/* Score bar */}
                  <div style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-fg)' }}>Compliance Score</span>
                    <span style={{
                      fontWeight: 800,
                      color: isCompliant ? '#10b981' : isNonCompliant ? '#f43f5e' : '#f59e0b'
                    }}>
                      {report.score}%
                    </span>
                  </div>

                  {/* Violations notice count */}
                  {report.violations_count && report.violations_count > 0 ? (
                    <div style={{ fontSize: '0.78rem', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                      <AlertOctagon size={14} />
                      <span>{report.violations_count} violation(s) under Sec 36</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                      <ShieldCheck size={14} />
                      <span>Full Statutory Compliance</span>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted-fg)' }}>
                    {new Date(report.generated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {(user?.role === 'admin' || user?.role === 'inspector') && (
                      <button
                        onClick={() => setDeleteTarget({ id: report.scan_id || report.id, name: `${report.product_name} (${report.report_number})` })}
                        className="btn btn-danger"
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.78rem',
                          background: 'rgba(244, 63, 94, 0.15)',
                          borderColor: 'rgba(244, 63, 94, 0.4)',
                          color: '#f43f5e'
                        }}
                        title="Delete Inspection"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => onViewReport(report.scan_id || report.id)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px' }}
                    >
                      <span>View Certificate</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </MagicCard>
            );
          })}
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
