import React, { useRef, useState, useCallback } from 'react';

interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradientSize?: number;
  gradientColor?: string;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const MagicCard: React.FC<MagicCardProps> = ({
  gradientSize = 280,
  gradientColor = 'rgba(139, 92, 246, 0.14)',
  className = '',
  children,
  style = {},
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePosition(null);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`glass-panel ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-squircle)',
        ...style
      }}
      {...props}
    >
      {/* Interactive Mouse-Tracking Gradient Aura */}
      {mousePosition && (
        <div
          aria-hidden="true"
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: `${mousePosition.x - gradientSize / 2}px`,
            top: `${mousePosition.y - gradientSize / 2}px`,
            width: `${gradientSize}px`,
            height: `${gradientSize}px`,
            background: `radial-gradient(circle, ${gradientColor} 0%, rgba(139, 92, 246, 0.03) 50%, transparent 80%)`,
            borderRadius: '50%',
            transition: 'opacity 0.2s ease',
            opacity: 1,
            zIndex: 1
          }}
        />
      )}

      {/* Content Container */}
      <div style={{ position: 'relative', zIndex: 2, height: '100%' }}>
        {children}
      </div>
    </div>
  );
};

export default MagicCard;
