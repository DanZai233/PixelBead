import { useCallback } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
function isValidHexColor(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}
import { calculateLinePoints, calculateRectanglePoints, calculateCirclePoints } from '../utils/shapeUtils';
import * as Haptics from 'expo-haptics';

export function useDrawingTools() {
  const setPixel = useCanvasStore(state => state.setPixel);
  const setSelectedColor = useCanvasStore(state => state.setSelectedColor);
  const gridSize = useCanvasStore(state => state.gridSize);
  const grid = useCanvasStore(state => state.grid);

  const applyBrush = useCallback((x: number, y: number, color: string, brushSize: number) => {
    const modified = new Set<string>();

    if (brushSize === 1) {
      const key = `${x},${y}`;
      setPixel(x, y, color);
      modified.add(key);
    } else {
      const radius = Math.floor(brushSize / 2);
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < gridSize.width && py >= 0 && py < gridSize.height) {
            const key = `${px},${py}`;
            if (!modified.has(key)) {
              setPixel(px, py, color);
              modified.add(key);
            }
          }
        }
      }
    }

    return modified;
  }, [setPixel, gridSize]);

  const applyEraser = useCallback((x: number, y: number, brushSize: number) => {
    const modified = new Set<string>();

    if (brushSize === 1) {
      const key = `${x},${y}`;
      setPixel(x, y, '#FFFFFF'); // Use white to erase
      modified.add(key);
    } else {
      const radius = Math.floor(brushSize / 2);
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < gridSize.width && py >= 0 && py < gridSize.height) {
            const key = `${px},${py}`;
            if (!modified.has(key)) {
              setPixel(px, py, '#FFFFFF');
              modified.add(key);
            }
          }
        }
      }
    }

    return modified;
  }, [setPixel, gridSize]);

  const applyFill = useCallback(async (startX: number, startY: number, fillColor: string): Promise<number> => {
    const targetColor = grid.get(`${startX},${startY}`);
    if (targetColor === fillColor) return 0; // No change needed

    const visited = new Set<string>();
    const queue: [number, number][] = [[startX, startY]];
    const toProcess: [number, number][] = [];
    let modifiedCount = 0;

    visited.add(`${startX},${startY}`);

    const processChunk = () => {
      const chunk = toProcess.splice(0, 100); // Process 100 pixels per frame

      chunk.forEach(([x, y]) => {
        const key = `${x},${y}`;
        const pixelColor = grid.get(key);

        if (pixelColor === targetColor) {
          setPixel(x, y, fillColor);
          modifiedCount++;

          // Add neighbors
          const neighbors: [number, number][] = [
            [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
          ];

          neighbors.forEach(([nx, ny]) => {
            const nkey = `${nx},${ny}`;
            if (!visited.has(nkey) &&
                nx >= 0 && nx < gridSize.width &&
                ny >= 0 && ny < gridSize.height) {
              visited.add(nkey);
              toProcess.push([nx, ny]);
            }
          });
        }
      });

      if (toProcess.length > 0) {
        requestAnimationFrame(processChunk);
      }
    };

    // Start processing
    queue.forEach(([x, y]) => {
      const key = `${x},${y}`;
      if (!visited.has(key)) {
        visited.add(key);
        toProcess.push([x, y]);
      }
    });

    processChunk();

    return modifiedCount;
  }, [grid, setPixel, gridSize]);

  const applyColorPicker = useCallback((x: number, y: number): string | null => {
    const key = `${x},${y}`;
    const color = grid.get(key);

    if (color && isValidHexColor(color)) {
      setSelectedColor(color);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return color;
    }

    return null;
  }, [grid, setSelectedColor]);

  const applyLine = useCallback((x1: number, y1: number, x2: number, y2: number, color: string) => {
    const points = calculateLinePoints(x1, y1, x2, y2);
    const modified = new Set<string>();

    points.forEach(({ x, y }) => {
      if (x >= 0 && x < gridSize.width && y >= 0 && y < gridSize.height) {
        const key = `${x},${y}`;
        if (!modified.has(key)) {
          setPixel(x, y, color);
          modified.add(key);
        }
      }
    });
  }, [setPixel, gridSize]);

  const applyRectangle = useCallback((x1: number, y1: number, x2: number, y2: number, color: string, fill: boolean = false) => {
    const points = calculateRectanglePoints(x1, y1, x2, y2, fill);
    const modified = new Set<string>();

    points.forEach(({ x, y }) => {
      if (x >= 0 && x < gridSize.width && y >= 0 && y < gridSize.height) {
        const key = `${x},${y}`;
        if (!modified.has(key)) {
          setPixel(x, y, color);
          modified.add(key);
        }
      }
    });
  }, [setPixel, gridSize]);

  const applyCircle = useCallback((centerX: number, centerY: number, radius: number, color: string, fill: boolean = false) => {
    const points = calculateCirclePoints(centerX, centerY, radius, fill);
    const modified = new Set<string>();

    points.forEach(({ x, y }) => {
      if (x >= 0 && x < gridSize.width && y >= 0 && y < gridSize.height) {
        const key = `${x},${y}`;
        if (!modified.has(key)) {
          setPixel(x, y, color);
          modified.add(key);
        }
      }
    });
  }, [setPixel, gridSize]);

  return {
    applyBrush,
    applyEraser,
    applyFill,
    applyColorPicker,
    applyLine,
    applyRectangle,
    applyCircle,
  };
}
