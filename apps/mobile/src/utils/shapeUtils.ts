export function calculateLinePoints(x1: number, y1: number, x2: number, y2: number): Array<{x: number, y: number}> {
  const points: Array<{x: number, y: number}> = [];

  let x = Math.round(x1);
  let y = Math.round(y1);
  const dx = Math.abs(Math.round(x2) - x);
  const dy = Math.abs(Math.round(y2) - y);
  const sx = x < Math.round(x2) ? 1 : -1;
  const sy = y < Math.round(y2) ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x, y });

    if (x === Math.round(x2) && y === Math.round(y2)) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  return points;
}

export function calculateRectanglePoints(
  x1: number, y1: number, x2: number, y2: number,
  fill: boolean = false
): Array<{x: number, y: number}> {
  const points: Array<{x: number, y: number}> = [];
  const minX = Math.round(Math.min(x1, x2));
  const maxX = Math.round(Math.max(x1, x2));
  const minY = Math.round(Math.min(y1, y2));
  const maxY = Math.round(Math.max(y1, y2));

  if (fill) {
    // Filled rectangle
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        points.push({ x, y });
      }
    }
  } else {
    // Outline only
    for (let x = minX; x <= maxX; x++) {
      points.push({ x, y: minY }); // Top edge
      points.push({ x, y: maxY }); // Bottom edge
    }
    for (let y = minY + 1; y < maxY; y++) {
      points.push({ x: minX, y }); // Left edge
      points.push({ x: maxX, y }); // Right edge
    }
  }

  return points;
}

export function calculateCirclePoints(
  centerX: number, centerY: number, radius: number,
  fill: boolean = false
): Array<{x: number, y: number}> {
  const points: Array<{x: number, y: number}> = [];
  const cx = Math.round(centerX);
  const cy = Math.round(centerY);
  const r = Math.round(radius);

  if (fill) {
    // Filled circle
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r * r) {
          points.push({ x, y });
        }
      }
    }
  } else {
    // Bresenham's circle algorithm for outline
    let x = 0;
    let y = r;
    let d = 3 - 2 * r;

    const drawCirclePoints = (cx: number, cy: number, x: number, y: number) => {
      const points = [
        { x: cx + x, y: cy + y },
        { x: cx - x, y: cy + y },
        { x: cx + x, y: cy - y },
        { x: cx - x, y: cy - y },
        { x: cx + y, y: cy + x },
        { x: cx - y, y: cy + x },
        { x: cx + y, y: cy - x },
        { x: cx - y, y: cy - x },
      ];
      return points;
    };

    while (x <= y) {
      points.push(...drawCirclePoints(cx, cy, x, y));
      x++;
      if (d > 0) {
        y--;
        d = d + 4 * (x - y) + 10;
      } else {
        d = d + 4 * x + 6;
      }
    }
  }

  return points;
}
