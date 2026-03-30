import React, { memo, useCallback, useRef } from 'react';
import { View, StyleSheet, PanResponder, GestureResponderEvent } from 'react-native';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';
import { useCanvasStore } from '../stores/canvasStore';
import { getCellSize } from '../utils/canvasViewport';

interface CanvasGridProps {
  width: number;
  height: number;
}

const CanvasGrid = memo<CanvasGridProps>(({ width, height }) => {
  const { metrics, visibleCells, showGridLines } = useCanvasRenderer();
  const { cellSize, visibleRange } = metrics;

  const gridSize = useCanvasStore((state) => state.gridSize);
  const zoom = useCanvasStore((state) => state.zoom);
  const panOffset = useCanvasStore((state) => state.panOffset);
  const pixelStyle = useCanvasStore((state) => state.pixelStyle);
  const selectedColor = useCanvasStore((state) => state.selectedColor);
  const currentTool = useCanvasStore((state) => state.currentTool);
  const setPixel = useCanvasStore((state) => state.setPixel);
  const setSelectedColor = useCanvasStore((state) => state.setSelectedColor);
  const setSelectedTool = useCanvasStore((state) => state.setSelectedTool);
  const grid = useCanvasStore((state) => state.grid);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const setPanOffset = useCanvasStore((state) => state.setPanOffset);

  const lastTouchDistance = useRef(0);
  const lastPanOffset = useRef({ x: 0, y: 0 });
  const touchCount = useRef(0);

  const handleTap = useCallback((x: number, y: number) => {
    const cs = getCellSize(gridSize.width, gridSize.height, zoom);
    const gridX = Math.floor((x - panOffset.x) / cs);
    const gridY = Math.floor((y - panOffset.y) / cs);

    if (gridX < 0 || gridX >= gridSize.width || gridY < 0 || gridY >= gridSize.height) return;

    switch (currentTool) {
      case 'brush':
        setPixel(gridX, gridY, selectedColor);
        break;
      case 'eraser':
        setPixel(gridX, gridY, '');
        break;
      case 'picker': {
        const existing = grid.get(`${gridX},${gridY}`);
        if (existing) {
          setSelectedColor(existing);
          setSelectedTool('brush');
        }
        break;
      }
      case 'fill':
        setPixel(gridX, gridY, selectedColor);
        break;
    }
  }, [gridSize, zoom, panOffset, currentTool, selectedColor, setPixel, setSelectedColor, setSelectedTool, grid]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        touchCount.current = evt.nativeEvent.touches?.length || 1;
        if (touchCount.current >= 2) {
          lastPanOffset.current = { ...panOffset };
          const touches = evt.nativeEvent.touches;
          if (touches && touches.length >= 2) {
            const dx = touches[1].pageX - touches[0].pageX;
            const dy = touches[1].pageY - touches[0].pageY;
            lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
          }
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        const numTouches = touches?.length || 1;
        touchCount.current = numTouches;

        if (numTouches >= 2 && touches && touches.length >= 2) {
          // Two-finger: pan + zoom
          const dx = touches[1].pageX - touches[0].pageX;
          const dy = touches[1].pageY - touches[0].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (lastTouchDistance.current > 0) {
            const scale = dist / lastTouchDistance.current;
            setZoom(zoom * scale);
          }
          lastTouchDistance.current = dist;

          setPanOffset(
            lastPanOffset.current.x + gestureState.dx,
            lastPanOffset.current.y + gestureState.dy
          );
        } else if (numTouches === 1) {
          // Single finger: draw
          handleTap(
            evt.nativeEvent.pageX,
            evt.nativeEvent.pageY
          );
        }
      },
      onPanResponderRelease: (evt) => {
        if (touchCount.current === 1) {
          handleTap(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        }
        touchCount.current = 0;
        lastTouchDistance.current = 0;
      },
    })
  ).current;

  const gridLineColor = 'rgba(200, 200, 200, 0.3)';

  const getBorderRadius = (size: number): number => {
    switch (pixelStyle) {
      case 'CIRCLE': return size / 2;
      case 'ROUNDED': return (size - 2) / 4;
      default: return 0;
    }
  };

  return (
    <View
      style={[styles.canvas, { width, height }]}
      {...panResponder.panHandlers}
      accessible={true}
      accessibilityLabel={`Canvas grid, ${gridSize.width} by ${gridSize.height} pixels`}
    >
      {showGridLines && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: visibleRange.endX - visibleRange.startX + 1 }, (_, i) => {
            const x = visibleRange.startX + i;
            return (
              <View
                key={`v-${x}`}
                style={{
                  position: 'absolute',
                  left: x * cellSize + panOffset.x,
                  top: visibleRange.startY * cellSize + panOffset.y,
                  width: StyleSheet.hairlineWidth,
                  height: (visibleRange.endY - visibleRange.startY) * cellSize,
                  backgroundColor: gridLineColor,
                }}
              />
            );
          })}
          {Array.from({ length: visibleRange.endY - visibleRange.startY + 1 }, (_, i) => {
            const y = visibleRange.startY + i;
            return (
              <View
                key={`h-${y}`}
                style={{
                  position: 'absolute',
                  left: visibleRange.startX * cellSize + panOffset.x,
                  top: y * cellSize + panOffset.y,
                  width: (visibleRange.endX - visibleRange.startX) * cellSize,
                  height: StyleSheet.hairlineWidth,
                  backgroundColor: gridLineColor,
                }}
              />
            );
          })}
        </View>
      )}

      {visibleCells.map((cell) => (
        <View
          key={cell.key}
          style={{
            position: 'absolute',
            left: cell.x * cellSize + panOffset.x,
            top: cell.y * cellSize + panOffset.y,
            width: cellSize,
            height: cellSize,
            backgroundColor: cell.color,
            borderRadius: getBorderRadius(cellSize),
          }}
        />
      ))}
    </View>
  );
});

CanvasGrid.displayName = 'CanvasGrid';
export default CanvasGrid;

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
});
