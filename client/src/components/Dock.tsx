import React, { useRef, useState, useEffect } from 'react';
import { 
  Shield, ScanLine, BarChart3, Database, ArrowUp, Sun, Moon 
} from 'lucide-react';
import { User } from '../types';

interface DockProps {
  user: User | null;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

interface DockItemConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}

export const Dock: React.FC<DockProps> = ({
  user,
  currentTab,
  onSelectTab,
  theme,
  onToggleTheme
}) => {
  const dockRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [showDock, setShowDock] = useState(true);

  // Monitor scroll: show after initial scroll or keep accessible
  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      // Keep dock visible unless at absolute bottom overlapping sticky footers
      setShowDock(true);
      lastY = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const items: DockItemConfig[] = [];

  if (user?.role === 'inspector') {
    items.push({
      id: 'inspector',
      label: 'Inspector Hub',
      icon: <Shield size={20} />,
      onClick: () => onSelectTab('inspector'),
      active: currentTab === 'inspector'
    });
    items.push({
      id: 'scan',
      label: 'New Inspection',
      icon: <ScanLine size={20} />,
      onClick: () => onSelectTab('scan'),
      active: currentTab === 'scan'
    });
  }

  if (user?.role === 'admin') {
    items.push({
      id: 'admin',
      label: 'Central Analytics',
      icon: <BarChart3 size={20} />,
      onClick: () => onSelectTab('admin'),
      active: currentTab === 'admin'
    });
  }

  items.push({
    id: 'repository',
    label: 'Audit Repository',
    icon: <Database size={20} />,
    onClick: () => onSelectTab('repository'),
    active: currentTab === 'repository'
  });

  items.push({
    id: 'theme',
    label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
    icon: theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />,
    onClick: onToggleTheme
  });

  items.push({
    id: 'top',
    label: 'Back to Top',
    icon: <ArrowUp size={20} />,
    onClick: scrollToTop
  });

  // macOS magnification calculation parameters
  const baseItemSize = 44;
  const magnification = 64;
  const distanceThreshold = 90;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dockRef.current) {
      const rect = dockRef.current.getBoundingClientRect();
      setMouseX(e.clientX - rect.left);
    }
  };

  const handleMouseLeave = () => {
    setMouseX(null);
  };

  if (!user) return null;

  return (
    <div
      className="dock-container"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: 0,
        right: 0,
        zIndex: 999,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease',
        transform: showDock ? 'translateY(0)' : 'translateY(120%)',
        opacity: showDock ? 1 : 0
      }}
    >
      <div
        ref={dockRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="glass-panel"
        style={{
          pointerEvents: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          height: '58px',
          borderRadius: '9999px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid var(--border)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45), 0 0 20px rgba(139, 92, 246, 0.15)',
          userSelect: 'none'
        }}
      >
        {items.map((item, index) => {
          // Calculate magnification based on distance from mouse
          let size = baseItemSize;
          if (mouseX !== null && dockRef.current) {
            // Estimate center of item
            const itemCenter = index * (baseItemSize + 8) + baseItemSize / 2 + 14;
            const distance = Math.abs(mouseX - itemCenter);
            if (distance < distanceThreshold) {
              const factor = Math.cos((distance / distanceThreshold) * (Math.PI / 2));
              size = baseItemSize + (magnification - baseItemSize) * factor;
            }
          }

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              title={item.label}
              className="dock-item"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: item.active
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: item.active
                  ? '1px solid rgba(255, 255, 255, 0.3)'
                  : '1px solid var(--border)',
                color: item.active ? '#ffffff' : 'var(--fg)',
                boxShadow: item.active
                  ? '0 0 16px rgba(139, 92, 246, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  : 'none',
                cursor: 'pointer',
                transition: 'width 0.15s ease-out, height 0.15s ease-out, transform 0.15s ease-out, background 0.2s ease',
                position: 'relative',
                flexShrink: 0,
                outline: 'none'
              }}
            >
              <div style={{ transform: `scale(${size / baseItemSize})`, transition: 'transform 0.15s ease-out' }}>
                {item.icon}
              </div>

              {/* Active Indicator Dot under icon */}
              {item.active && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: '#a78bfa',
                    boxShadow: '0 0 6px #8b5cf6'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Dock;
