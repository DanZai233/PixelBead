import React, { useRef, useState, useCallback, TouchEvent, MouseEvent } from 'react';

interface VirtualJoystickProps {
  type: 'move' | 'zoom';
  onMove?: (x: number, y: number) => void;
  onZoom?: (delta: number) => void;
  size?: number;
  knobSize?: number;
  className?: string;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  type,
  onMove,
  onZoom,
  size = 80,
  knobSize = 40,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const maxDistance = useRef(0);
  const activePointerId = useRef<number | null>(null);

  maxDistance.current = size / 2 - knobSize / 2;

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !knobRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;

    if (type === 'move') {
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > maxDistance.current) {
        const ratio = maxDistance.current / distance;
        deltaX *= ratio;
        deltaY *= ratio;
      }

      setPosition({ x: deltaX, y: deltaY });
      
      const normalizedX = deltaX / maxDistance.current;
      const normalizedY = deltaY / maxDistance.current;
      onMove?.(normalizedX, normalizedY);
    } else if (type === 'zoom') {
      const delta = deltaY;
      const clampedDelta = Math.max(-maxDistance.current, Math.min(maxDistance.current, delta));
      setPosition({ x: 0, y: clampedDelta });
      
      const normalizedDelta = clampedDelta / maxDistance.current;
      onZoom?.(-normalizedDelta);
    }
  }, [type, onMove, onZoom]);

  const handleStart = useCallback((e: TouchEvent | MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if ('touches' in e) {
      activePointerId.current = e.touches[0].identifier;
      containerRef.current?.setPointerCapture(e.touches[0].identifier);
    } else {
      activePointerId.current = 0;
      containerRef.current?.setPointerCapture(0);
    }

    setIsActive(true);
    updatePosition(clientX, clientY);
  }, [updatePosition]);

  const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isActive) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    updatePosition(clientX, clientY);
  }, [isActive, updatePosition]);

  const handleEnd = useCallback((e: TouchEvent | MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsActive(false);
    setPosition({ x: 0, y: 0 });
    
    if (activePointerId.current !== null) {
      containerRef.current?.releasePointerCapture(activePointerId.current);
    }
    activePointerId.current = null;

    onMove?.(0, 0);
    onZoom?.(0);
  }, [onMove, onZoom]);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-full bg-slate-800/90 backdrop-blur-sm shadow-lg border-2 border-slate-600 ${className}`}
      style={{ width: size, height: size }}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      {type === 'move' && (
        <>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
            </svg>
          </div>
          <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2 pointer-events-none">
            <span className="text-[9px] text-slate-500 font-bold">上</span>
            <span className="text-[9px] text-slate-500 font-bold">下</span>
            <span className="text-[9px] text-slate-500 font-bold">左</span>
            <span className="text-[9px] text-slate-500 font-bold">右</span>
          </div>
        </>
      )}

      {type === 'zoom' && (
        <div className="absolute inset-0 flex flex-col justify-between py-3 pointer-events-none">
          <div className="flex justify-center">
            <svg width={size * 0.35} height={size * 0.35} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
            </svg>
          </div>
          <div className="flex justify-center">
            <svg width={size * 0.35} height={size * 0.35} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </div>
        </div>
      )}

      <div
        ref={knobRef}
        className={`absolute rounded-full bg-indigo-600 shadow-lg transition-all ${isActive ? 'scale-110 bg-indigo-500' : ''}`}
        style={{
          width: knobSize,
          height: knobSize,
          left: `calc(50% - ${knobSize / 2}px + ${position.x}px)`,
          top: `calc(50% - ${knobSize / 2}px + ${position.y}px)`,
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
      </div>
    </div>
  );
};
