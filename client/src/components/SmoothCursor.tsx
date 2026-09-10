import React, { useEffect, useRef, useState } from 'react';

interface SmoothCursorProps {
  glowEffect?: boolean;
  showTrail?: boolean;
  trailLength?: number;
}

interface Point {
  x: number;
  y: number;
}

export const SmoothCursor: React.FC<SmoothCursorProps> = ({
  glowEffect = true,
  showTrail = true,
  trailLength = 4
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const targetPos = useRef<Point>({ x: -100, y: -100 });
  const currentPos = useRef<Point>({ x: -100, y: -100 });
  const trail = useRef<Point[]>([]);
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const trailContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect touch-only screen
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('.btn') ||
          target.getAttribute('role') === 'button' ||
          window.getComputedStyle(target).cursor === 'pointer')
      ) {
        setIsPointer(true);
      } else {
        setIsPointer(false);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    let animationFrameId: number;

    const render = () => {
      // Linear interpolation for smooth inertia physics
      const ease = 0.18;
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * ease;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * ease;

      // Update trail
      if (showTrail) {
        trail.current.unshift({ x: currentPos.current.x, y: currentPos.current.y });
        if (trail.current.length > trailLength) {
          trail.current.pop();
        }
      }

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetPos.current.x}px, ${targetPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible, showTrail, trailLength]);

  if (isTouchDevice || !isVisible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        overflow: 'hidden'
      }}
    >
      {/* Outer Inertia Ring */}
      <div
        ref={cursorRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: isPointer ? '46px' : isClicking ? '26px' : '34px',
          height: isPointer ? '46px' : isClicking ? '26px' : '34px',
          borderRadius: '50%',
          border: '1.5px solid rgba(139, 92, 246, 0.65)',
          background: isPointer
            ? 'rgba(139, 92, 246, 0.12)'
            : 'rgba(139, 92, 246, 0.04)',
          boxShadow: glowEffect
            ? '0 0 16px rgba(139, 92, 246, 0.4), inset 0 0 8px rgba(139, 92, 246, 0.2)'
            : 'none',
          transition: 'width 0.2s ease, height 0.2s ease, border-color 0.2s ease, background 0.2s ease',
          willChange: 'transform'
        }}
      />

      {/* Central Sharp Dot */}
      <div
        ref={dotRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: '#a78bfa',
          boxShadow: '0 0 8px #8b5cf6',
          willChange: 'transform'
        }}
      />
    </div>
  );
};

export default SmoothCursor;
