import React from 'react';
import { Shield, ScanLine, BarChart3, Database, Scale, LogOut, Phone } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentTab,
  onSelectTab,
  onLogout
}) => {
  return (
    <header style={{
      background: 'rgba(7, 12, 27, 0.85)',
      borderBottom: '1px solid var(--border-card)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)'
    }}>
      {/* Top Directorate Ribbon */}
      <div style={{
        background: 'rgba(5, 9, 20, 0.95)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
        padding: '5px 24px',
        fontSize: '0.72rem',
        color: '#cbd5e1',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.04em' }}>
          <Scale size={13} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))' }} />
          <span style={{ fontWeight: 600 }}>MINISTRY OF CONSUMER AFFAIRS, FOOD &amp; PUBLIC DISTRIBUTION • GOVT. OF INDIA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>Statutory Portal: Legal Metrology (Packaged Commodities) Rules, 2011</span>
          <span style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fbbf24',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontSize: '0.66rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.15)'
          }}>SEC. 36 ENFORCED</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Logo & Title */}
        <div 
          onClick={() => onSelectTab(user?.role === 'admin' ? 'admin' : 'inspector')}
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
        >
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(37, 99, 235, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Shield size={22} color="#ffffff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.2rem',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>LEGAL METROLOGY</span>
              <span style={{
                fontSize: '0.68rem',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.25)'
              }}>COMPLIANCE AI</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>
              Packaged Commodities Automated Enforcement System
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Strict RBAC Enforced) */}
        <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {user?.role === 'inspector' && (
            <>
              <button
                onClick={() => onSelectTab('inspector')}
                className={`btn ${currentTab === 'inspector' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.82rem', padding: '8px 16px', gap: '8px' }}
              >
                <Shield size={16} />
                Inspector Hub
              </button>

              <button
                onClick={() => onSelectTab('scan')}
                className={`btn ${currentTab === 'scan' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.82rem', padding: '8px 16px', gap: '8px' }}
              >
                <ScanLine size={16} />
                New Inspection
              </button>
            </>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`btn ${currentTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '0.82rem',
                padding: '8px 16px',
                border: currentTab === 'admin' ? '1px solid #facc15' : '1px solid rgba(202, 138, 4, 0.4)'
              }}
            >
              <BarChart3 size={16} color="#facc15" />
              Central Analytics &amp; Admin
            </button>
          )}

          <button
            onClick={() => onSelectTab('repository')}
            className={`btn ${currentTab === 'repository' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '8px 16px', gap: '8px' }}
          >
            <Database size={16} />
            Audit Repository
          </button>
        </nav>

        {/* Authenticated Officer Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* User Details Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 14px',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: user?.role === 'admin' 
                ? 'linear-gradient(135deg, #d97706 0%, #ca8a04 100%)' 
                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: user?.role === 'admin' ? '1px solid rgba(250, 204, 21, 0.4)' : '1px solid rgba(96, 165, 250, 0.4)',
              boxShadow: user?.role === 'admin' ? '0 0 10px rgba(250, 204, 21, 0.3)' : '0 0 10px rgba(37, 99, 235, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 800
            }}>
              {user?.firstName ? user.firstName.charAt(0) : user?.name ? user.name.charAt(0) : 'O'}
            </div>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                {user?.name || 'Officer'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  color: user?.role === 'admin' ? '#facc15' : '#38bdf8',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  ● {user?.role === 'admin' ? 'Joint Controller' : 'Inspector'}
                </span>
                {user?.phone && (
                  <span style={{ color: 'var(--text-muted)' }}>• {user.phone}</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log out of session"
            className="btn btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.78rem',
              gap: '6px'
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
