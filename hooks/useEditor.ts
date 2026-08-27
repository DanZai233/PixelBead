import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ToolType, DEFAULT_COLORS, PixelStyle,
  TOOLS_INFO, ColorHex, ViewType,
  ColorSystem, PaletteColor, Selection, SelectionMode, BRUSH_SIZES,
} from '../types';
import { generatePixelArtImage } from '../services/aiService';
import {
  saveToUpstash,
  generateShareUrl,
  getShareKeyFromUrl,
  loadFromUpstash,
  parseShareKeyFromInput,
  type ShareData,
} from '../services/upstashService';
import { saveMaterial } from '../services/materialService';
import {
  reduceGridColors,
  removeBackground,
  colorSystemOptions,
  findClosestColor,
} from '../utils/colorSystemUtils';
import { generateExportImage, generateShareImage, generateShareCaption, getUniqueColors } from '../utils/colorUtils';
import { useEditorPalette } from './useEditorPalette';
import { wandSelectCells, getSelectionCellSet, mergeSelectionCells, detectBackgroundCells, invertSelectionCells, selectionFromCells } from '../utils/selectionUtils';
import colorSystemMapping from '../colorSystemMapping.json';
import { Capacitor } from '@capacitor/core';
import { pickSingleImageNative } from '../utils/pickImageNative';

// ═══════════════════════════════════════════
// SECTION: Grid State & History
//   grid state, undo/redo, resize, autosave
// ═══════════════════════════════════════════
export function useEditor(toast: (msg: string, type?: 'error' | 'success' | 'info') => void) {
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
  // ── View State ──
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [showAIResultModal, setShowAIResultModal] = useState(false);
  const [importResultModalOpen, setImportResultModalOpen] = useState(false);
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
  const [targetColorCount, setTargetColorCount] = useState(16);
  const [hasSourceImage, setHasSourceImage] = useState(false);
  const [hasBgRemovalRestore, setHasBgRemovalRestore] = useState(false);

  const [showColorKeys, setShowColorKeys] = useState(true);
  const [selectedColorSystem, setSelectedColorSystem] = useState<ColorSystem>('MARD');
  const [isPalettePanelOpen, setIsPalettePanelOpen] = useState(true);
  // ── AI Generation State ──
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
  const [shareLinkImportOpen, setShareLinkImportOpen] = useState(false);
  const [shareLinkDraft, setShareLinkDraft] = useState('');
  const [shareLinkImportLoading, setShareLinkImportLoading] = useState(false);

  const [showRuler, setShowRuler] = useState(true);

  const [showGuideLines, setShowGuideLines] = useState(true);
  // ── Image Import & Background State ──

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportPixelStyle, setExportPixelStyle] = useState<PixelStyle>(PixelStyle.CIRCLE);
  const [exportShowGuideLines, setExportShowGuideLines] = useState(false);
  const [exportMirror, setExportMirror] = useState(false);
  const [exportSelectionOnly, setExportSelectionOnly] = useState(false);
  const [exportWatermarkEnabled, setExportWatermarkEnabled] = useState(false);
  const [exportWatermarkText, setExportWatermarkText] = useState('拼豆糕手');
  // ── Share & Material Gallery State ──
  const [exportPreviewUrl, setExportPreviewUrl] = useState<string | null>(null);
  const [exportPreviewBlob, setExportPreviewBlob] = useState<Blob | null>(null);
  const [exportPreviewName, setExportPreviewName] = useState('');

  const [materialGalleryOpen, setMaterialGalleryOpen] = useState(false);
  const [shareToGallery, setShareToGallery] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  // ── Export State ──
  const [materialAuthor, setMaterialAuthor] = useState('');
  const [materialTags, setMaterialTags] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding_done');
  // ── Selection & Clipboard State ──
  });

  const [selection, setSelection] = useState<Selection | null>(null);
  // 默认加选：第一次框选生成选区，后续框选/魔棒自动叠加为不规则选区
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('add');
  const [clipboard, setClipboard] = useState<string[][] | null>(null);
  const [brushSize, setBrushSize] = useState(1);
  const [wandTolerance, setWandTolerance] = useState(5);
  const [wandContiguous, setWandContiguous] = useState(true);

  // ── Palette State ──
  const [joystickMove, setJoystickMove] = useState({ x: 0, y: 0 });
  const [joystickZoom, setJoystickZoom] = useState(0);
  const joystickMoveRef = useRef({ x: 0, y: 0 });
  const joystickZoomRef = useRef(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const aiReferenceImageRef = useRef<HTMLInputElement>(null);
  const backgroundImageRef = useRef<HTMLInputElement>(null);
  const sourceImageCacheRef = useRef<{ data: Uint8ClampedArray; width: number; height: number } | null>(null);
  const preRemovalGridRef = useRef<string[][] | null>(null);
  type HistoryEntry = { type: 'grid'; grid: string[][] } | { type: 'selection'; selection: Selection | null };
  const undoStackRef = useRef<HistoryEntry[]>([]);
  const redoStackRef = useRef<HistoryEntry[]>([]);
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
    undoStackRef.current = [...undoStackRef.current.slice(-(MAX_HISTORY - 1)), { type: 'grid', grid: prev.map(r => [...r]) }];
    redoStackRef.current = [];
    setHistoryVersion(v => v + 1);
  }, []);

  /** 记录一次「纯选区操作」（框选/魔棒/取消框选），Ctrl+Z 可撤销 */
  const pushSelectionHistory = useCallback((prevSelection: Selection | null) => {
    const snapshot: Selection | null = prevSelection
      ? { ...prevSelection, cells: prevSelection.cells ? [...prevSelection.cells] : undefined }
      : null;
    undoStackRef.current = [...undoStackRef.current.slice(-(MAX_HISTORY - 1)), { type: 'selection', selection: snapshot }];
    redoStackRef.current = [];
    setHistoryVersion(v => v + 1);
  }, []);

  const applyShareDataToCanvas = useCallback(
    (shareData: ShareData, opts?: { openShareModal?: boolean }) => {
      pushUndo(gridRef.current);
      const size = shareData.gridSize || shareData.gridWidth || 32;
      setGridWidth(size);
      setGridHeight(shareData.gridHeight || size);
      setGrid(shareData.grid);
      setPixelStyle(shareData.pixelStyle as PixelStyle);
      setPanOffset({ x: 0, y: 0 });
      if (opts?.openShareModal) setShareModalOpen(true);
    },
    [pushUndo]
  );

  useEffect(() => {
    const loadSharedData = async () => {
      const shareKey = getShareKeyFromUrl();
      if (!shareKey) return;
      try {
        const shareData = await loadFromUpstash(shareKey);
        if (shareData) {
          applyShareDataToCanvas(shareData, { openShareModal: true });
          window.history.replaceState({}, document.title, window.location.pathname);
          toast('已加载分享的拼豆图纸！', 'success');
        }
      } catch (error) {
        console.error('加载分享数据失败:', error);
      }
    };
    void loadSharedData();
  }, [applyShareDataToCanvas]);

  const pasteShareLinkFromClipboard = useCallback(async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t?.trim()) setShareLinkDraft(t.trim());
    } catch {
      toast('无法读取剪贴板，请在输入框内长按粘贴。', 'error');
    }
  }, []);

  const handleConfirmShareLinkImport = useCallback(async () => {
    const key = parseShareKeyFromInput(shareLinkDraft);
    if (!key) {
      toast('未识别到有效内容。请粘贴含 #share= 的完整链接，或仅粘贴 bead: 开头的 key。', 'error');
      return;
    }
    setShareLinkImportLoading(true);
    try {
      const shareData = await loadFromUpstash(key);
      if (!shareData) {
        toast('链接无效或已过期。', 'error');
        return;
      }
      applyShareDataToCanvas(shareData);
      setShareLinkImportOpen(false);
      setShareLinkDraft('');
      toast('已载入分享图纸！', 'success');
    } catch {
      toast('加载失败，请检查网络后重试。', 'error');
    } finally {
      setShareLinkImportLoading(false);
    }
  }, [shareLinkDraft, applyShareDataToCanvas]);

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
    const entry = undoStackRef.current.pop()!;
    if (entry.type === 'grid') {
      redoStackRef.current = [...redoStackRef.current, { type: 'grid', grid: grid.map(r => [...r]) }];
      setGrid(entry.grid);
    } else {
      redoStackRef.current = [...redoStackRef.current, {
        type: 'selection',
        selection: selection ? { ...selection, cells: selection.cells ? [...selection.cells] : undefined } : null,
      }];
      setSelection(entry.selection);
    }
    setHistoryVersion(v => v + 1);
  }, [grid, selection]);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const entry = redoStackRef.current.pop()!;
    if (entry.type === 'grid') {
      undoStackRef.current = [...undoStackRef.current, { type: 'grid', grid: grid.map(r => [...r]) }];
      setGrid(entry.grid);
    } else {
      undoStackRef.current = [...undoStackRef.current, {
        type: 'selection',
        selection: selection ? { ...selection, cells: selection.cells ? [...selection.cells] : undefined } : null,
      }];
      setSelection(entry.selection);
    }
    setHistoryVersion(v => v + 1);
  }, [grid, selection]);

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
      toast('请输入 4-200 之间的数字', 'error');
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

  const applyImageToGrid = useCallback((imageSrc: string, width: number, height: number, xAlign: number = 0, yAlign: number = 0, customCrop?: { x: number; y: number; width: number; height: number }) => {
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
      const fullImageData = ctx.getImageData(0, 0, width, height);

      // 缓存原始像素数据，供后续去背景使用
      sourceImageCacheRef.current = {
        data: new Uint8ClampedArray(fullImageData.data),
        width,
        height,
      };
      setHasSourceImage(true);
      preRemovalGridRef.current = null;
      setHasBgRemovalRestore(false);

      const imageData = fullImageData.data;
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
      setImportResultModalOpen(true);
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
    const cells = getSelectionCellSet(selection, gridWidth, gridHeight);

    // 不规则选区:包围盒内非选中格子用白色（透明）填充，粘贴后保持形状
    const copiedGrid: string[][] = [];
    for (let r = rMin; r <= rMax; r++) {
      const row: string[] = [];
      for (let c = cMin; c <= cMax; c++) {
        row.push(cells.has(`${r},${c}`) ? grid[r][c] : '#FFFFFF');
      }
      copiedGrid.push(row);
    }
    setClipboard(copiedGrid);
    toast('已复制选区内容', 'success');
  }, [selection, grid, gridWidth, gridHeight]);

  const handleCutSelection = useCallback(() => {
    if (!selection) return;
    const { startRow, startCol, endRow, endCol } = selection;
    const rMin = Math.min(startRow, endRow);
    const rMax = Math.max(startRow, endRow);
    const cMin = Math.min(startCol, endCol);
    const cMax = Math.max(startCol, endCol);
    const cells = getSelectionCellSet(selection, gridWidth, gridHeight);

    const copiedGrid: string[][] = [];
    for (let r = rMin; r <= rMax; r++) {
      const row: string[] = [];
      for (let c = cMin; c <= cMax; c++) {
        row.push(cells.has(`${r},${c}`) ? grid[r][c] : '#FFFFFF');
      }
      copiedGrid.push(row);
    }
    setClipboard(copiedGrid);

    pushUndo(gridRef.current);
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      for (const key of cells) {
        const [r, c] = key.split(',').map(Number);
        newGrid[r][c] = '#FFFFFF';
      }
      return newGrid;
    });
    setSelection(null);
    toast('已剪切选区内容', 'success');
  }, [selection, grid, gridWidth, gridHeight, pushUndo]);

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
    toast('已粘贴内容', 'success');
  }, [clipboard, gridHeight, gridWidth, pushUndo]);

  const handleInvertSelection = useCallback(() => {
    if (!selection) return;
    const cells = getSelectionCellSet(selection, gridWidth, gridHeight);

    pushUndo(gridRef.current);
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      for (const key of cells) {
        const [r, c] = key.split(',').map(Number);
        if (newGrid[r][c] === '#FFFFFF') {
          newGrid[r][c] = selectedColor;
        } else {
          newGrid[r][c] = '#FFFFFF';
        }
      }
      return newGrid;
    });
  }, [selection, selectedColor, gridWidth, gridHeight, pushUndo]);

  const handleExcludeColorFromSelection = useCallback(() => {
    if (!selection) return;
    const cells = getSelectionCellSet(selection, gridWidth, gridHeight);

    pushUndo(gridRef.current);
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      for (const key of cells) {
        const [r, c] = key.split(',').map(Number);
        if (newGrid[r][c] === selectedColor) {
          newGrid[r][c] = '#FFFFFF';
        }
      }
      return newGrid;
    });
  }, [selection, selectedColor, gridWidth, gridHeight, pushUndo]);

  const handleClearSelection = useCallback(() => {
    if (!selection) return;
    const cells = getSelectionCellSet(selection, gridWidth, gridHeight);

    pushUndo(gridRef.current);
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      for (const key of cells) {
        const [r, c] = key.split(',').map(Number);
        newGrid[r][c] = '#FFFFFF';
      }
      return newGrid;
    });
    setSelection(null);
  }, [selection, gridWidth, gridHeight, pushUndo]);

  /** 取消框选（可被 Ctrl+Z 撤销） */
  const handleDeselect = useCallback(() => {
    if (!selection) return;
    pushSelectionHistory(selection);
    setSelection(null);
  }, [selection, pushSelectionHistory]);

  /** 识别背景：从画布四边自动选中相连的背景区域，Delete 即可抠图 */
  const handleDetectBackground = useCallback(() => {
    const cells = detectBackgroundCells(grid, wandTolerance);
    if (cells.size === 0) {
      toast('未识别到背景区域，试试调大容差', 'error');
      return;
    }
    pushSelectionHistory(selection);
    const sel = selectionFromCells(cells);
    setSelection(sel);
    toast(`已选中背景 ${cells.size} 格，按 Delete 即可抠掉背景`, 'info');
  }, [grid, wandTolerance, selection, pushSelectionHistory]);

  /** 选区反选：选中画布中未被当前选区覆盖的部分（PS Ctrl+Shift+I） */
  const handleInvertSelectionArea = useCallback(() => {
    if (!selection) return;
    pushSelectionHistory(selection);
    const inv = invertSelectionCells(selection, gridWidth, gridHeight);
    setSelection(selectionFromCells(inv));
    toast('已反选选区', 'info');
  }, [selection, gridWidth, gridHeight, pushSelectionHistory]);

  /** 框选/魔棒提交选区时的统一入口：按「替换/加选/减选」模式合并 */
  const handleSelectionChange = useCallback((newSel: Selection | null) => {
    pushSelectionHistory(selection);
    if (!newSel) {
      setSelection(null);
      return;
    }
    if (selectionMode === 'replace') {
      setSelection(newSel);
      return;
    }
    const newCells = getSelectionCellSet(newSel, gridWidth, gridHeight);
    const merged = mergeSelectionCells(selection, newCells, selectionMode, gridWidth, gridHeight);
    setSelection(merged);
    if (merged && selectionMode === 'add') {
      toast(`已叠加选区，共 ${merged.cells?.length ?? 0} 格`, 'info');
    }
  }, [selection, selectionMode, gridWidth, gridHeight, pushSelectionHistory]);

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
      if (e.ctrlKey && e.shiftKey && e.key === 'i') {
        e.preventDefault();
        handleInvertSelectionArea();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selection) {
          handleClearSelection();
        }
        return;
      }
      if (e.key === 'Escape') {
        if (selection) {
          e.preventDefault();
          handleDeselect();
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
  }, [isColorPickerOpen, isShortcutsOpen, helpModalOpen, undo, redo, handleCopySelection, handlePasteSelection, handleCutSelection, handleClearSelection, handleDeselect, handleInvertSelectionArea, selection, gridHeight, gridWidth]);

  const handleCanvasAction = useCallback((row: number, col: number, backgroundColor?: string | null) => {
    if (currentTool === ToolType.PICKER) {
      const colorAt = grid[row][col];
      if (colorAt && colorAt !== '#FFFFFF') {
        setSelectedColor(colorAt);
        setCurrentTool(ToolType.PENCIL);
      }
      return;
    }

    if (currentTool === ToolType.WAND) {
      const cells = wandSelectCells(grid, row, col, wandTolerance, wandContiguous);
      if (cells.length === 0) return;
      pushSelectionHistory(selection);
      const merged = mergeSelectionCells(selection, new Set(cells), selectionMode, gridWidth, gridHeight);
      setSelection(merged);
      if (merged) {
        const count = merged.cells?.length ?? 0;
        toast(selectionMode === 'add'
          ? `魔棒已叠加选区，共 ${count} 格，按 Delete 清空（抠图去背景）`
          : selectionMode === 'subtract'
            ? `已从选区减去 ${cells.length} 格，剩余 ${count} 格`
            : `魔棒已选中 ${count} 格，按 Delete 即可清空（抠图去背景）`, 'info');
      } else {
        toast('已从选区中减去全部区域', 'info');
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
  }, [selectedColor, currentTool, gridWidth, gridHeight, grid, shapeStart, getLineCells, getRectCells, getCircleCells, pushUndo, selectedColorSystem, brushSize, wandTolerance, wandContiguous, selection, selectionMode, pushSelectionHistory]);

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
      toast('请输入描述或上传参考图片', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const base64 = await generatePixelArtImage(aiPrompt, aiReferenceImage || undefined);
      applyImageToGrid(base64, gridWidth, gridHeight, 0, 0);
      setAiGeneratedImage(base64);
      setShowAIResultModal(true);
      // 不自动清空：用户可能需要修改描述或参考图后重试
    } catch (error) {
      console.error('AI generation error:', error);
      toast(`生成失败：${error instanceof Error ? error.message : '未知错误'}`, 'error');
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

  const applyBackgroundFromDataUrl = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => {
      const baseBeadSize = 28;
      const cellSize = baseBeadSize * (zoom / 100);

      const canvasWidth = gridWidth * cellSize;
      const canvasHeight = gridHeight * cellSize;

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
  }, [zoom, gridWidth, gridHeight]);

  const openPendingImagePicker = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const url = await pickSingleImageNative();
        if (url) setPendingImage(url);
      } catch (err) {
        console.error(err);
        toast(`选择图片失败：${err instanceof Error ? err.message : '未知错误'}`, 'error');
      }
      return;
    }
    fileInputRef.current?.click();
  }, []);

  const openAiReferenceImagePicker = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const url = await pickSingleImageNative();
        if (url) setAiReferenceImage(url);
      } catch (err) {
        console.error(err);
        toast(`选择图片失败：${err instanceof Error ? err.message : '未知错误'}`, 'error');
      }
      return;
    }
    aiReferenceImageRef.current?.click();
  }, []);

  const openBackgroundImagePicker = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const url = await pickSingleImageNative();
        if (url) applyBackgroundFromDataUrl(url);
      } catch (err) {
        console.error(err);
        toast(`选择图片失败：${err instanceof Error ? err.message : '未知错误'}`, 'error');
      }
      return;
    }
    backgroundImageRef.current?.click();
  }, [applyBackgroundFromDataUrl]);

  const closeAIResultModal = useCallback(() => setShowAIResultModal(false), []);

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
          toast('无效的文件格式', 'error');
        }
      } catch (error) {
        toast('导入失败：文件格式不正确', 'error');
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
      if (src) applyBackgroundFromDataUrl(src);
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
      toast('画布为空，无法导出图片', 'error');
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
      const cells = getSelectionCellSet(selection, gridWidth, gridHeight);

      exportGrid = [];
      for (let r = rMin; r <= rMax; r++) {
        const row: string[] = [];
        for (let c = cMin; c <= cMax; c++) {
          // 不规则选区:包围盒内非选中格子导出为白色（透明）
          row.push(cells.has(`${r},${c}`) ? grid[r][c] : '#FFFFFF');
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
      watermarkEnabled: exportWatermarkEnabled,
      watermarkText: exportWatermarkText,
    });

    const fileName = exportSelectionOnly ? `pixel-bead-${exportWidth}x${exportHeight}-selection.png` : (exportMirror ? `pixel-bead-${gridWidth}x${gridHeight}-mirrored.png` : `pixel-bead-${gridWidth}x${gridHeight}.png`);

    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
    const url = URL.createObjectURL(blob);

    setExportPreviewUrl(url);
    setExportPreviewBlob(blob);
    setExportPreviewName(fileName);
    setExportModalOpen(false);
  }, [grid, gridWidth, gridHeight, exportPixelStyle, exportShowGuideLines, exportMirror, selectedColorSystem, exportSelectionOnly, selection, exportWatermarkEnabled, exportWatermarkText]);

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

  // ── 调色板逻辑（色板分组/映射/我的已有颜色）已拆分至 useEditorPalette ──
  const {
    paletteGroups, paletteColors, allColors, getColorKey, displayStats,
    handleMergeSimilarColors, handleMapToPalette, handlePalettePresetChange, mapGridToPalette,
    expandedColorGroups, setExpandedColorGroups, toggleColorGroup,
    ownedColors, toggleOwnedColor, addOwnedColor, clearOwnedColors, addCanvasColors,
    ownedOnlyMode, setOwnedOnlyMode, ownedGuideDismissed, dismissOwnedGuide,
  } = useEditorPalette({
    selectedColorSystem,
    showColorKeys,
    grid,
    targetColorCount,
    selectedPalettePreset,
    stats,
    pushUndo,
    gridRef,
    setGrid,
    setSelectedPalettePreset,
  });

  const handleRemoveBackground = useCallback(() => {
    const cache = sourceImageCacheRef.current;
    if (!cache) return;

    // 保存当前画布，用于选区恢复
    preRemovalGridRef.current = grid.map(row => [...row]);
    setHasBgRemovalRestore(true);

    // 用缓存的原始像素数据重新执行去背景
    const imageData = new ImageData(
      new Uint8ClampedArray(cache.data),
      cache.width,
      cache.height,
    );
    const cleaned = removeBackground(imageData);
    const pixels = cleaned.data;

    const newGrid: string[][] = [];
    for (let i = 0; i < cache.height; i++) {
      const row: string[] = [];
      for (let j = 0; j < cache.width; j++) {
        const idx = (i * cache.width + j) * 4;
        if (pixels[idx + 3] < 128) {
          row.push('#FFFFFF');
        } else {
          const hex = '#' + ((1 << 24) + (pixels[idx] << 16) + (pixels[idx + 1] << 8) + pixels[idx + 2]).toString(16).slice(1).toUpperCase();
          row.push(hex);
        }
      }
      newGrid.push(row);
    }

    pushUndo(gridRef.current);
    setGrid(newGrid);
  }, [grid, pushUndo]);

  const handleRestoreSelection = useCallback(() => {
    const pre = preRemovalGridRef.current;
    if (!pre || !selection) return;
    if (!confirm('将选区恢复到去背景前的状态，确定吗？')) return;

    const cells = getSelectionCellSet(selection, gridWidth, gridHeight);

    const newGrid = grid.map(row => [...row]);
    for (const key of cells) {
      const [r, c] = key.split(',').map(Number);
      if (r < pre.length && c < pre[0].length) {
        newGrid[r][c] = pre[r][c];
      }
    }

    pushUndo(gridRef.current);
    setGrid(newGrid);
  }, [grid, selection, gridWidth, gridHeight, pushUndo]);

  const closeImportResultModal = useCallback(() => setImportResultModalOpen(false), []);

  const handleImportMapPalette = useCallback((maxColors: number) => {
    mapGridToPalette(maxColors > 0 ? maxColors : undefined);
    setImportResultModalOpen(false);
  }, [mapGridToPalette]);

  const handleShare = useCallback(async () => {
    const hasContent = grid.some(row => row.some(c => c !== '#FFFFFF'));
    if (!hasContent) {
      toast('画布为空，无法分享', 'error');
      return;
    }

    if (shareToGallery) {
      if (!materialTitle.trim()) {
        toast('请输入素材名称', 'error');
        return;
      }
      if (!materialAuthor.trim()) {
        toast('请输入作者名称', 'error');
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
          toast('素材已成功发布到广场！', 'success');
          setShareModalOpen(false);
          setMaterialTitle('');
          setMaterialDescription('');
          setMaterialAuthor('');
          setMaterialTags('');
          setShareToGallery(false);
        } else {
          toast('发布失败，请检查网络连接或稍后重试', 'error');
        }
      } catch (error) {
        console.error('发布失败:', error);
        toast('发布失败，请检查网络连接或稍后重试', 'error');
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
          toast('分享失败，请检查网络连接或稍后重试', 'error');
        }
      } catch (error) {
        console.error('分享失败:', error);
        toast('分享失败，请检查网络连接或稍后重试', 'error');
      } finally {
        setIsSharing(false);
      }
    }
  }, [grid, gridWidth, gridHeight, pixelStyle, shareToGallery, materialTitle, materialDescription, materialAuthor, materialTags]);

  const copyShareUrl = useCallback(() => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast('链接已复制到剪贴板！', 'success');
    }
  }, [shareUrl]);

  const normalizeTags = useCallback((value: string): string => {
    return value.replace(/[\uFF0C\uFF0C\u3002]/g, ',');
  }, []);

  return {
    grid, setGrid, gridWidth, setGridWidth, gridHeight, setGridHeight,
    customWidth, setCustomWidth, customHeight, setCustomHeight,
    showCustomInput, setShowCustomInput, brushSize, setBrushSize,
    undo, redo, canUndo, canRedo,
    zoom, setZoom, panOffset, setPanOffset,
    showGridLines, setShowGridLines, showRuler, setShowRuler,
    showGuideLines, setShowGuideLines,
    viewType, setViewType, layers, setLayers,
    pixelStyle, setPixelStyle,
    isColorPickerOpen, setIsColorPickerOpen,
    isShortcutsOpen, setIsShortcutsOpen,
    isMobileLeftOpen, setIsMobileLeftOpen,
    isMobileRightOpen, setIsMobileRightOpen,
    helpModalOpen, setHelpModalOpen,
    showOnboarding, setShowOnboarding,
    isPlannerViewOpen, setIsPlannerViewOpen,
    selectedColor, setSelectedColor, currentTool, setCurrentTool,
    selectedLayer, setSelectedLayer,
    backgroundImage, setBackgroundImage,
    shapeStart, setShapeStart,
    handleCanvasAction, handleMiddleButtonDrag,
    selection, setSelection, clipboard, setClipboard,
    selectionMode, setSelectionMode, handleSelectionChange, handleDeselect,
    wandTolerance, setWandTolerance, wandContiguous, setWandContiguous,
    handleDetectBackground, handleInvertSelectionArea,
    handleCopySelection, handleCutSelection, handlePasteSelection,
    handleInvertSelection, handleExcludeColorFromSelection, handleClearSelection,
    aiPrompt, setAiPrompt, isGenerating, setIsGenerating,
    aiReferenceImage, setAiReferenceImage, aiGeneratedImage, setAiGeneratedImage,
    handleAiGenerate, handleAiReferenceImageUpload, openAiReferenceImagePicker,
    aiReferenceImageRef,
    pendingImage, setPendingImage, isProcessingImage, setIsProcessingImage,
    cropOffset, setCropOffset, customCrop, setCustomCrop,
    useAdvancedCrop, setUseAdvancedCrop,
    openPendingImagePicker, openBackgroundImagePicker,
    handleBackgroundImageDrag, applyBackgroundFromDataUrl,
    fileInputRef, importFileRef,
    exportModalOpen, setExportModalOpen,
    exportPixelStyle, setExportPixelStyle,
    exportShowGuideLines, setExportShowGuideLines,
    exportMirror, setExportMirror,
    exportSelectionOnly, setExportSelectionOnly,
    exportWatermarkEnabled, setExportWatermarkEnabled,
    exportWatermarkText, setExportWatermarkText,
    exportPreviewUrl, setExportPreviewUrl,
    exportPreviewBlob, setExportPreviewBlob,
    exportPreviewName, setExportPreviewName,
    handleExportImage, handleConfirmExport,
    handleShareImageExport,
    isSharing, setIsSharing, shareUrl, setShareUrl,
    shareModalOpen, setShareModalOpen,
    shareLinkImportOpen, setShareLinkImportOpen,
    shareLinkDraft, setShareLinkDraft,
    shareLinkImportLoading, setShareLinkImportLoading,
    handleShare, copyShareUrl,
    handleConfirmShareLinkImport, pasteShareLinkFromClipboard,
    materialGalleryOpen, setMaterialGalleryOpen,
    shareToGallery, setShareToGallery,
    materialTitle, setMaterialTitle,
    materialDescription, setMaterialDescription,
    materialAuthor, setMaterialAuthor,
    materialTags, setMaterialTags,
    isPublishing, setIsPublishing,
    handleApplyMaterial, normalizeTags,
    selectedPalettePreset, setSelectedPalettePreset,
    targetColorCount, setTargetColorCount, hasSourceImage, setHasSourceImage, hasBgRemovalRestore, setHasBgRemovalRestore,
    showColorKeys, setShowColorKeys,
    selectedColorSystem, setSelectedColorSystem,
    isPalettePanelOpen, setIsPalettePanelOpen,
    highlightedColor, setHighlightedColor,
    highlightOpacity, setHighlightOpacity,
    paletteGroups, paletteColors, allColors, getColorKey, displayStats,
    colorSystemOptions,
    handleMergeSimilarColors, handleMapToPalette, handlePalettePresetChange, handleRemoveBackground, handleRestoreSelection,
    handleResize, handleCustomSize, resetGrid,
    joystickMove, setJoystickMove, joystickZoom, setJoystickZoom,
    joystickMoveRef, joystickZoomRef,
    handleSaveGeneratedImage,
    showAIResultModal, closeAIResultModal, importResultModalOpen, setImportResultModalOpen, closeImportResultModal, handleImportMapPalette,
    applyImageToGrid,
    generateExportImage, generateShareImage, generateShareCaption, getUniqueColors,
    stats,
    backgroundImageRef,
    onFileChange,
    onImportFile,
    handleBackgroundImageUpload,
    presetSizes,
    expandedColorGroups, setExpandedColorGroups,
    toggleColorGroup,
    ownedColors, toggleOwnedColor, addOwnedColor, clearOwnedColors, addCanvasColors,
    ownedOnlyMode, setOwnedOnlyMode, ownedGuideDismissed, dismissOwnedGuide,
    mapGridToPalette,
  };
}
