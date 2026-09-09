import React, { useState } from 'react';

interface BoundingBox {
  field: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'valid' | 'invalid' | 'warning';
}

interface BoundingBoxOverlayProps {
  imageUrl: string;
  boxes?: BoundingBox[];
  selectedField?: string | null;
  onSelectBox?: (field: string) => void;
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  imageUrl,
  boxes = [],
  selectedField,
  onSelectBox
}) => {
  const [hoveredBox, setHoveredBox] = useState<string | null>(null);
  const [viewBoxDims, setViewBoxDims] = useState<{ w: number; h: number }>({ w: 600, h: 420 });

  const getStatusColors = (status: 'valid' | 'invalid' | 'warning', isSelected: boolean) => {
    switch (status) {
      case 'invalid':
        return {
          stroke: '#ef4444',
          fill: isSelected ? 'rgba(239, 68, 68, 0.28)' : 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.9)'
        };
      case 'warning':
        return {
          stroke: '#f59e0b',
          fill: isSelected ? 'rgba(245, 158, 11, 0.28)' : 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.9)'
        };
      case 'valid':
      default:
        return {
          stroke: '#10b981',
          fill: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.8)'
        };
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      // If boxes are scaled to 600x420, we can keep 600x420 or match aspect ratio
      setViewBoxDims({ w: 600, h: 420 });
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Underlying Image */}
      <img
        src={imageUrl}
        alt="Packaging Label for Inspection"
        onLoad={handleImageLoad}
        style={{
          width: '100%',
          maxHeight: '440px',
          objectFit: 'contain',
          display: 'block',
          borderRadius: '12px',
          border: '1px solid var(--border-card)',
          background: '#090d16'
        }}
      />

      {/* SVG Overlay Coordinate Layer */}
      {boxes.length > 0 && (
        <svg
          viewBox={`0 0 ${viewBoxDims.w} ${viewBoxDims.h}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          {boxes.map((box, idx) => {
            const isSelected = selectedField === box.field || hoveredBox === box.field;
            const colors = getStatusColors(box.status, isSelected);

            return (
              <g
                key={idx}
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredBox(box.field)}
                onMouseLeave={() => setHoveredBox(null)}
                onClick={() => onSelectBox && onSelectBox(box.field)}
              >
                {/* Bounding box rectangle */}
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.width}
                  height={box.height}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isSelected ? 3 : 1.5}
                  strokeDasharray={box.status === 'invalid' ? '5 3' : undefined}
                  rx={4}
                />

                {/* Tag header */}
                <rect
                  x={box.x}
                  y={Math.max(2, box.y - 18)}
                  width={Math.min(box.width, 240)}
                  height={16}
                  fill={colors.stroke}
                  rx={3}
                />
                <text
                  x={box.x + 6}
                  y={Math.max(2, box.y - 18) + 12}
                  fill="#ffffff"
                  fontSize="9"
                  fontFamily="'Segoe UI', Roboto, sans-serif"
                  fontWeight="bold"
                >
                  {box.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};
