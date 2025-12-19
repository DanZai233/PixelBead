
import React from 'react';

interface BeadProps {
  color: string;
  onPointerDown: () => void;
  onPointerEnter: () => void;
  showGrid: boolean;
}

// 使用 memo 避免在超大网格中不必要的重绘
export const Bead: React.FC<BeadProps> = React.memo(({ color, onPointerDown, onPointerEnter, showGrid }) => {
  const isTransparent = color === 'transparent' || color === '#FFFFFF' || color === '';
  
  return (
    <div
      onPointerDown={(e) => {
        // 关键：防止指针捕获干扰滑动涂色
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        onPointerDown();
      }}
      onPointerEnter={onPointerEnter}
      onDragStart={(e) => e.preventDefault()}
      className={`
        relative w-full h-full rounded-full cursor-crosshair transition-transform duration-75 hover:scale-125 active:scale-90
        ${isTransparent ? 'bg-slate-200/40' : 'bead-shadow border border-black/10'}
        ${showGrid && isTransparent ? 'border border-slate-300/30' : ''}
      `}
      style={{ backgroundColor: isTransparent ? undefined : color }}
    >
      {!isTransparent && (
        <div className="absolute inset-0 m-auto w-1/3 h-1/3 rounded-full bg-black/20 blur-[0.5px]"></div>
      )}
    </div>
  );
});
