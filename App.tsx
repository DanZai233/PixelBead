import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ToolType, DEFAULT_COLORS, PixelStyle,
  TOOLS_INFO, MOBILE_2D_DOCK_TOOLS, PIXEL_STYLES, ColorHex, ViewType, VIEW_TYPES,
  ColorSystem, PaletteColor, PALETTE_PRESETS, Selection, BRUSH_SIZES, ToolInfo
} from './types';
import { generatePixelArtImage } from './services/aiService';
import { saveToUpstash, generateShareUrl, getShareKeyFromUrl, loadFromUpstash } from './services/upstashService';
import { saveMaterial } from './services/materialService';
import { BeadCanvas } from './components/BeadCanvas';
import { Bead3DViewer } from './components/Bead3DViewer';
import { BeadSliceViewer } from './components/BeadSliceViewer';
import { BeadPlannerView } from './components/BeadPlannerView';
import { ImageCropSelector } from './components/ImageCropSelector';
import { ColorPicker } from './components/ColorPicker';
import { ShortcutsPanel } from './components/ShortcutsPanel';
import { PromoSection } from './components/PromoSection';
import { MaterialGallery } from './components/MaterialGallery';
import { HelpModal } from './components/HelpModal';
import { OnboardingGuide } from './components/OnboardingGuide';
import { AdminPanel } from './components/AdminPanel';
import { VirtualJoystick } from './components/VirtualJoystick';
import { generateExportImage, generateShareImage, generateShareCaption, getUniqueColors } from './utils/colorUtils';
import {
  mergeSimilarColors,
  mapColorsToPalette,
  createPaletteFromGrid,
  createFullPaletteFromMapping,
  colorSystemOptions,
  findClosestColor,
} from './utils/colorSystemUtils';
import colorSystemMapping from './colorSystemMapping.json';

const App: React.FC = () => {
  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.hash === '#admin');

  useEffect(() => {
    const onHashChange = () => setIsAdminRoute(window.location.hash === '#admin');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (isAdminRoute) {
    return <AdminPanel onBack={() => { window.location.hash = ''; setIsAdminRoute(false); }} />;
  }

  return <AppMain />;
};

const SAVE_KEY = 'pixelbead_autosave';

function loadSavedCanvas(): { grid: string[][]; gridWidth: number; gridHeight: number; pixelStyle: PixelStyle; selectedColor: string; zoom: number } | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.grid && data.gridWidth && data.gridHeight && data.grid.length === data.gridHeight && data.grid[0]?.length === data.gridWidth) {
      return data;
    }
  } catch {}
  return null;
}

const AppMain: React.FC = () => {
  const saved = useMemo(() => loadSavedCanvas(), []);

  const [gridWidth, setGridWidth] = useState(saved?.gridWidth ?? 32);
  const [gridHeight, setGridHeight] = useState(saved?.gridHeight ?? 32);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [grid, setGrid] = useState<string[][]>(() => 
    saved?.grid ?? Array(32).fill(null).map(() => Array(32).fill('#FFFFFF'))
  );
  const [backgroundImage, setBackgroundImage] = useState<{ src: string; x: number; y: number; scale: number; opacity: number } | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<'bead' | 'background'>('bead');
  const [selectedColor, setSelectedColor] = useState(saved?.selectedColor ?? DEFAULT_COLORS[0]);
  const [currentTool, setCurrentTool] = useState<ToolType>(ToolType.PENCIL);
  const [pixelStyle, setPixelStyle] = useState<PixelStyle>(saved?.pixelStyle ?? PixelStyle.SQUARE);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [aiReferenceImage, setAiReferenceImage] = useState<string | null>(null);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [showGridLines, setShowGridLines] = useState(true);
  const [zoom, setZoom] = useState(saved?.zoom ?? 80);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileLeftOpen, setIsMobileLeftOpen] = useState(false);
  const [isMobileRightOpen, setIsMobileRightOpen] = useState(false);
  const [viewType, setViewType] = useState<ViewType>(ViewType.TWO_D);
  const [layers, setLayers] = useState(3);

  const [selectedPalettePreset, setSelectedPalettePreset] = useState('all');
  const [mergeThreshold, setMergeThreshold] = useState(0.15);
  const [showColorKeys, setShowColorKeys] = useState(true);
  const [selectedColorSystem, setSelectedColorSystem] = useState<ColorSystem>('MARD');
  const [isPalettePanelOpen, setIsPalettePanelOpen] = useState(true);
  const [highlightedColor, setHighlightedColor] = useState<ColorHex | null>(null);
  const [highlightOpacity, setHighlightOpacity] = useState(90);
  const [isPlannerViewOpen, setIsPlannerViewOpen] = useState(false);
  const [customCrop, setCustomCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [useAdvancedCrop, setUseAdvancedCrop] = useState(false);

  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [shapeStart, setShapeStart] = useState<{ row: number; col: number } | null>(null);

  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const [showRuler, setShowRuler] = useState(true);

  const [showGuideLines, setShowGuideLines] = useState(true);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportPixelStyle, setExportPixelStyle] = useState<PixelStyle>(PixelStyle.CIRCLE);
  const [exportShowGuideLines, setExportShowGuideLines] = useState(false);
  const [exportMirror, setExportMirror] = useState(false);
  const [exportSelectionOnly, setExportSelectionOnly] = useState(false);
  const [exportPreviewUrl, setExportPreviewUrl] = useState<string | null>(null);
  const [exportPreviewBlob, setExportPreviewBlob] = useState<Blob | null>(null);
  const [exportPreviewName, setExportPreviewName] = useState('');

  const [materialGalleryOpen, setMaterialGalleryOpen] = useState(false);
  const [shareToGallery, setShareToGallery] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialAuthor, setMaterialAuthor] = useState('');
  const [materialTags, setMaterialTags] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding_done');
  });

  const [selection, setSelection] = useState<Selection | null>(null);
  const [clipboard, setClipboard] = useState<string[][] | null>(null);
  const [brushSize, setBrushSize] = useState(1);

  const [joystickMove, setJoystickMove] = useState({ x: 0, y: 0 });
  const [joystickZoom, setJoystickZoom] = useState(0);
  const joystickMoveRef = useRef({ x: 0, y: 0 });
  const joystickZoomRef = useRef(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const aiReferenceImageRef = useRef<HTMLInputElement>(null);
  const backgroundImageRef = useRef<HTMLInputElement>(null);
  const undoStackRef = useRef<string[][][]>([]);
  const redoStackRef = useRef<string[][][]>([]);
  const gridRef = useRef(grid);
  const [historyVersion, setHistoryVersion] = useState(0);
  const MAX_HISTORY = 50;

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          grid, gridWidth, gridHeight, pixelStyle, selectedColor, zoom,
        }));
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [grid, gridWidth, gridHeight, pixelStyle, selectedColor, zoom]);

  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;

  const getLineCells = useCallback((r1: number, c1: number, r2: number, c2: number) => {
    const cells: [number, number][] = [];
    const dr = Math.abs(r2 - r1);
    const dc = Math.abs(c2 - c1);
    const sr = r1 < r2 ? 1 : -1;
    const sc = c1 < c2 ? 1 : -1;
    let r = r1, c = c1;
    cells.push([r, c]);
    if (dr > dc) {
      let err = dr / 2;
      while (r !== r2) {
        err -= dc;
        if (err < 0) { c += sc; err += dr; }
        r += sr;
        cells.push([r, c]);
      }
    } else {
      let err = dc / 2;
      while (c !== c2) {
        err -= dr;
        if (err < 0) { r += sr; err += dc; }
        c += sc;
        cells.push([r, c]);
      }
    }
    return cells;
  }, []);

  const getRectCells = useCallback((r1: number, c1: number, r2: number, c2: number) => {
    const cells: [number, number][] = [];
    const [rMin, rMax] = [Math.min(r1, r2), Math.max(r1, r2)];
    const [cMin, cMax] = [Math.min(c1, c2), Math.max(c1, c2)];
    for (let c = cMin; c <= cMax; c++) {
      cells.push([rMin, c]);
      if (rMax > rMin) cells.push([rMax, c]);
    }
    for (let r = rMin + 1; r < rMax; r++) {
      cells.push([r, cMin]);
      if (cMax > cMin) cells.push([r, cMax]);
    }
    return cells;
  }, []);

  const getCircleCells = useCallback((r1: number, c1: number, r2: number, c2: number) => {
    const cells: [number, number][] = [];
    const cx = (c1 + c2) / 2;
    const cy = (r1 + r2) / 2;
    const radius = Math.max(0, Math.hypot(c2 - c1, r2 - r1) / 2);
    const r = Math.round(radius);
    let x = r, y = 0, err = 1 - r;
    const add = (dx: number, dy: number) => {
      const row = Math.round(cy + dy);
      const col = Math.round(cx + dx);
      if (row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) cells.push([row, col]);
    };
    while (x >= y) {
      add(x, y); add(-x, y); add(x, -y); add(-x, -y);
      add(y, x); add(-y, x); add(y, -x); add(-y, -x);
      y++;
      if (err < 0) err += 2 * y + 1;
      else { x--; err += 2 * (y - x) + 1; }
    }
    return cells;
  }, [gridHeight, gridWidth]);

  useEffect(() => {
    const shapeTools = [ToolType.LINE, ToolType.RECT, ToolType.CIRCLE];
    if (!shapeTools.includes(currentTool)) setShapeStart(null);
  }, [currentTool]);

  // 加载分享的拼豆数据
  useEffect(() => {
    const loadSharedData = async () => {
      const shareKey = getShareKeyFromUrl();
      if (shareKey) {
        try {
          const shareData = await loadFromUpstash(shareKey);
          if (shareData) {
            const size = shareData.gridSize || shareData.gridWidth || 32;
            setGridWidth(size);
            setGridHeight(shareData.gridHeight || size);
            setGrid(shareData.grid);
            setPixelStyle(shareData.pixelStyle as PixelStyle);
            setShareModalOpen(true);

            // 清除 URL 中的分享参数
            window.history.replaceState({}, document.title, window.location.pathname);

            alert('已加载分享的拼豆图纸！');
          }
        } catch (error) {
          console.error('加载分享数据失败:', error);
        }
      }
    };

    loadSharedData();
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    joystickMoveRef.current = joystickMove;
  }, [joystickMove]);

  useEffect(() => {
    joystickZoomRef.current = joystickZoom;
  }, [joystickZoom]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const updateJoystickState = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      if (joystickMoveRef.current.x !== 0 || joystickMoveRef.current.y !== 0) {
        const speed = 0.3;
        const deltaPan = deltaTime * speed;
        setPanOffset(prev => ({
          x: prev.x + joystickMoveRef.current.x * deltaPan,
          y: prev.y + joystickMoveRef.current.y * deltaPan,
        }));
      }

      if (joystickZoomRef.current !== 0) {
        const zoomSpeed = 0.1;
        const deltaZoom = deltaTime * zoomSpeed * joystickZoomRef.current;
        setZoom(prev => Math.min(Math.max(prev + deltaZoom, 10), 400));
      }

      lastTime = currentTime;
      animationFrameId = requestAnimationFrame(updateJoystickState);
    };

    animationFrameId = requestAnimationFrame(updateJoystickState);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const pushUndo = useCallback((prev: string[][]) => {
    undoStackRef.current = [...undoStackRef.current.slice(-(MAX_HISTORY - 1)), prev.map(r => [...r])];
    redoStackRef.current = [];
    setHistoryVersion(v => v + 1);
  }, []);

  const handleApplyMaterial = useCallback(async (material: any) => {
    let materialWidth, materialHeight;

    if (material.gridWidth !== undefined && material.gridHeight !== undefined) {
      materialWidth = material.gridWidth;
      materialHeight = material.gridHeight;
    } else if (material.gridSize !== undefined) {
      materialWidth = material.gridSize;
      materialHeight = material.gridSize;
    } else {
      materialWidth = 32;
      materialHeight = 32;
    }

    const currentMaxSize = Math.max(gridWidth, gridHeight);
    const materialMaxSize = Math.max(materialWidth, materialHeight);

    if (materialMaxSize !== currentMaxSize || materialWidth !== gridWidth || materialHeight !== gridHeight) {
      if (!confirm(`素材尺寸为 ${materialWidth}x${materialHeight}，当前为 ${gridWidth}x${gridHeight}。是否切换尺寸并应用？`)) {
        return;
      }
      setGridWidth(materialWidth);
      setGridHeight(materialHeight);
    }

    pushUndo(gridRef.current);
    setGrid(material.grid);
    setPanOffset({ x: 0, y: 0 });
    if (materialMaxSize >= 80) setZoom(35);
    else if (materialMaxSize >= 48) setZoom(50);
    else setZoom(80);
  }, [gridWidth, gridHeight, pushUndo]);

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current.pop()!;
    redoStackRef.current = [...redoStackRef.current, grid.map(r => [...r])];
    setGrid(prev);
    setHistoryVersion(v => v + 1);
  }, [grid]);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current = [...undoStackRef.current, grid.map(r => [...r])];
    setGrid(next);
    setHistoryVersion(v => v + 1);
  }, [grid]);

  const handleResize = useCallback((newWidth: number, newHeight?: number) => {
    const finalHeight = newHeight || newWidth;
    if (grid.some(row => row.some(c => c !== '#FFFFFF'))) {
      if (!confirm("更改尺寸将清空当前画布，确定吗？")) return;
    }
    undoStackRef.current = [];
    redoStackRef.current = [];
    setGridWidth(newWidth);
    setGridHeight(finalHeight);
    setGrid(Array(finalHeight).fill(null).map(() => Array(newWidth).fill('#FFFFFF')));
    setPanOffset({ x: 0, y: 0 });
    const maxSize = Math.max(newWidth, finalHeight);
    if (maxSize >= 80) setZoom(35);
    else if (maxSize >= 48) setZoom(50);
    else setZoom(80);
    setShowCustomInput(false);
    setCustomWidth('');
    setCustomHeight('');
  }, [grid]);

  const handleCustomSize = useCallback(() => {
    const width = parseInt(customWidth);
    const height = parseInt(customHeight);
    if (isNaN(width) || isNaN(height) || width < 4 || width > 200 || height < 4 || height > 200) {
      alert('请输入 4-200 之间的数字');
      return;
    }
    handleResize(width, height);
  }, [customWidth, customHeight, handleResize]);

  const resetGrid = useCallback(() => {
    if (confirm("确定要清空画布吗？")) {
      pushUndo(gridRef.current);
      setGrid(Array(gridHeight).fill(null).map(() => Array(gridWidth).fill('#FFFFFF')));
      setPanOffset({ x: 0, y: 0 });
    }
  }, [gridWidth, gridHeight, pushUndo]);

  const processImageToGrid = useCallback((imageSrc: string, width: number, height: number, xAlign: number = 0, yAlign: number = 0, customCrop?: { x: number; y: number; width: number; height: number }) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let sourceX = 0;
      let sourceY = 0;
      let sourceDrawWidth = img.width;
      let sourceDrawHeight = img.height;

      if (customCrop) {
        sourceX = customCrop.x;
        sourceY = customCrop.y;
        sourceDrawWidth = customCrop.width;
        sourceDrawHeight = customCrop.height;
      } else {
        const targetRatio = width / height;
        const sourceRatio = img.width / img.height;

        if (sourceRatio > targetRatio) {
          sourceDrawWidth = img.height * targetRatio;
          sourceDrawHeight = img.height;
          if (xAlign === -1) sourceX = 0;
          else if (xAlign === 1) sourceX = img.width - sourceDrawWidth;
          else sourceX = (img.width - sourceDrawWidth) / 2;
        } else {
          sourceDrawWidth = img.width;
          sourceDrawHeight = img.width / targetRatio;
          if (yAlign === -1) sourceY = 0;
          else if (yAlign === 1) sourceY = img.height - sourceDrawHeight;
          else sourceY = (img.height - sourceDrawHeight) / 2;
        }
      }

      ctx.drawImage(img, sourceX, sourceY, sourceDrawWidth, sourceDrawHeight, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height).data;
      
      const newGrid: string[][] = [];
      for (let i = 0; i < height; i++) {
        const row: string[] = [];
        for (let j = 0; j < width; j++) {
          const index = (i * width + j) * 4;
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
      pushUndo(gridRef.current);
      setGrid(newGrid);
      setPendingImage(null);
      setIsProcessingImage(false);
    };
    img.src = imageSrc;
  }, [pushUndo]);

  const handleCopySelection = useCallback(() => {
    if (!selection) return;
    const { startRow, startCol, endRow, endCol } = selection;
    const rMin = Math.min(startRow, endRow);
    const rMax = Math.max(startRow, endRow);
    const cMin = Math.min(startCol, endCol);
    const cMax = Math.max(startCol, endCol);

    const copiedGrid: string[][] = [];
    for (let r = rMin; r <= rMax; r++) {
      const row: string[] = [];
      for (let c = cMin; c <= cMax; c++) {
        row.push(grid[r][c]);
      }
      copiedGrid.push(row);
    }
    setClipboard(copiedGrid);
    alert('已复制选区内容');
  }, [selection, grid]);

  const handleCutSelection = useCallback(() => {
    if (!selection) return;
    const { startRow, startCol, endRow, endCol } = selection;
    const rMin = Math.min(startRow, endRow);
    const rMax = Math.max(startRow, endRow);
    const cMin = Math.min(startCol, endCol);
    const cMax = Math.max(startCol, endCol);

    const copiedGrid: string[][] = [];
    for (let r = rMin; r <= rMax; r++) {
      const row: string[] = [];
      for (let c = cMin; c <= cMax; c++) {
        row.push(grid[r][c]);
      }
      copiedGrid.push(row);
    }
    setClipboard(copiedGrid);

    pushUndo(gridRef.current);
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      for (let r = rMin; r <= rMax; r++) {
        for (let c = cMin; c <= cMax; c++) {
          newGrid[r][c] = '#FFFFFF';
        }
      }
      return newGrid;
    });
    setSelection(null);
    alert('已剪切选区内容');
  }, [selection, grid, pushUndo]);

  const handlePasteSelection = useCallback((pasteRow: number, pasteCol: number) => {
    if (!clipboard) return;
    const clipboardHeight = clipboard.length;
    const clipboardWidth = clipboard[0].length;

    pushUndo(gridRef.current);
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      for (let r = 0; r < clipboardHeight; r++) {
        for (let c = 0; c < clipboardWidth; c++) {
          const targetRow = pasteRow + r;
          const targetCol = pasteCol + c;
          if (targetRow >= 0 && targetRow < gridHeight && targetCol >= 0 && targetCol < gridWidth) {
            newGrid[targetRow][targetCol] = clipboard[r][c];
          }
        }
      }
      return newGrid;
    });
    alert('已粘贴内容');
  }, [clipboard, gridHeight, gridWidth, pushUndo]);

  const handleInvertSelection = useCallback(() => {
    if (!selection) return;
    const { startRow, startCol, endRow, endCol } = selection;
    const rMin = Math.min(startRow, endRow);
    const rMax = Math.max(startRow, endRow);
    const cMin = Math.min(startCol, endCol);
    const cMax = Math.max(startCol, endCol);

    pushUndo(gridRef.current);
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      for (let r = rMin; r <= rMax; r++) {
        for (let c = cMin; c <= cMax; c++) {
          if (newGrid[r][c] === '#FFFFFF') {
            newGrid[r][c] = selectedColor;
          } else {
            newGrid[r][c] = '#FFFFFF';
          }
        }
      }
      return newGrid;
    });
  }, [selection, selectedColor, pushUndo]);

  const handleExcludeColorFromSelection = useCallback(() => {
    if (!selection) return;
    const { startRow, startCol, endRow, endCol } = selection;
    const rMin = Math.min(startRow, endRow);
    const rMax = Math.max(startRow, endRow);
    const cMin = Math.min(startCol, endCol);
    const cMax = Math.max(startCol, endCol);

    pushUndo(gridRef.current);
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      for (let r = rMin; r <= rMax; r++) {
        for (let c = cMin; c <= cMax; c++) {
          if (newGrid[r][c] === selectedColor) {
            newGrid[r][c] = '#FFFFFF';
          }
        }
      }
      return newGrid;
    });
  }, [selection, selectedColor, pushUndo]);

  const handleClearSelection = useCallback(() => {
    if (!selection) return;
    const { startRow, startCol, endRow, endCol } = selection;
    const rMin = Math.min(startRow, endRow);
    const rMax = Math.max(startRow, endRow);
    const cMin = Math.min(startCol, endCol);
    const cMax = Math.max(startCol, endCol);

    pushUndo(gridRef.current);
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      for (let r = rMin; r <= rMax; r++) {
        for (let c = cMin; c <= cMax; c++) {
          newGrid[r][c] = '#FFFFFF';
        }
      }
      return newGrid;
    });
    setSelection(null);
  }, [selection, pushUndo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isColorPickerOpen || isShortcutsOpen || helpModalOpen) return;
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'SELECT' || (activeElement as HTMLElement)?.isContentEditable;
      if (isInputFocused) return;
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        handleCopySelection();
        return;
      }
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        const { startRow, startCol } = selection || { startRow: Math.floor(gridHeight / 2), startCol: Math.floor(gridWidth / 2) };
        handlePasteSelection(startRow, startCol);
        return;
      }
      if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        handleCutSelection();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selection) {
          handleClearSelection();
        }
        return;
      }
      if (e.key === '[') {
        e.preventDefault();
        setBrushSize(prev => Math.max(1, prev - 1));
        return;
      }
      if (e.key === ']') {
        e.preventDefault();
        setBrushSize(prev => Math.min(5, prev + 1));
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
  }, [isColorPickerOpen, isShortcutsOpen, helpModalOpen, undo, redo, handleCopySelection, handlePasteSelection, handleCutSelection, handleClearSelection, selection, gridHeight, gridWidth]);

  const handleCanvasAction = useCallback((row: number, col: number, backgroundColor?: string | null) => {
    if (currentTool === ToolType.PICKER) {
      const colorAt = grid[row][col];
      if (colorAt && colorAt !== '#FFFFFF') {
        setSelectedColor(colorAt);
        setCurrentTool(ToolType.PENCIL);
      }
      return;
    }

    const shapeTools = [ToolType.LINE, ToolType.RECT, ToolType.CIRCLE];
    if (shapeTools.includes(currentTool)) {
      if (!shapeStart) {
        setShapeStart({ row, col });
        return;
      }
      const { row: r1, col: c1 } = shapeStart;
      const cells = currentTool === ToolType.LINE ? getLineCells(r1, c1, row, col)
        : currentTool === ToolType.RECT ? getRectCells(r1, c1, row, col)
        : getCircleCells(r1, c1, row, col);
      setGrid(prev => {
        pushUndo(prev);
        const newGrid = prev.map(r => [...r]);
        const color = selectedColor;
        for (const [r, c] of cells) {
          if (r >= 0 && r < gridHeight && c >= 0 && c < gridWidth) newGrid[r][c] = color;
        }
        return newGrid;
      });
      setShapeStart(null);
      return;
    }

    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      
      let colorToUse = selectedColor;

      if (currentTool === ToolType.SMART_PENCIL && backgroundColor) {
        const availableColors: Array<{ hex: ColorHex; key: string }> = [];
        Object.entries(colorSystemMapping).forEach(([hex, mapping]) => {
          const colorKey = mapping[selectedColorSystem];
          if (colorKey && !colorKey.startsWith('#')) {
            availableColors.push({ hex: hex as ColorHex, key: colorKey });
          }
        });
        
        const closest = findClosestColor(backgroundColor, availableColors);
        if (closest) {
          colorToUse = closest.hex;
        }
      }
      
      const isEven = brushSize % 2 === 0;
      const cellsToDraw: [number, number][] = [];

      if (isEven) {
        // 偶数大小：以左上角为基准
        for (let r = 0; r < brushSize; r++) {
          for (let c = 0; c < brushSize; c++) {
            cellsToDraw.push([row + r, col + c]);
          }
        }
      } else {
        // 奇数大小：以中心点为基准
        const brushOffset = Math.floor(brushSize / 2);
        for (let r = -brushOffset; r <= brushOffset; r++) {
          for (let c = -brushOffset; c <= brushOffset; c++) {
            cellsToDraw.push([row + r, col + c]);
          }
        }
      }

      let shouldDraw = false;

      if (currentTool === ToolType.PENCIL || currentTool === ToolType.SMART_PENCIL) {
        for (const [r, c] of cellsToDraw) {
          if (r >= 0 && r < gridHeight && c >= 0 && c < gridWidth) {
            if (newGrid[r][c] !== colorToUse) {
              shouldDraw = true;
              break;
            }
          }
        }
        if (!shouldDraw) return prev;
        pushUndo(prev);
        for (const [r, c] of cellsToDraw) {
          if (r >= 0 && r < gridHeight && c >= 0 && c < gridWidth) {
            newGrid[r][c] = colorToUse;
          }
        }
      } else if (currentTool === ToolType.ERASER) {
        for (const [r, c] of cellsToDraw) {
          if (r >= 0 && r < gridHeight && c >= 0 && c < gridWidth) {
            if (newGrid[r][c] !== '#FFFFFF') {
              shouldDraw = true;
              break;
            }
          }
        }
        if (!shouldDraw) return prev;
        pushUndo(prev);
        for (const [r, c] of cellsToDraw) {
          if (r >= 0 && r < gridHeight && c >= 0 && c < gridWidth) {
            newGrid[r][c] = '#FFFFFF';
          }
        }
      } else if (currentTool === ToolType.FILL) {
        const targetColor = prev[row][col];
        const fillColor = selectedColor;
        if (targetColor === fillColor) return prev;
        pushUndo(prev);
        const stack = [[row, col]];
        const visited = new Set<string>();
        while (stack.length > 0) {
          const [r, c] = stack.pop()!;
          const key = `${r},${c}`;
          if (r < 0 || r >= gridHeight || c < 0 || c >= gridWidth || newGrid[r][c] !== targetColor || visited.has(key)) continue;
          newGrid[r][c] = fillColor;
          visited.add(key);
          stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
        }
      }
      return newGrid;
    });
  }, [selectedColor, currentTool, gridWidth, gridHeight, grid, shapeStart, getLineCells, getRectCells, getCircleCells, pushUndo, selectedColorSystem, brushSize]);

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
    if (!aiPrompt.trim() && !aiReferenceImage) {
      alert('请输入描述或上传参考图片');
      return;
    }

    setIsGenerating(true);
    try {
      const base64 = await generatePixelArtImage(aiPrompt, aiReferenceImage || undefined);
      processImageToGrid(base64, gridWidth, gridHeight, 0, 0);
      setAiGeneratedImage(base64);
      setAiPrompt('');
      setAiReferenceImage(null);
    } catch (error) {
      console.error('AI generation error:', error);
      alert(`生成失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiReferenceImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAiReferenceImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const handleSaveGeneratedImage = async () => {
    if (!aiGeneratedImage) return;
    const fileName = `pixel-bead-ai-generated-${Date.now()}.png`;
    try {
      const resp = await fetch(aiGeneratedImage);
      const blob = await resp.blob();
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], fileName, { type: 'image/png' })] })) {
        await navigator.share({ files: [new File([blob], fileName, { type: 'image/png' })] });
        return;
      }
    } catch { /* fallback below */ }
    const a = document.createElement('a');
    a.href = aiGeneratedImage;
    a.download = fileName;
    a.click();
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setPendingImage(e.target?.result as string);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const onImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        const importWidth = data.gridSize || data.gridWidth || 32;
        const importHeight = data.gridHeight || data.gridSize || 32;

        if (data.grid && (data.gridSize || data.gridWidth)) {
          if (importWidth !== gridWidth || importHeight !== gridHeight) {
            if (!confirm(`导入的画布大小为 ${importWidth}x${importHeight}，当前为 ${gridWidth}x${gridHeight}。是否切换尺寸并导入？`)) {
              return;
            }
            setGridWidth(importWidth);
            setGridHeight(importHeight);
          }
          pushUndo(gridRef.current);
          setGrid(data.grid);
          setPanOffset({ x: 0, y: 0 });
        } else {
          alert('无效的文件格式');
        }
      } catch (error) {
        alert('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleBackgroundImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;

      // 加载图片以获取原始宽高
      const img = new Image();
      img.onload = () => {
        const baseBeadSize = 28;
        const cellSize = baseBeadSize * (zoom / 100);

        const canvasWidth = gridWidth * cellSize;
        const canvasHeight = gridHeight * cellSize;

        // 计算合适的缩放比例，使图片适配画板（不拉伸）
        const scaleX = canvasWidth / img.width;
        const scaleY = canvasHeight / img.height;
        const autoScale = Math.min(scaleX, scaleY);

        setBackgroundImage({
          src,
          x: 0,
          y: 0,
          scale: autoScale,
          opacity: 0.5,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleBackgroundImageDrag = useCallback((deltaX: number, deltaY: number) => {
    if (backgroundImage) {
      const baseBeadSize = 28;
      const zoomRatio = (baseBeadSize * (zoom / 100)) / baseBeadSize;

      setBackgroundImage({
        ...backgroundImage,
        x: backgroundImage.x + deltaX / zoomRatio,
        y: backgroundImage.y + deltaY / zoomRatio,
      });
    }
  }, [backgroundImage, zoom, setBackgroundImage]);

  const handleExportImage = useCallback(() => {
    const hasContent = grid.some(row => row.some(c => c !== '#FFFFFF'));
    if (!hasContent) {
      alert('画布为空，无法导出图片');
      return;
    }

    setExportPixelStyle(pixelStyle);
    setExportModalOpen(true);
  }, [grid, gridWidth, gridHeight, pixelStyle]);

  const handleConfirmExport = useCallback(async () => {
    let exportGrid = grid;
    let exportWidth = gridWidth;
    let exportHeight = gridHeight;

    if (exportSelectionOnly && selection) {
      const { startRow, startCol, endRow, endCol } = selection;
      const rMin = Math.min(startRow, endRow);
      const rMax = Math.max(startRow, endRow);
      const cMin = Math.min(startCol, endCol);
      const cMax = Math.max(startCol, endCol);

      exportGrid = [];
      for (let r = rMin; r <= rMax; r++) {
        const row: string[] = [];
        for (let c = cMin; c <= cMax; c++) {
          row.push(grid[r][c]);
        }
        exportGrid.push(row);
      }
      exportWidth = cMax - cMin + 1;
      exportHeight = rMax - rMin + 1;
    }

    const canvas = await generateExportImage({
      grid: exportGrid,
      gridWidth: exportWidth,
      gridHeight: exportHeight,
      pixelStyle: exportPixelStyle,
      colorSystem: selectedColorSystem,
      colorSystemMapping: colorSystemMapping as Record<string, Record<string, string>>,
      showGuideLines: exportShowGuideLines,
      mirror: exportMirror,
    });

    const fileName = exportSelectionOnly ? `pixel-bead-${exportWidth}x${exportHeight}-selection.png` : (exportMirror ? `pixel-bead-${gridWidth}x${gridHeight}-mirrored.png` : `pixel-bead-${gridWidth}x${gridHeight}.png`);

    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
    const url = URL.createObjectURL(blob);

    setExportPreviewUrl(url);
    setExportPreviewBlob(blob);
    setExportPreviewName(fileName);
    setExportModalOpen(false);
  }, [grid, gridWidth, gridHeight, exportPixelStyle, exportShowGuideLines, exportMirror, selectedColorSystem, exportSelectionOnly, selection]);

  const handleShareImageExport = useCallback(async () => {
    const canvas = await generateShareImage({
      grid, gridWidth, gridHeight,
      pixelStyle: exportPixelStyle,
    });
    const fileName = `share-${gridWidth}x${gridHeight}.png`;
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
    const url = URL.createObjectURL(blob);

    const caption = generateShareCaption(gridWidth, gridHeight, getUniqueColors(grid).length);
    try { await navigator.clipboard.writeText(caption); } catch {}

    setExportPreviewUrl(url);
    setExportPreviewBlob(blob);
    setExportPreviewName(fileName);
    setExportModalOpen(false);
  }, [grid, gridWidth, gridHeight, exportPixelStyle]);

  const baseBeadSize = 28;
  const boardDimension = Math.max(gridWidth, gridHeight) * (baseBeadSize * (zoom / 100));

  const presetSizes = [16, 32, 48, 64, 80, 100];

  const [expandedColorGroups, setExpandedColorGroups] = useState<Set<string>>(new Set());

  const paletteGroups = useMemo(() => {
    const groups: Map<string, Array<{ hex: ColorHex; key: string }>> = new Map();

    Object.entries(colorSystemMapping).forEach(([hex, mapping]) => {
      const colorKey = mapping[selectedColorSystem];
      if (colorKey && !colorKey.startsWith('#')) {
        const prefix = colorKey.charAt(0);
        if (!groups.has(prefix)) {
          groups.set(prefix, []);
        }
        groups.get(prefix)!.push({ hex: hex as ColorHex, key: colorKey });
      }
    });

    const sortedGroups: Array<{ letter: string; colors: Array<{ hex: ColorHex; key: string }> }> = [];
    groups.forEach((colors, letter) => {
      colors.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
      sortedGroups.push({ letter, colors });
    });

    return sortedGroups.sort((a, b) => a.letter.localeCompare(b.letter));
  }, [selectedColorSystem]);

  const toggleColorGroup = (letter: string) => {
    setExpandedColorGroups(prev => {
      const next = new Set(prev);
      if (next.has(letter)) {
        next.delete(letter);
      } else {
        next.add(letter);
      }
      return next;
    });
  };

  const paletteColors = useMemo(() => {
    const allColors: Array<{ hex: ColorHex; key: string }> = [];
    paletteGroups.forEach(group => {
      allColors.push(...group.colors);
    });
    return allColors;
  }, [paletteGroups]);

  const allColors = useMemo(() => {
    const colorSet = new Set<ColorHex>([...DEFAULT_COLORS]);
    stats.forEach(item => colorSet.add(item.hex));
    return Array.from(colorSet);
  }, [stats]);

  const getColorKey = useCallback((hex: string): string => {
    if (!showColorKeys || hex === '#FFFFFF') return '';
    const mapping = colorSystemMapping[hex];
    return mapping ? mapping[selectedColorSystem] || hex : hex;
  }, [showColorKeys, selectedColorSystem]);

  const handleMergeSimilarColors = useCallback(() => {
    if (!confirm('合并相似颜色将修改当前画布，确定吗？')) return;

    const currentColors = createPaletteFromGrid(grid);
    const mergedColors = mergeSimilarColors(currentColors, mergeThreshold);

    setGrid(prev => mapColorsToPalette(prev, mergedColors));
    pushUndo(gridRef.current);
  }, [grid, mergeThreshold, pushUndo]);

  const handleMapToPalette = useCallback(() => {
    if (!confirm('映射到色板将把所有颜色转换为色板中最接近的颜色，确定吗？')) return;

    // 根据选择的色板预设确定最大颜色数
    let maxColors: number | undefined;
    if (selectedPalettePreset !== 'all' && selectedPalettePreset !== 'custom') {
      maxColors = parseInt(selectedPalettePreset);
    }

    const fullPalette = createFullPaletteFromMapping(colorSystemMapping, selectedColorSystem, maxColors);

    setGrid(prev => mapColorsToPalette(prev, fullPalette));
    pushUndo(gridRef.current);
  }, [selectedPalettePreset, selectedColorSystem, pushUndo]);

  const handleShare = useCallback(async () => {
    const hasContent = grid.some(row => row.some(c => c !== '#FFFFFF'));
    if (!hasContent) {
      alert('画布为空，无法分享');
      return;
    }

    if (shareToGallery) {
      if (!materialTitle.trim()) {
        alert('请输入素材名称');
        return;
      }
      if (!materialAuthor.trim()) {
        alert('请输入作者名称');
        return;
      }

      const tags = normalizeTags(materialTags)
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      setIsPublishing(true);
      try {
        const key = await saveMaterial(
          grid,
          gridWidth,
          gridHeight,
          pixelStyle,
          materialTitle,
          materialDescription,
          materialAuthor,
          tags
        );
        if (key) {
          alert('素材已成功发布到广场！');
          setShareModalOpen(false);
          setMaterialTitle('');
          setMaterialDescription('');
          setMaterialAuthor('');
          setMaterialTags('');
          setShareToGallery(false);
        } else {
          alert('发布失败，请检查网络连接或稍后重试');
        }
      } catch (error) {
        console.error('发布失败:', error);
        alert('发布失败，请检查网络连接或稍后重试');
      } finally {
        setIsPublishing(false);
      }
    } else {
      setIsSharing(true);
      try {
        const key = await saveToUpstash(grid, gridWidth, gridHeight, pixelStyle);
        if (key) {
          const url = generateShareUrl(key, 'https://pindou.danzaii.cn');
          setShareUrl(url);
          setShareModalOpen(true);
        } else {
          alert('分享失败，请检查网络连接或稍后重试');
        }
      } catch (error) {
        console.error('分享失败:', error);
        alert('分享失败，请检查网络连接或稍后重试');
      } finally {
        setIsSharing(false);
      }
    }
  }, [grid, gridWidth, gridHeight, pixelStyle, shareToGallery, materialTitle, materialDescription, materialAuthor, materialTags]);

  const copyShareUrl = useCallback(() => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      alert('链接已复制到剪贴板！');
    }
  }, [shareUrl]);

  const handlePalettePresetChange = useCallback((preset: string) => {
    setSelectedPalettePreset(preset);

    if (preset !== 'custom' && preset !== 'all') {
      const maxColors = parseInt(preset);

      if (confirm(`当前颜色将被映射到 ${maxColors} 色的色板，确定吗？`)) {
        // 从色板映射数据中创建指定数量的色板
        const targetPalette = createFullPaletteFromMapping(colorSystemMapping, selectedColorSystem, maxColors);
        setGrid(prev => mapColorsToPalette(prev, targetPalette));
        pushUndo(gridRef.current);
      }
    }
  }, [grid, selectedColorSystem, pushUndo]);

  const normalizeTags = useCallback((value: string): string => {
    return value.replace(/[\uFF0C\uFF0C\u3002]/g, ',');
  }, []);

  const displayStats = useMemo(() => {
    return stats.map(item => ({
      ...item,
      key: getColorKey(item.hex),
    }));
  }, [stats, getColorKey]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9] text-slate-900 select-none overflow-hidden h-screen">
      <header className="bg-white border-b border-slate-200 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2 z-[100] shadow-sm shrink-0 overflow-x-auto overflow-y-hidden no-scrollbar">
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => setIsMobileLeftOpen(!isMobileLeftOpen)}
            className="lg:hidden p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0">
            <img src="/logo.jpg" alt="拼豆糕手 Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-black text-lg md:text-xl text-slate-800 italic hidden sm:block">拼豆糕手</h1>
          <span className="text-[10px] font-bold text-slate-400 lg:hidden">{gridWidth}x{gridHeight}</span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden lg:flex bg-slate-100 p-1 rounded-xl">
            {presetSizes.slice(0, 4).map(size => (
              <button
                key={size}
                onClick={() => handleResize(size)}
                className={`px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black transition-all ${gridWidth === size && gridHeight === size ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
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
            <div className="hidden lg:flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm">
              <input
                type="number"
                min="4"
                max="200"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                placeholder="宽"
                className="w-14 px-2 py-1.5 text-xs font-black text-center border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
              />
              <span className="text-slate-400">x</span>
              <input
                type="number"
                min="4"
                max="200"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                placeholder="高"
                className="w-14 px-2 py-1.5 text-xs font-black text-center border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleCustomSize}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 transition-all"
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

          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
            {VIEW_TYPES.map(view => (
              <button
                key={view.value}
                onClick={() => setViewType(view.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${viewType === view.value ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                title={view.name}
              >
                <span>{view.icon}</span>
                <span className="hidden xl:inline">{view.name}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-1 md:gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 md:p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
              title="撤销 (Ctrl+Z)"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 md:p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
              title="重做 (Ctrl+Shift+Z)"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>
            <input type="file" accept=".json" className="hidden" ref={importFileRef} onChange={onImportFile} />
            <button 
              onClick={() => importFileRef.current?.click()}
              className="hidden md:flex bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-bold text-xs transition-all items-center gap-2"
              title="导入项目"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              <span className="hidden sm:inline">导入</span>
            </button>
            <button
              onClick={async () => {
                const data = JSON.stringify({ grid, gridWidth, gridHeight });
                const blob = new Blob([data], { type: 'application/json' });
                const fileName = `pixel-bead-${gridWidth}x${gridHeight}.json`;
                if (navigator.share && navigator.canShare?.({ files: [new File([blob], fileName, { type: 'application/json' })] })) {
                  try { await navigator.share({ files: [new File([blob], fileName, { type: 'application/json' })] }); } catch {}
                } else {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fileName;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className="hidden md:flex bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-xl font-bold text-xs transition-all items-center gap-2"
              title="导出项目"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              <span className="hidden sm:inline">导出</span>
            </button>
            <button
              onClick={handleExportImage}
              className="hidden md:flex bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 items-center gap-2"
              title="导出图片"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span className="hidden sm:inline">导出图片</span>
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="hidden md:flex bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="分享链接"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">{isSharing ? '生成中...' : '分享'}</span>
            </button>
            <button
              onClick={() => setMaterialGalleryOpen(true)}
              className="hidden md:flex bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 items-center gap-2"
              title="素材广场"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="hidden sm:inline">广场</span>
             </button>
             <button
               onClick={() => setIsPlannerViewOpen(true)}
               className="hidden md:flex bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 items-center gap-2"
               title="沉浸拼豆"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <span className="hidden sm:inline">拼豆</span>
             </button>

             <div className="hidden md:flex gap-2">
              <button
                onClick={() => setIsShortcutsOpen(true)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                title="快捷键说明"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setIsMobileRightOpen(!isMobileRightOpen)}
              className="lg:hidden p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`fixed bottom-0 left-0 z-[60] w-80 max-w-[85vw] bg-white border-r border-slate-200 overflow-y-auto no-scrollbar p-4 md:p-6 space-y-4 md:space-y-6 flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out fixed-safe-top ${isMobileLeftOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:transform-none lg:translate-x-0`}>
          <div className="flex justify-between items-center mb-2 lg:hidden">
            <h2 className="text-sm font-black text-slate-900">工具栏</h2>
            <button onClick={() => setIsMobileLeftOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3 lg:hidden">
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">画布尺寸</h2>
            <div className="flex flex-wrap gap-1.5">
              {presetSizes.slice(0, 4).map(size => (
                <button
                  key={size}
                  onClick={() => { handleResize(size); setIsMobileLeftOpen(false); }}
                  className={`px-3 py-2 rounded-lg text-xs font-black transition-all touch-manipulation ${gridWidth === size && gridHeight === size ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}
                >
                  {size}²
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="number" min="4" max="200" value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} placeholder="宽" className="flex-1 px-2 py-2 text-xs font-black text-center border border-slate-200 rounded-lg outline-none focus:border-indigo-500" />
              <span className="text-slate-400 text-xs">x</span>
              <input type="number" min="4" max="200" value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} placeholder="高" className="flex-1 px-2 py-2 text-xs font-black text-center border border-slate-200 rounded-lg outline-none focus:border-indigo-500" />
              <button onClick={() => { handleCustomSize(); setIsMobileLeftOpen(false); }} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black">确定</button>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">像素样式</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {PIXEL_STYLES.map(style => (
                <button
                  key={style.value}
                  onClick={() => setPixelStyle(style.value)}
                  className={`flex-1 px-2 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 touch-manipulation ${pixelStyle === style.value ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title={style.name}
                >
                  <span>{style.icon}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">视图模式</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {VIEW_TYPES.map(view => (
                <button
                  key={view.value}
                  onClick={() => setViewType(view.value)}
                  className={`flex-1 px-2 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 touch-manipulation ${viewType === view.value ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title={view.name}
                >
                  <span>{view.icon}</span>
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
            <p className="text-[9px] text-slate-500 leading-snug lg:hidden">
              底部为快捷入口；侧栏含全部工具（直线、矩形、圆形等）
            </p>
            <div className="grid grid-cols-3 gap-2">
              {TOOLS_INFO.map(tool => (
                <button
                  key={tool.type}
                  onClick={() => {
                    setCurrentTool(tool.type);
                    setIsMobileLeftOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl border-2 transition-all touch-manipulation ${currentTool === tool.type ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100'}`}
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
              <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">画笔大小</h2>
              <span className="text-[9px] text-indigo-600 font-bold">{brushSize}x{brushSize}</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {BRUSH_SIZES.map(size => (
                <button
                  key={size.value}
                  onClick={() => setBrushSize(size.value)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-black transition-all ${brushSize === size.value ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  title={`${size.name} 画笔`}
                >
                  {size.value}
                </button>
              ))}
            </div>
          </div>

          {selection && (
            <div className="space-y-3 bg-indigo-50 rounded-3xl p-4 border-2 border-indigo-200">
              <div className="flex justify-between items-center">
                <h2 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">框选操作</h2>
                <button
                  onClick={() => setSelection(null)}
                  className="text-[8px] text-indigo-400 hover:text-red-500 font-black"
                >
                  ✕ 清除选区
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopySelection}
                  className="px-3 py-2 bg-white text-indigo-700 rounded-lg text-[9px] font-black hover:bg-indigo-100 transition-all shadow-sm flex items-center justify-center gap-1"
                >
                  <span>📋</span> 复制
                </button>
                <button
                  onClick={() => {
                    const { startRow, startCol } = selection;
                    handlePasteSelection(startRow, startCol);
                  }}
                  className="px-3 py-2 bg-white text-indigo-700 rounded-lg text-[9px] font-black hover:bg-indigo-100 transition-all shadow-sm flex items-center justify-center gap-1"
                >
                  <span>📝</span> 粘贴
                </button>
                <button
                  onClick={handleCutSelection}
                  className="px-3 py-2 bg-white text-indigo-700 rounded-lg text-[9px] font-black hover:bg-indigo-100 transition-all shadow-sm flex items-center justify-center gap-1"
                >
                  <span>✂️</span> 剪切
                </button>
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-2 bg-white text-indigo-700 rounded-lg text-[9px] font-black hover:bg-indigo-100 transition-all shadow-sm flex items-center justify-center gap-1"
                >
                  <span>🗑️</span> 清除
                </button>
                <button
                  onClick={handleInvertSelection}
                  className="px-3 py-2 bg-white text-indigo-700 rounded-lg text-[9px] font-black hover:bg-indigo-100 transition-all shadow-sm flex items-center justify-center gap-1 col-span-2"
                >
                  <span>🔄</span> 反选（白色→当前色，其他→白色）
                </button>
                <button
                  onClick={handleExcludeColorFromSelection}
                  className="px-3 py-2 bg-white text-indigo-700 rounded-lg text-[9px] font-black hover:bg-indigo-100 transition-all shadow-sm flex items-center justify-center gap-1 col-span-2"
                >
                  <span>🚫</span> 排除当前色（将当前色替换为白色）
                </button>
              </div>
            </div>
          )}

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
                placeholder="#RRGGBB (自定义颜色)"
              />
            </div>
             <div className="space-y-2">
              {paletteGroups.map(({ letter, colors }) => {
                const isExpanded = expandedColorGroups.has(letter);
                const displayColors = isExpanded ? colors : colors.slice(0, 6);

                return (
                  <div key={letter} className="space-y-1">
                    <button
                      onClick={() => toggleColorGroup(letter)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                    >
                      <span className="text-xs font-bold text-slate-700">{letter}</span>
                      <span className="text-[9px] text-slate-500">{isExpanded ? `${colors.length} 个颜色` : `展开更多 (${colors.length - 6})`}</span>
                      <svg 
                        className={`ml-auto w-3 h-3 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className={`grid grid-cols-5 md:grid-cols-6 gap-1.5 ${isExpanded ? 'max-h-40 overflow-y-auto' : ''}`}>
                      {displayColors.map(({ hex, key }) => (
                        <button
                          key={hex}
                          onClick={() => {
                            setSelectedColor(hex);
                            if (currentTool === ToolType.ERASER || currentTool === ToolType.PICKER) setCurrentTool(ToolType.PENCIL);
                          }}
                          className={`relative aspect-square rounded-full border-2 transition-all hover:scale-110 ${selectedColor === hex ? 'border-indigo-600 scale-110 ring-2 ring-indigo-100' : 'border-white'}`}
                          style={{ backgroundColor: hex }}
                          title={`${key}: ${hex}`}
                        >
                          {isExpanded && (
                            <span className="absolute bottom-0.5 right-0.5 text-[7px] font-bold text-white/90 drop-shadow-md">{key}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-4 md:p-5 text-white shadow-xl space-y-2 md:space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <span className="animate-pulse">✨</span> 智能生成拼豆图
            </h2>
            <p className="text-[9px] text-white/50 leading-relaxed">
              由拼豆糕手自研的智能生成服务免费提供，输入描述或参考图即可生成拼豆风格示意图，生成结果可再导入画布微调。
            </p>
            {aiReferenceImage && (
              <div className="relative">
                <img
                  src={aiReferenceImage}
                  alt="参考图片"
                  className="w-full h-24 object-contain rounded-lg bg-white/10"
                />
                <button
                  onClick={() => setAiReferenceImage(null)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            )}
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={aiReferenceImage ? "描述如何修改这张图片（可选）" : "例如: 可爱的像素风猫咪"}
              className="w-full h-16 md:h-20 p-2 md:p-3 rounded-xl bg-white/5 border border-white/10 text-xs placeholder:text-white/20 focus:bg-white/10 outline-none resize-none"
            />
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={aiReferenceImageRef}
                onChange={handleAiReferenceImageUpload}
              />
              <button
                onClick={() => aiReferenceImageRef.current?.click()}
                className="flex-1 py-2 md:py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                📷 {aiReferenceImage ? '更换图片' : '上传参考图'}
              </button>
              <button
                onClick={handleAiGenerate}
                disabled={isGenerating || (!aiPrompt.trim() && !aiReferenceImage)}
                className="flex-1 py-2 md:py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-black text-xs transition-all active:scale-95 flex justify-center items-center"
              >
                {isGenerating ? "正在魔法创作..." : "一键生成拼豆图"}
              </button>
            </div>
            {aiGeneratedImage && (
              <button
                onClick={handleSaveGeneratedImage}
                className="w-full py-2 md:py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                💾 保存生成原图
              </button>
            )}
            {aiReferenceImage ? (
              <p className="text-[9px] text-emerald-400/80 text-center">
                ✓ 已上传参考图，将结合描述生成拼豆风格图稿
              </p>
            ) : (
              <p className="text-[9px] text-white/50 text-center">
                提示：上传参考图时，可再写一句希望如何调整画面（可选）
              </p>
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

          <div className="bg-purple-600 rounded-3xl p-4 md:p-5 text-white shadow-xl space-y-2 md:space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-white">色板设置</h2>
              <button
                onClick={() => setIsPalettePanelOpen(!isPalettePanelOpen)}
                className="text-[8px] text-white/80 hover:text-white transition-all"
              >
                {isPalettePanelOpen ? '▼' : '▶'}
              </button>
            </div>

            {isPalettePanelOpen && (
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-white mb-1 block">色板预设</label>
                  <select
                    value={selectedPalettePreset}
                    onChange={(e) => handlePalettePresetChange(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-[10px] font-bold outline-none focus:border-white/40"
                    style={{ color: 'white' }}
                  >
                    {PALETTE_PRESETS.map(preset => (
                      <option key={preset.id} value={preset.id} style={{ backgroundColor: 'white', color: '#4c1d95' }}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-white mb-1 block">色号系统</label>
                  <select
                    value={selectedColorSystem}
                    onChange={(e) => setSelectedColorSystem(e.target.value as ColorSystem)}
                    className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg text-[10px] font-bold outline-none focus:border-white/40"
                    style={{ color: 'white' }}
                  >
                    {colorSystemOptions.map(system => (
                      <option key={system.key} value={system.key} style={{ backgroundColor: 'white', color: '#4c1d95' }}>
                        {system.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-bold text-white">合并阈值</label>
                    <span className="text-[9px] text-white/90">{Math.round(mergeThreshold * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={mergeThreshold}
                    onChange={(e) => setMergeThreshold(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showColorKeys"
                    checked={showColorKeys}
                    onChange={(e) => setShowColorKeys(e.target.checked)}
                    className="w-3 h-3 rounded border-2 border-white/40"
                  />
                  <label htmlFor="showColorKeys" className="text-[9px] font-bold text-white">显示色号</label>
                </div>

                <button
                  onClick={handleMergeSimilarColors}
                  className="w-full py-2 md:py-2.5 bg-white text-purple-600 rounded-xl font-black text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  合并相似颜色
                </button>

                <button
                  onClick={handleMapToPalette}
                  className="w-full py-2 md:py-2.5 bg-purple-200 text-purple-800 rounded-xl font-black text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  映射到色板
                </button>
              </div>
            )}
          </div>

          <div className="bg-blue-600 rounded-3xl p-4 md:p-5 text-white shadow-xl space-y-2 md:space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-white">底图参考</h2>
            </div>

            <input type="file" accept="image/*" className="hidden" ref={backgroundImageRef} onChange={handleBackgroundImageUpload} />
            <button
              onClick={() => backgroundImageRef.current?.click()}
              className="w-full py-2 md:py-2.5 bg-white text-blue-600 rounded-xl font-black text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              {backgroundImage ? '更换底图' : '导入底图'}
            </button>

            {backgroundImage && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-bold text-white">透明度</label>
                    <span className="text-[9px] text-white/90">{Math.round(backgroundImage.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={backgroundImage.opacity}
                    onChange={(e) => setBackgroundImage({ ...backgroundImage, opacity: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-bold text-white">缩放</label>
                    <span className="text-[9px] text-white/90">{Math.round(backgroundImage.scale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.01"
                    value={backgroundImage.scale}
                    onChange={(e) => setBackgroundImage({ ...backgroundImage, scale: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setBackgroundImage({ ...backgroundImage, x: backgroundImage.x - 10 })}
                    className="flex-1 py-2 md:py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-xs transition-all"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setBackgroundImage({ ...backgroundImage, x: backgroundImage.x + 10 })}
                    className="flex-1 py-2 md:py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-xs transition-all"
                  >
                    →
                  </button>
                  <button
                    onClick={() => setBackgroundImage({ ...backgroundImage, y: backgroundImage.y - 10 })}
                    className="flex-1 py-2 md:py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-xs transition-all"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => setBackgroundImage({ ...backgroundImage, y: backgroundImage.y + 10 })}
                    className="flex-1 py-2 md:py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-xs transition-all"
                  >
                    ↓
                  </button>
                </div>

                <button
                  onClick={() => setBackgroundImage(null)}
                  className="w-full py-2 md:py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl font-black text-xs transition-all"
                >
                  清除底图
                </button>
              </>
            )}
          </div>

          <div className="bg-slate-200 rounded-3xl p-4 md:p-5 text-slate-800 shadow-xl space-y-2 md:space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600">图层选择</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedLayer('bead')}
                className={`flex-1 py-2 md:py-2.5 rounded-xl font-black text-xs transition-all ${selectedLayer === 'bead' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600'}`}
              >
                拼豆层
              </button>
              <button
                onClick={() => setSelectedLayer('background')}
                className={`flex-1 py-2 md:py-2.5 rounded-xl font-black text-xs transition-all ${selectedLayer === 'background' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600'}`}
              >
                底图层
              </button>
            </div>
          </div>

          <div className="mt-auto pt-4 space-y-2">
            <div className="bg-slate-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">自动保存</span>
                <span className="text-[9px] font-bold text-emerald-500">已启用</span>
              </div>
              <p className="text-[9px] text-slate-400">画布会自动保存，下次打开自动恢复</p>
            </div>
            <button
              onClick={resetGrid}
              className="w-full py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-all"
            >
              清空当前画布
            </button>
            <PromoSection />
          </div>
        </aside>

         <main
          className={`flex-1 bg-[#EBEDF0] relative overflow-hidden ${
            viewType === ViewType.THREE_D || viewType === ViewType.SLICES ? 'max-lg:pb-[var(--app-mobile-tab-bar-height)]' : ''
          }`}
        >
           <div className="absolute top-2 left-2 right-2 md:top-6 md:left-1/2 md:right-auto md:-translate-x-1/2 flex items-center justify-center gap-1 md:gap-4 bg-white/95 backdrop-blur-sm px-2 md:px-6 py-1.5 md:py-2 rounded-2xl md:rounded-full shadow-xl border border-white/50 z-[55] md:z-50 md:max-w-fit">
            <button onClick={() => setZoom(z => Math.max(10, z - 5))} className="p-1 md:p-0 font-black text-slate-400 hover:text-indigo-600 text-base md:text-lg min-w-[28px] min-h-[28px] md:min-w-[36px] md:min-h-[36px] flex items-center justify-center touch-manipulation">－</button>
            <input type="range" min="10" max="300" value={zoom} onChange={(e) => setZoom(parseInt(e.target.value))} className="w-12 md:w-40 h-3 accent-indigo-600 touch-manipulation flex-1 md:flex-initial" />
            <button onClick={() => setZoom(z => Math.min(400, z + 5))} className="p-1 md:p-0 font-black text-slate-400 hover:text-indigo-600 text-base md:text-lg min-w-[28px] min-h-[28px] md:min-w-[36px] md:min-h-[36px] flex items-center justify-center touch-manipulation">＋</button>
            <span className="text-[9px] md:text-[10px] font-black w-8 md:w-12 text-slate-500 text-center shrink-0">{zoom}%</span>
            <div className="h-4 w-px bg-slate-200"></div>
            <button
              onClick={() => setPanOffset({ x: 0, y: 0 })}
              className="text-[9px] md:text-[10px] font-black uppercase px-1.5 md:px-3 py-1 md:py-1.5 rounded-lg text-slate-400 hover:text-indigo-600 touch-manipulation"
              title="回到中央"
            >
              居中
            </button>
            <button 
              onClick={resetGrid}
              className="text-[9px] md:text-[10px] font-black uppercase px-2 md:px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-500 touch-manipulation hidden md:block"
              title="清空画布"
            >
              清空
            </button>
            <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
            <button onClick={() => setShowGridLines(!showGridLines)} className={`text-[9px] md:text-[10px] font-black uppercase px-1.5 md:px-3 py-1 md:py-1.5 rounded-lg touch-manipulation ${showGridLines ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}>
              网格
            </button>
            <button onClick={() => setShowRuler(!showRuler)} className={`text-[9px] md:text-[10px] font-black uppercase px-1.5 md:px-3 py-1 md:py-1.5 rounded-lg touch-manipulation hidden md:block ${showRuler ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}>
              标尺
            </button>
            <button onClick={() => setShowGuideLines(!showGuideLines)} className={`text-[9px] md:text-[10px] font-black uppercase px-1.5 md:px-3 py-1 md:py-1.5 rounded-lg touch-manipulation ${showGuideLines ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}>
              参考
            </button>
          </div>

            <div className="w-full h-full overflow-auto no-scrollbar bg-dots">
            {viewType === ViewType.TWO_D ? (
              <>
                <div className="min-w-full min-h-full flex items-center justify-center p-2 md:p-40 pt-14 md:pt-8 max-lg:pb-[calc(var(--app-mobile-2d-bottom-chrome-height)+5.5rem)] md:pb-8">
                  <div
                    className={`relative ${joystickMove.x === 0 && joystickMove.y === 0 ? 'transition-transform duration-75' : ''}`}
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                    }}
                  >
                     <div className="relative shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3rem] bg-white border border-white/60 p-6 md:p-12">
                        <BeadCanvas
                          grid={grid}
                          gridWidth={gridWidth}
                          gridHeight={gridHeight}
                          zoom={zoom}
                          showGridLines={showGridLines}
                          showRuler={showRuler}
                          showGuideLines={showGuideLines}
                          pixelStyle={pixelStyle}
                          backgroundImage={backgroundImage}
                          selectedLayer={selectedLayer}
                          currentTool={currentTool}
                          selection={selection}
                          highlightedColor={highlightedColor}
                          highlightOpacity={highlightOpacity}
                          onPointerDown={handleCanvasAction}
                          onPointerMove={handleCanvasAction}
                          onPointerUp={() => {}}
                          onMiddleButtonDrag={handleMiddleButtonDrag}
                          onBackgroundImageDrag={handleBackgroundImageDrag}
                          onZoomChange={setZoom}
                          onTouchPan={handleMiddleButtonDrag}
                          onSelectionChange={setSelection}
                        />
                     </div>
                  </div>
                </div>
                <div className="lg:hidden fixed bottom-[calc(var(--app-mobile-2d-bottom-chrome-height)+0.75rem)] left-6 z-[50]">
                  <VirtualJoystick
                    type="move"
                    onMove={(x, y) => setJoystickMove({ x: -x, y: -y })}
                    size={72}
                    knobSize={36}
                  />
                </div>
                <div className="lg:hidden fixed bottom-[calc(var(--app-mobile-2d-bottom-chrome-height)+0.75rem)] right-6 z-[50]">
                  <VirtualJoystick
                    type="zoom"
                    onZoom={(delta) => setJoystickZoom(delta)}
                    size={72}
                    knobSize={36}
                  />
                </div>
              </>
            ) : viewType === ViewType.THREE_D ? (
              <div className="min-w-full h-full min-h-0 flex flex-col">
                <Bead3DViewer
                  grid={grid}
                  gridSize={Math.max(gridWidth, gridHeight)}
                  zoom={zoom}
                  pixelStyle={pixelStyle}
                  showGridLines={showGridLines}
                  layers={layers}
                  onLayerCountChange={setLayers}
                />
              </div>
            ) : viewType === ViewType.SLICES ? (
              <div className="min-w-full h-full min-h-0 flex flex-col">
                <BeadSliceViewer
                  grid={grid}
                  gridSize={Math.max(gridWidth, gridHeight)}
                  zoom={zoom}
                  pixelStyle={pixelStyle}
                  showGridLines={showGridLines}
                  layers={layers}
                  onLayerCountChange={setLayers}
                />
              </div>
            ) : null}
          </div>

           <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white px-8 py-3 rounded-2xl shadow-2xl gap-10 text-[10px] font-black tracking-widest z-50">
               <div className="flex flex-col"><span className="text-slate-500 mb-0.5">尺寸</span>{gridWidth}x{gridHeight}</div>
               <div className="flex flex-col"><span className="text-slate-500 mb-0.5">总数</span>{gridWidth * gridHeight}</div>
               <div className="flex flex-col"><span className="text-indigo-400 mb-0.5">已用</span>{stats.reduce((acc, curr) => acc + curr.count, 0)}</div>
           </div>

           <div
             className={`absolute right-3 z-[45] md:z-50 group md:bottom-6 ${
               viewType === ViewType.TWO_D
                 ? 'max-lg:bottom-[calc(var(--app-mobile-2d-bottom-chrome-height)+4.5rem)]'
                 : 'max-lg:bottom-[calc(11rem+env(safe-area-inset-bottom,0px))]'
             }`}
           >
             <button
               className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl shadow-xl flex items-center justify-center transition-all active:scale-95 peer"
             >
               <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </button>
             <div className="hidden group-hover:flex group-focus-within:flex flex-col gap-2 absolute bottom-14 right-0 bg-white rounded-xl shadow-xl border border-slate-200 p-2 min-w-[140px]">
               <button onClick={() => { setShowOnboarding(true); }} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all whitespace-nowrap">
                 <span>👋</span> 新手引导
               </button>
               <button onClick={() => setHelpModalOpen(true)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all whitespace-nowrap">
                 <span>📖</span> 使用指南
               </button>
             </div>
           </div>

        </main>

        {/* Mobile bottom: 2D 绘图快捷栏 + 全局操作栏 */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {viewType === ViewType.TWO_D && (
            <div className="border-b border-slate-100 bg-gradient-to-b from-amber-50/40 to-slate-50/90 px-0.5 py-1">
              <div className="flex items-stretch justify-between gap-0.5">
                {MOBILE_2D_DOCK_TOOLS.map((tool) => {
                  const isSmart = tool.type === ToolType.SMART_PENCIL;
                  const active = currentTool === tool.type;
                  return (
                    <button
                      key={tool.type}
                      type="button"
                      onClick={() => setCurrentTool(tool.type)}
                      title={`${tool.name} (${tool.shortcut})`}
                      className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg py-1 touch-manipulation transition-all active:scale-[0.97] ${
                        isSmart ? 'flex-[1.2] min-w-[2.75rem]' : 'flex-1'
                      } ${
                        isSmart
                          ? active
                            ? 'bg-gradient-to-b from-amber-200 to-amber-100 text-amber-950 ring-2 ring-amber-400 shadow-sm'
                            : 'bg-amber-100/90 text-amber-900 ring-1 ring-amber-300/70 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]'
                          : active
                            ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300/80'
                            : 'text-slate-500 active:bg-slate-100'
                      }`}
                    >
                      <span className={`leading-none ${isSmart ? 'text-lg' : 'text-base'}`}>{tool.icon}</span>
                      <span className="text-[8px] font-black leading-tight truncate max-w-full px-0.5">
                        {isSmart ? '智能画笔' : tool.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex items-center justify-around px-2 py-1.5">
            <button onClick={handleExportImage} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl active:bg-slate-100 transition-all touch-manipulation">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span className="text-[9px] font-bold text-slate-600">导出</span>
            </button>
            <button onClick={handleShare} disabled={isSharing} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl active:bg-slate-100 transition-all touch-manipulation disabled:opacity-50">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              <span className="text-[9px] font-bold text-slate-600">{isSharing ? '生成中' : '分享'}</span>
            </button>
            <button onClick={() => setMaterialGalleryOpen(true)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl active:bg-slate-100 transition-all touch-manipulation">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span className="text-[9px] font-bold text-slate-600">广场</span>
            </button>
            <button onClick={() => setIsPlannerViewOpen(true)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl active:bg-slate-100 transition-all touch-manipulation">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-[9px] font-bold text-slate-600">拼豆</span>
            </button>
            <button onClick={() => setHelpModalOpen(true)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl active:bg-slate-100 transition-all touch-manipulation">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-[9px] font-bold text-slate-600">帮助</span>
            </button>
          </div>
        </div>

         <aside className={`fixed bottom-0 right-0 z-[60] w-80 max-w-[85vw] bg-white border-l border-slate-200 overflow-y-auto no-scrollbar p-4 md:p-6 shrink-0 transform transition-transform duration-300 ease-in-out fixed-safe-top ${isMobileRightOpen ? 'translate-x-0' : 'translate-x-full'} lg:relative lg:transform-none lg:translate-x-0`}>
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

          {highlightedColor && (
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">高亮透明度</span>
                <button
                  onClick={() => setHighlightedColor(null)}
                  className="text-[8px] text-indigo-400 hover:text-red-500 font-black"
                >
                  ✕ 关闭高亮
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={highlightOpacity}
                  onChange={(e) => setHighlightOpacity(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-xs font-bold text-indigo-700 w-12 text-center">{highlightOpacity}%</span>
              </div>
            </div>
          )}
          
          <div className="space-y-2 md:space-y-3">
            {displayStats.length > 0 ? displayStats.map((item) => (
              <div 
                key={item.hex} 
                className={`flex items-center justify-between bg-slate-50 p-2 md:p-3 rounded-2xl border transition-all cursor-pointer group ${highlightedColor === item.hex ? 'border-indigo-400 bg-indigo-50 shadow-lg' : 'border-slate-100 hover:bg-white hover:shadow-lg'}`}
              >
                <div className="flex items-center gap-2 md:gap-3" onClick={() => setSelectedColor(item.hex)}>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bead-shadow relative" style={{ backgroundColor: item.hex }}>
                    {showColorKeys && item.key && (
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] md:text-[9px] font-black text-white" style={{ textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>
                        {item.key}
                      </span>
                    )}
                  </div>
                  <div>
                    {showColorKeys && item.key ? (
                      <div className="text-[8px] md:text-[9px] font-mono text-slate-500 leading-none mb-1">{item.key}</div>
                    ) : (
                      <div className="text-[8px] md:text-[9px] font-mono text-slate-300 leading-none mb-1 uppercase">{item.hex}</div>
                    )}
                    <div className="text-xs md:text-sm font-black text-slate-800">{item.count} <span className="text-[9px] md:text-[10px] font-medium opacity-40">颗</span></div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setHighlightedColor(highlightedColor === item.hex ? null : item.hex);
                  }}
                  className={`p-1.5 md:p-2 rounded-lg transition-all ${highlightedColor === item.hex ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 hover:bg-indigo-100 hover:text-indigo-600'} opacity-0 group-hover:opacity-100`}
                  title={highlightedColor === item.hex ? '取消高亮' : '高亮此颜色'}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
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
            
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setUseAdvancedCrop(!useAdvancedCrop)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${useAdvancedCrop ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {useAdvancedCrop ? '高级裁切 ✓' : '高级裁切'}
              </button>
            </div>

            {useAdvancedCrop ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 text-center">使用高级裁切可以自由选择图片的任意区域</p>
                <button
                  onClick={() => {
                    setUseAdvancedCrop(false);
                    setCustomCrop(null);
                  }}
                  className="w-full py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200"
                >
                  切换到简单裁切
                </button>
                <button
                  onClick={() => {
                    setCustomCrop({ x: 0, y: 0, width: 0, height: 0 });
                  }}
                  className="w-full py-3 rounded-lg bg-emerald-500 text-white font-bold shadow-xl active:scale-95 hover:bg-emerald-600 transition-all"
                >
                  开始裁切
                </button>
              </div>
            ) : (
              <>
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
                  <button onClick={() => {
                    setPendingImage(null);
                    setUseAdvancedCrop(false);
                  }} className="flex-1 py-3 md:py-4 bg-slate-100 text-slate-500 rounded-xl md:rounded-2xl font-black text-sm">取消</button>
                  <button
                    onClick={() => processImageToGrid(pendingImage, gridWidth, gridHeight, cropOffset.x, cropOffset.y)}
                    className="flex-[2] py-3 md:py-4 bg-emerald-500 text-white rounded-xl md:rounded-2xl font-black text-sm shadow-xl active:scale-95"
                  >
                    确认并转换
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {customCrop && pendingImage && (
        <ImageCropSelector
          imageSrc={pendingImage}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          onConfirm={(x, y, width, height) => {
            processImageToGrid(pendingImage, gridWidth, gridHeight, 0, 0, { x, y, width, height });
            setCustomCrop(null);
            setPendingImage(null);
          }}
          onCancel={() => setCustomCrop(null)}
        />
      )}

      {isMobileLeftOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[50] lg:hidden"
          onClick={() => setIsMobileLeftOpen(false)}
        />
      )}

      {isMobileRightOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[50] lg:hidden"
          onClick={() => setIsMobileRightOpen(false)}
        />
      )}

      <ColorPicker
        isOpen={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
      />

      {isPlannerViewOpen && (
        <BeadPlannerView
          grid={grid}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          pixelStyle={pixelStyle}
          selectedColorSystem={selectedColorSystem}
          onClose={() => setIsPlannerViewOpen(false)}
        />
      )}

      <ShortcutsPanel
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 md:space-y-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 italic">分享作品</h3>
                  <p className="text-xs md:text-sm text-slate-400 font-medium">选择分享方式</p>
                </div>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                className="p-2 md:p-3 hover:bg-slate-100 rounded-xl transition-all shrink-0"
              >
                <svg className="w-6 h-6 md:w-7 md:h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 md:p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="shareLink"
                    name="shareType"
                    checked={!shareToGallery}
                    onChange={() => {
                      setShareToGallery(false);
                    }}
                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="shareLink" className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-base md:text-lg text-slate-900">生成分享链接</div>
                        <div className="text-xs md:text-sm text-slate-500 mt-1">生成7天有效的分享链接</div>
                      </div>
                      <svg className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 005.656 5.656l1.414 1.414a1 1 0 001.414 0l4-4A1 1 0 0012 9.586l-1.414-1.414a1 1 0 00-.586.414l-4 4a4 4 0 005.656 5.656l4-4a1 1 0 001.414 0l1.414 1.414a1 1 0 001.414 0l4-4a1 1 0 001.414 0zM8 14a2 2 0 100-4 0 2 2 0 000 4zM20 12a2 2 0 100-4 0 2 2 0 000 4zM8 10a2 2 0 100-4 0 2 2 0 000 4zM20 8a2 2 0 100-4 0 2 2 0 000 4z" />
                      </svg>
                    </div>
                  </label>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="shareGallery"
                      name="shareType"
                      checked={shareToGallery}
                      onChange={() => {
                        setShareToGallery(true);
                      }}
                      className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="shareGallery" className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-base md:text-lg text-slate-900">发布到素材广场</div>
                          <div className="text-xs md:text-sm text-slate-500 mt-1">公开分享给所有用户，永久保存</div>
                        </div>
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {shareToGallery && (
                <div className="space-y-4 bg-purple-50 p-4 md:p-6 rounded-2xl">
                  <div>
                    <label className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-2 block">素材名称 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      placeholder="给你的作品起个名字"
                      maxLength={50}
                      className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-sm font-medium outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-2 block">作者名称 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={materialAuthor}
                      onChange={(e) => setMaterialAuthor(e.target.value)}
                      placeholder="创作者名称"
                      maxLength={30}
                      className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-sm font-medium outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-2 block">描述</label>
                    <textarea
                      value={materialDescription}
                      onChange={(e) => setMaterialDescription(e.target.value)}
                      placeholder="描述你的作品..."
                      maxLength={200}
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-sm font-medium outline-none focus:border-purple-500 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-2 block">标签</label>
                    <input
                      type="text"
                      value={materialTags}
                      onChange={(e) => setMaterialTags(normalizeTags(e.target.value))}
                      placeholder="用逗号分隔，如：动物, 可爱"
                      maxLength={100}
                      className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-sm font-medium outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                </div>
              )}

              {shareUrl && !shareToGallery && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">分享链接</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 md:py-3 text-xs md:text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    />
                    <button
                      onClick={copyShareUrl}
                      className="px-4 py-2 md:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-xs transition-all active:scale-95"
                    >
                      复制
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleShare}
              disabled={isSharing || isPublishing || (shareToGallery && (!materialTitle.trim() || !materialAuthor.trim()))}
              className="w-full py-4 md:py-4.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl md:rounded-2xl font-bold text-base md:text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSharing || isPublishing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                  <span>{shareToGallery ? '发布中...' : '生成中...'}</span>
                </>
              ) : (
                <span>{shareToGallery ? '发布到广场' : '生成链接'}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {exportModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 max-w-lg w-full shadow-2xl space-y-6 md:space-y-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-indigo-600 rounded-full mx-auto flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 italic">导出图片</h3>
              <p className="text-xs md:text-sm text-slate-400 font-medium">选择导出图片的像素样式</p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">像素样式</label>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                {PIXEL_STYLES.map(style => (
                  <button
                    key={style.value}
                    onClick={() => setExportPixelStyle(style.value)}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-black transition-all flex items-center justify-center gap-2 ${exportPixelStyle === style.value ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    title={style.name}
                  >
                    <span className="text-lg">{style.icon}</span>
                    <span>{style.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="exportGuideLines"
                checked={exportShowGuideLines}
                onChange={(e) => setExportShowGuideLines(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="exportGuideLines" className="text-sm font-black text-slate-700 cursor-pointer">
                显示参考线（5x5分区）
              </label>
            </div>

             <div className="flex items-center gap-3">
               <input
                 type="checkbox"
                 id="exportMirror"
                 checked={exportMirror}
                 onChange={(e) => setExportMirror(e.target.checked)}
                 className="w-5 h-5 rounded border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500"
               />
               <label htmlFor="exportMirror" className="text-sm font-black text-slate-700 cursor-pointer">
                 水平镜像
               </label>
             </div>

             {selection && (
               <div className="flex items-center gap-3">
                 <input
                   type="checkbox"
                   id="exportSelectionOnly"
                   checked={exportSelectionOnly}
                   onChange={(e) => setExportSelectionOnly(e.target.checked)}
                   className="w-5 h-5 rounded border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                 />
                 <label htmlFor="exportSelectionOnly" className="text-sm font-black text-slate-700 cursor-pointer">
                   仅导出选区
                 </label>
               </div>
             )}

            <div className="flex gap-3">
              <button
                onClick={() => setExportModalOpen(false)}
                className="flex-1 py-3 md:py-4 bg-slate-100 text-slate-700 rounded-xl md:rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleConfirmExport}
                className="flex-[2] py-3 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl md:rounded-2xl font-black text-sm shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出图纸
              </button>
            </div>

            <button
              onClick={handleShareImageExport}
              className="w-full py-3 md:py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl md:rounded-2xl font-black text-sm shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="text-lg">📕</span>
              生成小红书分享图
              <span className="text-[10px] font-medium opacity-80 ml-1">含水印 + 自动复制文案</span>
            </button>
          </div>
        </div>
      )}

      {exportPreviewUrl && (
        <div className="fixed inset-0 bg-black/90 z-[1500] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg flex flex-col items-center gap-4">
            <img
              src={exportPreviewUrl}
              alt="导出预览"
              className="max-w-full max-h-[60vh] rounded-2xl shadow-2xl border-2 border-white/20 object-contain bg-white"
            />
            <p className="text-white/70 text-xs font-bold text-center">长按图片可保存到相册</p>
            <div className="flex gap-3 w-full max-w-xs">
              <button
                onClick={async () => {
                  if (exportPreviewBlob) {
                    try {
                      const file = new File([exportPreviewBlob], exportPreviewName, { type: 'image/png' });
                      if (navigator.share && navigator.canShare?.({ files: [file] })) {
                        await navigator.share({ files: [file] });
                        return;
                      }
                    } catch {}
                    const a = document.createElement('a');
                    a.href = exportPreviewUrl;
                    a.download = exportPreviewName;
                    a.click();
                  }
                }}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                分享
              </button>
              <button
                onClick={() => {
                  if (exportPreviewUrl) URL.revokeObjectURL(exportPreviewUrl);
                  setExportPreviewUrl(null);
                  setExportPreviewBlob(null);
                  setExportPreviewName('');
                }}
                className="flex-1 py-3 bg-white/20 text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {materialGalleryOpen && (
        <MaterialGallery
          onApplyMaterial={handleApplyMaterial}
          onClose={() => setMaterialGalleryOpen(false)}
        />
      )}

      {showOnboarding && (
        <OnboardingGuide onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem('onboarding_done', '1');
        }} />
      )}

      {helpModalOpen && (
        <HelpModal
          isOpen={helpModalOpen}
          onClose={() => setHelpModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
