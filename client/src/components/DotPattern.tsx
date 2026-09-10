import React from 'react';

interface DotPatternProps {
  glow?: boolean;
  className?: string;
}

export const DotPattern: React.FC<DotPatternProps> = ({ glow = true, className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Dynamic Animated Dot Grid with Radial Vignette Mask */}
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(0,0,0,0.85) 0%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(0,0,0,0.85) 0%, transparent 85%)'
        }}
      >
        <defs>
          <pattern
            id="dot-pattern-grid"
            x="0"
            y="0"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="2"
              cy="2"
              r="1.2"
              fill="currentColor"
              className="dot-element"
              style={{
                color: 'var(--primary)',
                opacity: 0.28,
                transition: 'opacity 0.3s ease'
              }}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-pattern-grid)" />
      </svg>

      {/* Ambient Radial Vignette Glows */}
      {glow && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.12) 0%, transparent 45%),
              radial-gradient(circle at 15% 85%, rgba(14, 165, 233, 0.08) 0%, transparent 40%)
            `,
            pointerEvents: 'none',
            mixBlendMode: 'screen'
          }}
        />
      )}
    </div>
  );
};

export default DotPattern;
