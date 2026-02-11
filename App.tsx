import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  ToolType, DEFAULT_COLORS, AIConfig, AIProvider, PixelStyle, 
  TOOLS_INFO, PIXEL_STYLES, ColorHex 
} from './types';
import { generatePixelArtImage } from './services/aiService';
import { BeadCanvas } from './components/BeadCanvas';
import { SettingsPanel } from './components/SettingsPanel';
import { ColorPicker } from './components/ColorPicker';
import { ShortcutsPanel } from './components/ShortcutsPanel';
import { PromoSection } from './components/PromoSection';

const App: React.FC = () => {
  const [gridSize, setGridSize] = useState(32);
  const [customSize, setCustomSize] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [grid, setGrid] = useState<string[][]>(() => 
    Array(32).fill(null).map(() => Array(32).fill('#FFFFFF'))
  );
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [currentTool, setCurrentTool] = useState<ToolType>(ToolType.PENCIL);
  const [pixelStyle, setPixelStyle] = useState<PixelStyle>(PixelStyle.CIRCLE);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showGridLines, setShowGridLines] = useState(true);
  const [zoom, setZoom] = useState(80);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileLeftOpen, setIsMobileLeftOpen] = useState(false);
  const [isMobileRightOpen, setIsMobileRightOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);

  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem('aiConfig');
    if (savedConfig) {
      try {
        setAiConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Failed to parse saved AI config');
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSettingsOpen || isColorPickerOpen || isShortcutsOpen) return;

      const activeElement = document.activeElement;
      const isInputFocused = 
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.tagName === 'SELECT' ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (isInputFocused) return;

      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        return;
      }
      if (e.key === 'Delete') {
        e.preventDefault();
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        return;
      }
      if (e.key === '[') {
        e.preventDefault();
        return;
      }
      if (e.key === ']') {
        e.preventDefault();
        return;
      }

      const tool = TOOLS_INFO.find(t => t.shortcut.toLowerCase() === e.key.toLowerCase());
      if (tool) {
        e.preventDefault();
        setCurrentTool(tool.type);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isColorPickerOpen, isShortcutsOpen]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const handleSaveSettings = useCallback((config: AIConfig) => {
    setAiConfig(config);
    localStorage.setItem('aiConfig', JSON.stringify(config));
  }, []);

  const handleResize = useCallback((newSize: number) => {
    if (grid.some(row => row.some(c => c !== '#FFFFFF'))) {
      if (!confirm("更改尺寸将清空当前画布，确定吗？")) return;
    }
    setGridSize(newSize);
    setGrid(Array(newSize).fill(null).map(() => Array(newSize).fill('#FFFFFF')));
    setPanOffset({ x: 0, y: 0 });
    if (newSize >= 80) setZoom(35);
    else if (newSize >= 48) setZoom(50);
    else setZoom(80);
    setShowCustomInput(false);
    setCustomSize('');
  }, [grid]);

  const handleCustomSize = useCallback(() => {
    const size = parseInt(customSize);
    if (isNaN(size) || size < 4 || size > 200) {
      alert('请输入 4-200 之间的数字');
      return;
    }
    handleResize(size);
  }, [customSize, handleResize]);

  const resetGrid = useCallback(() => {
    if (confirm("确定要清空画布吗？")) {
      setGrid(Array(gridSize).fill(null).map(() => Array(gridSize).fill('#FFFFFF')));
      setPanOffset({ x: 0, y: 0 });
    }
  }, [gridSize]);

  const processImageToGrid = useCallback((imageSrc: string, size: number, xAlign: number = 0, yAlign: number = 0) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const sourceSize = Math.min(img.width, img.height);
      let offsetX = (img.width - sourceSize) / 2;
      let offsetY = (img.height - sourceSize) / 2;

      if (img.width > img.height) {
        if (xAlign === -1) offsetX = 0;
        else if (xAlign === 1) offsetX = img.width - sourceSize;
      } else {
        if (yAlign === -1) offsetY = 0;
        else if (yAlign === 1) offsetY = img.height - sourceSize;
      }

      ctx.drawImage(img, offsetX, offsetY, sourceSize, sourceSize, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size).data;
      
      const newGrid: string[][] = [];
      for (let i = 0; i < size; i++) {
        const row: string[] = [];
        for (let j = 0; j < size; j++) {
          const index = (i * size + j) * 4;
          const r = imageData[index];
          const g = imageData[index + 1];
          const b = imageData[index + 2];
          const a = imageData[index + 3];

          if (a < 128) {
            row.push('#FFFFFF');
          } else {
            const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
            row.push(hex);
          }
        }
        newGrid.push(row);
      }
      setGrid(newGrid);
      setPendingImage(null);
      setIsProcessingImage(false);
    };
    img.src = imageSrc;
  }, []);

  const handleCanvasAction = useCallback((row: number, col: number) => {
    if (currentTool === ToolType.PICKER) {
      const colorAt = grid[row][col];
      if (colorAt && colorAt !== '#FFFFFF') {
        setSelectedColor(colorAt);
        setCurrentTool(ToolType.PENCIL);
      }
      return;
    }

    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      
      if (currentTool === ToolType.PENCIL) {
        if (newGrid[row][col] === selectedColor) return prev;
        newGrid[row][col] = selectedColor;
      } else if (currentTool === ToolType.ERASER) {
        if (newGrid[row][col] === '#FFFFFF') return prev;
        newGrid[row][col] = '#FFFFFF';
      } else if (currentTool === ToolType.FILL) {
        const targetColor = prev[row][col];
        const fillColor = selectedColor;
        if (targetColor === fillColor) return prev;
        
        const stack = [[row, col]];
        const visited = new Set<string>();
        while (stack.length > 0) {
          const [r, c] = stack.pop()!;
          const key = `${r},${c}`;
          if (r < 0 || r >= gridSize || c < 0 || c >= gridSize || newGrid[r][c] !== targetColor || visited.has(key)) continue;
          newGrid[r][c] = fillColor;
          visited.add(key);
          stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
        }
      }
      return newGrid;
    });
  }, [selectedColor, currentTool, gridSize, grid]);

  const handleMiddleButtonDrag = useCallback((deltaX: number, deltaY: number) => {
    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
  }, []);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    grid.forEach(row => {
      row.forEach(color => {
        if (color && color !== '#FFFFFF') {
          counts[color] = (counts[color] || 0) + 1;
        }
      });
    });
    return Object.entries(counts).map(([hex, count]) => ({ hex, count }))
      .sort((a, b) => b.count - a.count);
  }, [grid]);

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) {
      alert('请输入描述');
      return;
    }
    if (!aiConfig?.apiKey) {
      alert('请先在设置中配置 AI API Key');
      setIsSettingsOpen(true);
      return;
    }
    
    setIsGenerating(true);
    try {
      const base64 = await generatePixelArtImage(aiPrompt, aiConfig);
      processImageToGrid(base64, gridSize, 0, 0);
      setAiPrompt('');
    } catch (error) {
      console.error('AI generation error:', error);
      alert(`AI 生成失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setPendingImage(e.target?.result as string);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const baseBeadSize = 28;
  const boardDimension = gridSize * (baseBeadSize * (zoom / 100));

  const presetSizes = [16, 32, 48, 64, 80, 100];

  const allColors = useMemo(() => {
    const colorSet = new Set<ColorHex>([...DEFAULT_COLORS]);
    stats.forEach(item => colorSet.add(item.hex));
    return Array.from(colorSet);
  }, [stats]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9] text-slate-900 select-none overflow-hidden h-screen">
      <header className="bg-white border-b border-slate-200 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2 z-[100] shadow-sm shrink-0 overflow-x-auto overflow-y-hidden no-scrollbar">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileLeftOpen(!isMobileLeftOpen)}
            className="lg:hidden p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><circle cx="12" cy="12" r="10"/></svg>
          </div>
          <h1 className="font-black text-lg md:text-xl text-slate-800 italic hidden sm:block">PIXEL BEAD STUDIO</h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {presetSizes.slice(0, 4).map(size => (
              <button
                key={size}
                onClick={() => handleResize(size)}
                className={`px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black transition-all ${gridSize === size ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {size}²
              </button>
            ))}
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black transition-all ${showCustomInput ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              自定义
            </button>
          </div>

          {showCustomInput && (
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm">
              <input
                type="number"
                min="4"
                max="200"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="4-200"
                className="w-14 md:w-16 px-2 py-1.5 text-[10px] md:text-xs font-black text-center border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleCustomSize}
                className="px-2 md:px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] md:text-xs font-black hover:bg-indigo-700 transition-all"
              >
                确定
              </button>
            </div>
          )}

          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
            {PIXEL_STYLES.map(style => (
              <button
                key={style.value}
                onClick={() => setPixelStyle(style.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${pixelStyle === style.value ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                title={style.name}
              >
                <span>{style.icon}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-1 md:gap-2">
            <button 
              onClick={() => {
                const data = JSON.stringify({ grid, gridSize });
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pixel-bead-${gridSize}.json`;
                a.click();
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-6 py-2 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              <span className="hidden sm:inline">导出</span>
            </button>

            <div className="flex gap-1 md:gap-2">
              <button
                onClick={() => setIsShortcutsOpen(true)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                title="快捷键说明"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                title="AI 设置"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white border-r border-slate-200 overflow-y-auto no-scrollbar p-4 md:p-6 space-y-4 md:space-y-6 flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out ${isMobileLeftOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:transform-none lg:translate-x-0`}>
          <div className="flex justify-between items-center mb-2 lg:hidden">
            <h2 className="text-sm font-black text-slate-900">工具栏</h2>
            <button onClick={() => setIsMobileLeftOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3 md:hidden">
            <div className="flex justify-between items-center">
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">像素样式</h2>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {PIXEL_STYLES.map(style => (
                <button
                  key={style.value}
                  onClick={() => setPixelStyle(style.value)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 touch-manipulation ${pixelStyle === style.value ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title={style.name}
                >
                  <span>{style.icon}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">工具</h2>
              <button
                onClick={() => setIsShortcutsOpen(true)}
                className="text-[10px] text-indigo-600 hover:text-indigo-700 font-black"
              >
                查看快捷键
              </button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-2">
              {TOOLS_INFO.map(tool => (
                <button
                  key={tool.type}
                  onClick={() => setCurrentTool(tool.type)}
                  className={`flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl border-2 transition-all ${currentTool === tool.type ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100'}`}
                  title={`${tool.name} (${tool.shortcut})`}
                >
                  <span className="text-lg md:text-xl">{tool.icon}</span>
                  <span className="text-[9px] md:text-[9px] font-bold uppercase">{tool.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">调色盘</h2>
              <button
                onClick={() => setIsColorPickerOpen(true)}
                className="text-[10px] text-indigo-600 hover:text-indigo-700 font-black flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                </svg>
                更多颜色
              </button>
            </div>
            <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-slate-50 rounded-xl">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg border-2 border-slate-200" style={{ backgroundColor: selectedColor }}></div>
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => {
                  const hex = e.target.value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                    setSelectedColor(hex);
                  }
                }}
                className="flex-1 px-2 py-1 text-xs md:text-sm font-mono border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                placeholder="#RRGGBB"
              />
            </div>
            <div className="grid grid-cols-5 md:grid-cols-6 gap-1.5">
              {DEFAULT_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color);
                    if (currentTool === ToolType.ERASER || currentTool === ToolType.PICKER) setCurrentTool(ToolType.PENCIL);
                  }}
                  className={`aspect-square rounded-full border-2 transition-all hover:scale-110 ${selectedColor === color ? 'border-indigo-600 scale-110 ring-2 ring-indigo-100' : 'border-white'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-4 md:p-5 text-white shadow-xl space-y-2 md:space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <span className="animate-pulse">✨</span> AI 像素画生成
            </h2>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="例如: 可爱的像素风猫咪"
              className="w-full h-16 md:h-20 p-2 md:p-3 rounded-xl bg-white/5 border border-white/10 text-xs placeholder:text-white/20 focus:bg-white/10 outline-none resize-none"
            />
            <button
              onClick={handleAiGenerate}
              disabled={isGenerating || !aiPrompt.trim()}
              className="w-full py-2 md:py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-black text-xs transition-all active:scale-95 flex justify-center items-center"
            >
              {isGenerating ? "正在魔法创作..." : "一键生成拼豆图"}
            </button>
            {!aiConfig?.apiKey && (
              <p className="text-[10px] text-yellow-400/80 text-center">请先配置 AI API Key</p>
            )}
          </div>

          <div className="bg-emerald-600 rounded-3xl p-4 md:p-5 text-white shadow-xl space-y-2 md:space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-emerald-100">本地图片转换</h2>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onFileChange} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 md:py-2.5 bg-white text-emerald-600 rounded-xl font-black text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              上传照片
            </button>
          </div>

          <div className="mt-auto pt-4 space-y-0">
            <button 
              onClick={resetGrid}
              className="w-full py-3 md:py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-all"
            >
              清空当前画布
            </button>
            <PromoSection />
          </div>
        </aside>

        <main className="flex-1 bg-[#EBEDF0] relative overflow-hidden">
          <div className="absolute top-2 left-2 right-2 md:top-6 md:left-1/2 md:right-auto md:-translate-x-1/2 flex items-center justify-center gap-2 md:gap-4 bg-white/95 backdrop-blur-sm px-3 md:px-6 py-2 rounded-2xl md:rounded-full shadow-xl border border-white/50 z-50 md:max-w-fit">
            <button onClick={() => setZoom(z => Math.max(10, z - 5))} className="p-1.5 md:p-0 font-black text-slate-400 hover:text-indigo-600 text-lg min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation">－</button>
            <input type="range" min="10" max="300" value={zoom} onChange={(e) => setZoom(parseInt(e.target.value))} className="w-16 md:w-40 h-3 accent-indigo-600 touch-manipulation flex-1 md:flex-initial" />
            <button onClick={() => setZoom(z => Math.min(400, z + 5))} className="p-1.5 md:p-0 font-black text-slate-400 hover:text-indigo-600 text-lg min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation">＋</button>
            <span className="text-[10px] font-black w-10 md:w-12 text-slate-500 text-center shrink-0">{zoom}%</span>
            <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
            <button 
              onClick={() => setPanOffset({ x: 0, y: 0 })}
              className="text-[9px] md:text-[10px] font-black uppercase px-2 md:px-3 py-1.5 rounded-lg text-slate-400 hover:text-indigo-600 touch-manipulation hidden md:block"
              title="重置画布位置"
            >
              重置
            </button>
            <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
            <button onClick={() => setShowGridLines(!showGridLines)} className={`text-[9px] md:text-[10px] font-black uppercase px-2 md:px-3 py-1.5 rounded-lg touch-manipulation ${showGridLines ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}>
              网格
            </button>
            <span className="md:hidden text-[9px] text-slate-400 ml-1">双指缩放/拖动</span>
          </div>

          <div className="w-full h-full overflow-auto no-scrollbar bg-dots">
            <div className="min-w-full min-h-full flex items-center justify-center p-4 md:p-40 pt-16 md:pt-8">
              <div 
                className="relative transition-transform duration-75"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                }}
              >
                <div className="relative shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3rem] bg-white border border-white/60 p-6 md:p-12">
                  <BeadCanvas
                    grid={grid}
                    gridSize={gridSize}
                    zoom={zoom}
                    showGridLines={showGridLines}
                    pixelStyle={pixelStyle}
                    onPointerDown={handleCanvasAction}
                    onPointerMove={handleCanvasAction}
                    onPointerUp={() => {}}
                    onMiddleButtonDrag={handleMiddleButtonDrag}
                    onZoomChange={setZoom}
                    onTouchPan={handleMiddleButtonDrag}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:transform bg-slate-900/90 backdrop-blur text-white px-4 md:px-8 py-2 md:py-3 rounded-2xl shadow-2xl flex gap-4 md:gap-10 text-[9px] md:text-[10px] font-black tracking-widest z-50 max-w-fit md:max-w-none">
            <div className="flex flex-col"><span className="text-slate-500 mb-0.5">尺寸</span>{gridSize}x{gridSize}</div>
            <div className="flex flex-col"><span className="text-slate-500 mb-0.5">总数</span>{gridSize * gridSize}</div>
            <div className="flex flex-col"><span className="text-indigo-400 mb-0.5">已用</span>{stats.reduce((acc, curr) => acc + curr.count, 0)}</div>
          </div>

          <button
            onClick={() => setIsMobileRightOpen(!isMobileRightOpen)}
            className="lg:hidden fixed right-4 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center touch-manipulation safe-area-bottom"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </main>

        <aside className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-white border-l border-slate-200 overflow-y-auto no-scrollbar p-4 md:p-6 shrink-0 transform transition-transform duration-300 ease-in-out ${isMobileRightOpen ? 'translate-x-0' : 'translate-x-full'} lg:relative lg:transform-none lg:translate-x-0`}>
          <div className="flex justify-between items-center mb-2 lg:hidden">
            <h2 className="text-sm font-black text-slate-900">颜色统计</h2>
            <button onClick={() => setIsMobileRightOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 md:mb-6 flex justify-between">
            所需拼豆清单 <span>数量</span>
          </h2>
          
          <div className="space-y-2 md:space-y-3">
            {stats.length > 0 ? stats.map((item) => (
              <div 
                key={item.hex} 
                className="flex items-center justify-between bg-slate-50 p-2 md:p-3 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedColor(item.hex)}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bead-shadow" style={{ backgroundColor: item.hex }}></div>
                  <div>
                    <div className="text-[8px] md:text-[9px] font-mono text-slate-300 leading-none mb-1 uppercase">{item.hex}</div>
                    <div className="text-xs md:text-sm font-black text-slate-800">{item.count} <span className="text-[9px] md:text-[10px] font-medium opacity-40">颗</span></div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-10 md:py-20 text-center text-slate-200">
                <p className="text-xs font-black uppercase italic tracking-widest">暂无记录</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {pendingImage && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 max-w-lg w-full shadow-2xl space-y-6 md:space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 italic">裁切选择</h3>
              <p className="text-xs md:text-sm text-slate-400 font-medium">请选择图像在 1:1 画布中的对齐位置</p>
            </div>
            
            <div className="aspect-square bg-slate-100 rounded-2xl md:rounded-3xl overflow-hidden relative border-4 border-slate-200 flex items-center justify-center">
               <img src={pendingImage} alt="Preview" className="max-w-none max-h-none opacity-50 absolute w-full h-full object-contain" />
               <div className="z-10 text-[9px] md:text-[10px] font-black bg-slate-900 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full uppercase tracking-widest">预览 1:1 区域</div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <button onClick={() => setCropOffset({x: -1, y: -1})} className="p-3 md:p-4 bg-slate-50 hover:bg-slate-100 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-xs">左上</button>
              <button onClick={() => setCropOffset({x: 0, y: 0})} className="p-3 md:p-4 bg-indigo-50 border-2 border-indigo-500 text-indigo-700 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-xs">居中</button>
              <button onClick={() => setCropOffset({x: 1, y: 1})} className="p-3 md:p-4 bg-slate-50 hover:bg-slate-100 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-xs">右下</button>
            </div>

            <div className="flex gap-2 md:gap-4">
              <button onClick={() => setPendingImage(null)} className="flex-1 py-3 md:py-4 bg-slate-100 text-slate-500 rounded-xl md:rounded-2xl font-black text-sm">取消</button>
              <button 
                onClick={() => processImageToGrid(pendingImage, gridSize, cropOffset.x, cropOffset.y)} 
                className="flex-[2] py-3 md:py-4 bg-emerald-500 text-white rounded-xl md:rounded-2xl font-black text-sm shadow-xl active:scale-95"
              >
                确认并转换
              </button>
            </div>
          </div>
        </div>
      )}

      {isMobileLeftOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileLeftOpen(false)}
        />
      )}

      {isMobileRightOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileRightOpen(false)}
        />
      )}

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        currentConfig={aiConfig || undefined}
      />

      <ColorPicker
        isOpen={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
      />

      <ShortcutsPanel
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};

export default App;
