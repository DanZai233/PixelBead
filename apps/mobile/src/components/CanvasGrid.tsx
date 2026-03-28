import React, { memo, useRef } from 'react';
import { View } from 'react-native';
import { Canvas, Group, Rect, Skia } from '@shopify/react-native-skia';
import { GestureDetector } from 'react-native-gesture-handler';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { useCanvasStore } from '../stores/canvasStore';
import VirtualJoystick from './VirtualJoystick';

interface CanvasGridProps {
  width: number;
  height: number;
}

const CanvasGrid = memo<CanvasGridProps>(({ width, height }) => {
  const canvasRef = useRef(null);

  const { metrics, visibleCells, showGridLines } = useCanvasRenderer();
  const { cellSize, visibleRange } = metrics;

  // Get grid dimensions from canvasStore for gesture handling
  const gridSize = useCanvasStore((state) => state.gridSize);
  const zoom = useCanvasStore((state) => state.zoom);
  const panOffset = useCanvasStore((state) => state.panOffset);

  // Get composed gesture (tap, pinch, pan)
  const { composedGesture } = useCanvasInteraction(
    canvasRef,
    gridSize,
    zoom,
    panOffset
  );

  // Create grid lines paint
  const gridLinesPaint = React.useMemo(() => {
    const paint = Skia.Paint();
    paint.setColor(Skia.Color('rgba(200, 200, 200, 0.3)')); // Light gray, 30% opacity
    paint.setAntiAlias(true);
    paint.setStrokeWidth(1);
    return paint;
  }, []);

  // Render grid lines (optional, only if enabled)
  const gridLines = React.useMemo(() => {
    if (!showGridLines) return null;

    const lines: React.ReactNode[] = [];

    // Vertical grid lines
    for (let x = visibleRange.startX; x <= visibleRange.endX; x++) {
      const xPos = x * cellSize;
      lines.push(
        <Rect
          key={`v-line-${x}`}
          x={xPos}
          y={visibleRange.startY * cellSize}
          width={1}
          height={(visibleRange.endY - visibleRange.startY) * cellSize}
          paint={gridLinesPaint}
        />
      );
    }

    // Horizontal grid lines
    for (let y = visibleRange.startY; y <= visibleRange.endY; y++) {
      const yPos = y * cellSize;
      lines.push(
        <Rect
          key={`h-line-${y}`}
          x={visibleRange.startX * cellSize}
          y={yPos}
          width={(visibleRange.endX - visibleRange.startX) * cellSize}
          height={1}
          paint={gridLinesPaint}
        />
      );
    }

    return <Group>{lines}</Group>;
  }, [showGridLines, visibleRange, cellSize, gridLinesPaint]);

  // Render visible cells
  const cells = React.useMemo(() => {
    return visibleCells.map((cell) => {
      const paint = Skia.Paint();
      paint.setColor(Skia.Color(cell.color));
      paint.setAntiAlias(true);

      return (
        <Rect
          key={cell.key}
          x={cell.x * cellSize}
          y={cell.y * cellSize}
          width={cellSize}
          height={cellSize}
          paint={paint}
        />
      );
    });
  }, [visibleCells, cellSize]);

  return (
    <View style={{ width, height }}>
      <GestureDetector gesture={composedGesture}>
        <Canvas
          ref={canvasRef}
          style={{ width, height }}
        >
          <Group>
            {cells}
            {gridLines}
          </Group>
        </Canvas>
      </GestureDetector>

      {/* Virtual joysticks for alternative navigation */}
      <VirtualJoystick type="pan" position="left" />
      <VirtualJoystick type="zoom" position="right" />
    </View>
  );
});

CanvasGrid.displayName = 'CanvasGrid';

export default CanvasGrid;
