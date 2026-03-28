import { useCallback, useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useCanvasStore } from '../stores/canvasStore';
import { getCellSize } from '../utils/canvasViewport';

export function useCanvasInteraction(
  _canvasRef: React.RefObject<any>,
  gridSize: { width: number; height: number },
  zoom: number,
  panOffset: { x: number; y: number }
) {
  const grid = useCanvasStore((state) => state.grid);
  const selectedColor = useCanvasStore((state) => state.selectedColor);
  const currentTool = useCanvasStore((state) => state.currentTool);
  const setPixel = useCanvasStore((state) => state.setPixel);
  const setTool = useCanvasStore((state) => state.setSelectedTool);
  const setSelectedColor = useCanvasStore((state) => state.setSelectedColor);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const setPanOffset = useCanvasStore((state) => state.setPanOffset);

  // Track initial zoom and pan for gesture calculations
  const initialZoom = useRef(zoom);
  const initialPan = useRef(panOffset);

  const handleTap = useCallback(
    (x: number, y: number) => {
      const cellSize = getCellSize(gridSize.width, gridSize.height, zoom);

      // Convert screen coordinates to grid coordinates
      // Account for pan offset
      const gridX = Math.floor((x - panOffset.x) / cellSize);
      const gridY = Math.floor((y - panOffset.y) / cellSize);

      // Validate bounds
      if (gridX < 0 || gridX >= gridSize.width || gridY < 0 || gridY >= gridSize.height) {
        return;
      }

      const key = `${gridX},${gridY}`;

      switch (currentTool) {
        case 'brush':
          // Place pixel with selected color
          setPixel(gridX, gridY, selectedColor);
          break;

        case 'eraser':
          // Remove pixel (set to empty string)
          setPixel(gridX, gridY, '');
          break;

        case 'picker':
          // Pick color from existing pixel
          const existingColor = grid.get(key);
          if (existingColor) {
            setSelectedColor(existingColor);
            setTool('brush'); // Auto-switch to brush
          }
          break;

        case 'fill':
          // Fill bucket - handle in Phase 3
          // For now, just place single pixel
          setPixel(gridX, gridY, selectedColor);
          break;
      }
    },
    [gridSize, zoom, panOffset, grid, selectedColor, currentTool, setPixel, setTool, setSelectedColor]
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250) // 250ms max for tap (prevents long-press)
        .runOnJS(true)
        .onEnd((event) => {
          handleTap(event.absoluteX, event.absoluteY);
        }),
    [handleTap]
  );

  // Pinch-to-zoom gesture
  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          initialZoom.current = zoom;
        })
        .onUpdate((event) => {
          const newZoom = initialZoom.current * event.scale;
          setZoom(newZoom);
        })
        .runOnJS(true),
    [zoom, setZoom]
  );

  // Two-finger pan gesture
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minPointers(2)
        .maxPointers(2)
        .onStart(() => {
          initialPan.current = panOffset;
        })
        .onUpdate((event) => {
          const newPanOffset = {
            x: initialPan.current.x + event.translationX,
            y: initialPan.current.y + event.translationY,
          };
          setPanOffset(newPanOffset.x, newPanOffset.y);
        })
        .runOnJS(true),
    [panOffset, setPanOffset]
  );

  // Compose gestures: pinch (2 fingers), pan (2 fingers), tap (1 finger)
  const composedGesture = useMemo(
    () =>
      Gesture.Race(
        pinchGesture,
        panGesture,
        tapGesture
      ),
    [pinchGesture, panGesture, tapGesture]
  );

  return {
    composedGesture,
  };
}
