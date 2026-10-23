export interface ImageCrop { x: number; y: number; width: number; height: number }

export function rasterizeImage(img: HTMLImageElement, width: number, height: number, xAlign = 0, yAlign = 0, crop?: ImageCrop) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法读取图片');
  let { x, y, width: sw, height: sh } = crop || { x: 0, y: 0, width: img.width, height: img.height };
  if (!crop) {
    if (img.width / img.height > width / height) {
      sw = img.height * width / height;
      x = (img.width - sw) * (xAlign + 1) / 2;
    } else {
      sh = img.width * height / width;
      y = (img.height - sh) * (yAlign + 1) / 2;
    }
  }
  ctx.drawImage(img, x, y, sw, sh, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height);
  const grid = Array.from({ length: height }, (_, row) => Array.from({ length: width }, (_, col) => {
    const i = (row * width + col) * 4;
    const [r, g, b, a] = pixels.data.subarray(i, i + 4);
    return a < 128 ? '#FFFFFF' : `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }));
  // Render the same solid colors used by the editor, including transparent pixels.
  grid.forEach((row, y) => row.forEach((color, x) => { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }));
  return { canvas, pixels, grid };
}
