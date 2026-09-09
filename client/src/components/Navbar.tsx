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
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-card)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)'
    }}>
      {/* Top Directorate Ribbon */}
      <div style={{
        background: 'linear-gradient(90deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)',
        padding: '4px 20px',
        fontSize: '0.75rem',
        color: '#e0e7ff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={14} color="#facc15" />
          <span>MINISTRY OF CONSUMER AFFAIRS, FOOD &amp; PUBLIC DISTRIBUTION • GOVT. OF INDIA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ opacity: 0.9 }}>Statutory Portal: Legal Metrology (Packaged Commodities) Rules, 2011</span>
          <span style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '1px 6px',
            borderRadius: '4px',
            fontSize: '0.7rem'
          }}>Sec. 36 Enforced</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Logo & Title */}
        <div 
          onClick={() => onSelectTab(user?.role === 'admin' ? 'admin' : 'inspector')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
          }}>
            <Shield size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.15rem',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>LEGAL METROLOGY</span>
              <span style={{
                fontSize: '0.7rem',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(59, 130, 246, 0.4)'
              }}>COMPLIANCE AI</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Packaged Commodities Automated Enforcement System
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Strict RBAC Enforced) */}
        <nav style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {user?.role === 'inspector' && (
            <>
              <button
                onClick={() => onSelectTab('inspector')}
                className={`btn ${currentTab === 'inspector' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '7px 14px' }}
              >
                <Shield size={16} />
                Inspector Hub
              </button>

              <button
                onClick={() => onSelectTab('scan')}
                className={`btn ${currentTab === 'scan' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '7px 14px' }}
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
                fontSize: '0.8rem',
                padding: '7px 14px',
                border: '1px solid #ca8a04'
              }}
            >
              <BarChart3 size={16} color="#facc15" />
              Central Analytics &amp; Admin
            </button>
          )}

          <button
            onClick={() => onSelectTab('repository')}
            className={`btn ${currentTab === 'repository' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
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
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-card)',
            borderRadius: '8px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: user?.role === 'admin' ? '#ca8a04' : '#2563eb',
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
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  color: user?.role === 'admin' ? '#facc15' : '#60a5fa',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  {user?.role === 'admin' ? 'Joint Controller' : 'Inspector'}
                </span>
                {user?.phone && (
                  <span>• {user.phone}</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log out of session"
            className="btn btn-secondary"
            style={{
              padding: '8px 12px',
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
