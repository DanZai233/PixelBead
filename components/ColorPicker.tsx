import React, { useState, useRef, useEffect } from 'react';
import { ColorHex } from '../types';

interface ColorPickerProps {
  selectedColor: ColorHex;
  onColorChange: (color: ColorHex) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorChange,
  isOpen,
  onClose,
}) => {
  const [hexInput, setHexInput] = useState(selectedColor.replace('#', ''));
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingHue = useRef(false);
  const isDraggingSL = useRef(false);

  useEffect(() => {
    if (isOpen) {
      updateHSLFromHex(selectedColor);
    }
  }, [isOpen, selectedColor]);

  const updateHSLFromHex = (hex: string) => {
    let h = 0, s = 100, l = 50;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;

    l = (max + min) / 2;

    if (d === 0) {
      h = 0;
    } else if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / d + 2) / 6;
    } else {
      h = ((r - g) / d + 4) / 6;
    }

    s = l === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

    setHue(h * 360);
    setSaturation(s * 100);
    setLightness(l * 100);
    setHexInput(hex.replace('#', ''));
  };

  const hslToHex = (h: number, s: number, l: number): string => {
    const sNorm = s / 100;
    const lNorm = l / 100;
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lNorm - c / 2;

    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }

    const toHex = (val: number) => {
      const hex = Math.round((val + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace('#', '').toUpperCase();
    if (!/^#[0-9A-F]{6}$/i.test('#' + value) && value.length <= 6) {
      setHexInput(value);
      if (/^[0-9A-F]{6}$/i.test(value)) {
        onColorChange('#' + value);
        updateHSLFromHex('#' + value);
      }
    }
  };

  const drawColorMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;

    const imageData = ctx.createImageData(300, 300);
    for (let y = 0; y < 300; y++) {
      for (let x = 0; x < 300; x++) {
        const s = x / 300;
        const l = 1 - y / 300;
        const color = hslToRgb(hue, s * 100, l * 100);
        const i = (y * 300 + x) * 4;
        imageData.data[i] = color.r;
        imageData.data[i + 1] = color.g;
        imageData.data[i + 2] = color.b;
        imageData.data[i + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    const sNorm = s / 100;
    const lNorm = l / 100;
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lNorm - c / 2;

    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  };

  useEffect(() => {
    drawColorMap();
  }, [hue]);

  const handleColorMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const s = Math.min(Math.max(x / canvas.width, 0), 1) * 100;
    const l = Math.min(Math.max(1 - y / canvas.height, 0), 1) * 100;

    setSaturation(s);
    setLightness(l);

    const newColor = hslToHex(hue, s, l);
    onColorChange(newColor);
    setHexInput(newColor.replace('#', ''));
  };

  const handleHueClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newHue = (x / rect.width) * 360;
    setHue(newHue);
    const newColor = hslToHex(newHue, saturation, lightness);
    onColorChange(newColor);
    setHexInput(newColor.replace('#', ''));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-slate-900">颜色选择器</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative">
              <canvas
                ref={canvasRef}
                onClick={handleColorMapClick}
                onMouseDown={(e) => {
                  isDraggingSL.current = true;
                  handleColorMapClick(e);
                }}
                onMouseMove={(e) => {
                  if (isDraggingSL.current) handleColorMapClick(e);
                }}
                onMouseUp={() => isDraggingSL.current = false}
                onMouseLeave={() => isDraggingSL.current = false}
                className="w-[300px] h-[300px] rounded-lg cursor-crosshair border-2 border-slate-200"
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">当前颜色</p>
                <div
                  className="w-full h-20 rounded-xl border-2 border-slate-200 shadow-inner"
                  style={{ backgroundColor: selectedColor }}
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">HEX 值</p>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">#</span>
                  <input
                    type="text"
                    value={hexInput}
                    onChange={handleHexInput}
                    maxLength={6}
                    className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-lg font-mono text-sm focus:border-indigo-500 outline-none uppercase"
                    placeholder="RRGGBB"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">色相</p>
            <div
              className="h-6 rounded-lg cursor-pointer"
              style={{
                background: `linear-gradient(to right, 
                  hsl(0, 100%, 50%),
                  hsl(60, 100%, 50%),
                  hsl(120, 100%, 50%),
                  hsl(180, 100%, 50%),
                  hsl(240, 100%, 50%),
                  hsl(300, 100%, 50%),
                  hsl(360, 100%, 50%))`
              }}
              onClick={handleHueClick}
              onMouseDown={(e) => {
                isDraggingHue.current = true;
                handleHueClick(e);
              }}
              onMouseMove={(e) => {
                if (isDraggingHue.current) handleHueClick(e);
              }}
              onMouseUp={() => isDraggingHue.current = false}
              onMouseLeave={() => isDraggingHue.current = false}
            />
          </div>

          <button
            onClick={() => {
              onColorChange(selectedColor);
              onClose();
            }}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
};
