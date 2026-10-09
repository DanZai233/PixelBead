import qrcode from 'qrcode-generator';

export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface QrMatrix {
  /** 码点数量（不含静区） */
  count: number;
  isDark(row: number, col: number): boolean;
}

/** 生成二维码点阵，内容按 UTF-8 编码，支持中文 */
export function createQrMatrix(content: string, level: QrErrorCorrection = 'M'): QrMatrix {
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  const qr = qrcode(0, level);
  qr.addData(content, 'Byte');
  qr.make();
  const count = qr.getModuleCount();
  return { count, isDark: (row, col) => qr.isDark(row, col) };
}

export interface DrawQrOptions {
  level?: QrErrorCorrection;
  /** 静区宽度（码点），默认 2 */
  quietZone?: number;
  foreground?: string;
  background?: string;
}

/**
 * 在 2D 画布上绘制二维码。码点尺寸取整数像素并在给定方框内居中，
 * 避免小数像素导致边缘发虚、影响扫码。
 */
export function drawQrToCanvas(
  ctx: CanvasRenderingContext2D,
  content: string,
  x: number,
  y: number,
  size: number,
  options: DrawQrOptions = {},
): void {
  const matrix = createQrMatrix(content, options.level ?? 'M');
  const quiet = Math.max(0, options.quietZone ?? 2);
  const modules = matrix.count + quiet * 2;
  const cell = Math.max(1, Math.floor(size / modules));
  const drawn = cell * modules;
  const offsetX = x + (size - drawn) / 2;
  const offsetY = y + (size - drawn) / 2;

  ctx.save();
  ctx.fillStyle = options.background ?? '#FFFFFF';
  ctx.fillRect(offsetX, offsetY, drawn, drawn);

  ctx.fillStyle = options.foreground ?? '#0F172A';
  for (let row = 0; row < matrix.count; row++) {
    for (let col = 0; col < matrix.count; col++) {
      if (!matrix.isDark(row, col)) continue;
      ctx.fillRect(
        offsetX + (col + quiet) * cell,
        offsetY + (row + quiet) * cell,
        cell,
        cell,
      );
    }
  }
  ctx.restore();
}
