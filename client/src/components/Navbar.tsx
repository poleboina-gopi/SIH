import React, { useState, useEffect } from 'react';
import { 
  Shield, ScanLine, BarChart3, Database, Scale, LogOut, Sun, Moon 
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentTab,
  onSelectTab,
  onLogout,
  theme = 'dark',
  onToggleTheme
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide on scroll down, reveal on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 70) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Floating Glass Header Container */}
      <header
        style={{
          position: 'fixed',
          top: '12px',
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 16px',
          pointerEvents: 'none',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          transform: isVisible ? 'translateY(0)' : 'translateY(-120%)',
          opacity: isVisible ? 1 : 0
        }}
      >
        <div
          className="glass-panel"
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: '1360px',
            borderRadius: 'var(--radius-squircle)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(26px)',
            WebkitBackdropFilter: 'blur(26px)',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 40px -8px rgba(0, 0, 0, 0.45), 0 0 24px rgba(139, 92, 246, 0.1)',
            overflow: 'hidden'
          }}
        >
          {/* Top Directorate Ribbon */}
          <div
            style={{
              background: 'rgba(15, 16, 20, 0.85)',
              borderBottom: '1px solid var(--border)',
              padding: '4px 20px',
              fontSize: '0.7rem',
              color: 'var(--muted-fg)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.04em' }}>
              <Scale size={12} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))', flexShrink: 0 }} />
              <span className="desktop-only" style={{ fontWeight: 600 }}>
                MINISTRY OF CONSUMER AFFAIRS, FOOD &amp; PUBLIC DISTRIBUTION • GOVT. OF INDIA
              </span>
              <span className="mobile-only" style={{ fontWeight: 600, fontSize: '0.66rem' }}>
                GOVT. OF INDIA • LEGAL METROLOGY
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="desktop-only" style={{ opacity: 0.85, fontSize: '0.68rem' }}>
                Statutory Portal: Rules, 2011
              </span>
              <span
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(56, 189, 248, 0.1) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  color: '#a78bfa',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.15)',
                  whiteSpace: 'nowrap'
                }}
              >
                SEC. 36 ENFORCED
              </span>
            </div>
          </div>

          {/* Main Navigation Row */}
          <div
            style={{
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            {/* Brand / Logo */}
            <div
              onClick={() => onSelectTab(user?.role === 'admin' ? 'admin' : 'inspector')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  flexShrink: 0
                }}
              >
                <Shield size={20} color="#ffffff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    letterSpacing: '-0.025em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span className="text-gradient-primary">
                    LEGAL METROLOGY
                  </span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: '#a78bfa',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(139, 92, 246, 0.35)',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    COMPLIANCE AI
                  </span>
                </div>
                <div
                  className="desktop-only"
                  style={{ fontSize: '0.72rem', color: 'var(--muted-fg)', letterSpacing: '0.01em' }}
                >
                  Packaged Commodities Automated Enforcement System
                </div>
              </div>
            </div>

            {/* Desktop Navigation Tabs with Animated Glow Indicator */}
            <nav className="desktop-nav" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {user?.role === 'inspector' && (
                <>
                  <button
                    onClick={() => onSelectTab('inspector')}
                    className={`btn ${currentTab === 'inspector' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      fontSize: '0.82rem',
                      padding: '8px 18px',
                      position: 'relative'
                    }}
                  >
                    <Shield size={15} />
                    <span>Inspector Hub</span>
                    {currentTab === 'inspector' && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-1px',
                          left: '25%',
                          right: '25%',
                          height: '2.5px',
                          background: '#ffffff',
                          borderRadius: '9999px',
                          boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)'
                        }}
                      />
                    )}
                  </button>

                  <button
                    onClick={() => onSelectTab('scan')}
                    className={`btn ${currentTab === 'scan' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      fontSize: '0.82rem',
                      padding: '8px 18px',
                      position: 'relative'
                    }}
                  >
                    <ScanLine size={15} />
                    <span>New Inspection</span>
                    {currentTab === 'scan' && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-1px',
                          left: '25%',
                          right: '25%',
                          height: '2.5px',
                          background: '#ffffff',
                          borderRadius: '9999px',
                          boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)'
                        }}
                      />
                    )}
                  </button>
                </>
              )}

              {user?.role === 'admin' && (
                <button
                  onClick={() => onSelectTab('admin')}
                  className={`btn ${currentTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    fontSize: '0.82rem',
                    padding: '8px 18px',
                    position: 'relative'
                  }}
                >
                  <BarChart3 size={15} color={currentTab === 'admin' ? '#ffffff' : '#facc15'} />
                  <span>Central Analytics &amp; Admin</span>
                  {currentTab === 'admin' && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-1px',
                        left: '25%',
                        right: '25%',
                        height: '2.5px',
                        background: '#ffffff',
                        borderRadius: '9999px',
                        boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)'
                      }}
                    />
                  )}
                </button>
              )}

              <button
                onClick={() => onSelectTab('repository')}
                className={`btn ${currentTab === 'repository' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.82rem',
                  padding: '8px 18px',
                  position: 'relative'
                }}
              >
                <Database size={15} />
                <span>Audit Repository</span>
                {currentTab === 'repository' && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-1px',
                      left: '25%',
                      right: '25%',
                      height: '2.5px',
                      background: '#ffffff',
                      borderRadius: '9999px',
                      boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)'
                    }}
                  />
                )}
              </button>
            </nav>

            {/* Authenticated Officer Profile & Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Dark / Light Mode Toggle Button */}
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="btn btn-secondary"
                  style={{
                    width: '38px',
                    height: '38px',
                    padding: 0,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              )}

              {/* User Details Pill */}
              <div
                className="desktop-only"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '5px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: '9999px'
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: user?.role === 'admin'
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 800
                  }}
                >
                  {user?.firstName ? user.firstName.charAt(0) : user?.name ? user.name.charAt(0) : 'O'}
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--fg)' }}>
                    {user?.name || 'Officer'}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--muted-fg)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        color: user?.role === 'admin' ? '#f59e0b' : '#a78bfa',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      ● {user?.role === 'admin' ? 'Joint Controller' : 'Inspector'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={onLogout}
                title="Sign Out"
                className="btn btn-secondary"
                style={{
                  padding: '7px 14px',
                  fontSize: '0.78rem',
                  gap: '6px'
                }}
              >
                <LogOut size={14} />
                <span className="desktop-only">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Floating App Bar */}
      <nav className="mobile-bottom-nav">
        {user?.role === 'inspector' && (
          <>
            <button
              type="button"
              onClick={() => onSelectTab('inspector')}
              className={`mobile-nav-item ${currentTab === 'inspector' ? 'active' : ''}`}
            >
              <Shield size={19} />
              <span>Hub</span>
              {currentTab === 'inspector' && <div className="mobile-nav-indicator" />}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('scan')}
              className={`mobile-nav-item ${currentTab === 'scan' ? 'active' : ''}`}
            >
              <ScanLine size={19} />
              <span>Inspect</span>
              {currentTab === 'scan' && <div className="mobile-nav-indicator" />}
            </button>
          </>
        )}

        {user?.role === 'admin' && (
          <button
            type="button"
            onClick={() => onSelectTab('admin')}
            className={`mobile-nav-item ${currentTab === 'admin' ? 'active' : ''}`}
          >
            <BarChart3 size={19} />
            <span>Analytics</span>
            {currentTab === 'admin' && <div className="mobile-nav-indicator" />}
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelectTab('repository')}
          className={`mobile-nav-item ${currentTab === 'repository' ? 'active' : ''}`}
        >
          <Database size={19} />
          <span>Repository</span>
          {currentTab === 'repository' && <div className="mobile-nav-indicator" />}
        </button>
      </nav>
    </>
  );
};

export default Navbar;
