import { useState, useCallback, useMemo } from 'react';
import {
  DEFAULT_COLORS, ColorHex, ColorSystem,
} from '../types';
import {
  mergeSimilarColors,
  reduceGridColors,
  mapColorsToPalette,
  mapColorsToPaletteWithOwned,
  createPaletteFromGrid,
  createFullPaletteFromMapping,
} from '../utils/colorSystemUtils';
import colorSystemMapping from '../colorSystemMapping.json';

interface UseEditorPaletteParams {
  selectedColorSystem: ColorSystem;
  showColorKeys: boolean;
  grid: string[][];
  targetColorCount: number;
  selectedPalettePreset: string;
  stats: Array<{ hex: string; count: number }>;
  pushUndo: (prev: string[][]) => void;
  gridRef: React.MutableRefObject<string[][]>;
  setGrid: React.Dispatch<React.SetStateAction<string[][]>>;
  setSelectedPalettePreset: React.Dispatch<React.SetStateAction<string>>;
}

const OWNED_STORAGE_KEY = 'pixelbead_owned_colors';
const OWNED_ONLY_KEY = 'pixelbead_owned_only_mode';
const OWNED_GUIDE_KEY = 'pixelbead_owned_guide_dismissed';

function loadOwnedColors(): ColorHex[] {
  try {
    const raw = localStorage.getItem(OWNED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((c): c is ColorHex =>
        typeof c === 'string' && /^#[0-9A-Fa-f]{6}$/.test(c),
      );
    }
  } catch { /* ignore corrupted storage */ }
  return [];
}

export function useEditorPalette({
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
}: UseEditorPaletteParams) {
  const [expandedColorGroups, setExpandedColorGroups] = useState<Set<string>>(new Set());

  // ── 我的已有颜色:用户手头已有的拼豆色号,映射时优先使用 ──
  const [ownedColors, setOwnedColors] = useState<ColorHex[]>(loadOwnedColors);
  const [ownedOnlyMode, setOwnedOnlyMode] = useState<boolean>(() => {
    try { return localStorage.getItem(OWNED_ONLY_KEY) === '1'; } catch { return false; }
  });
  const [ownedGuideDismissed, setOwnedGuideDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(OWNED_GUIDE_KEY) === '1'; } catch { return false; }
  });

  const persistOwnedColors = (next: ColorHex[]) => {
    try { localStorage.setItem(OWNED_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const toggleOwnedColor = useCallback((hex: string) => {
    setOwnedColors(prev => {
      const next = prev.includes(hex) ? prev.filter(c => c !== hex) : [...prev, hex];
      persistOwnedColors(next);
      return next;
    });
  }, []);

  const addOwnedColor = useCallback((hex: string) => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    const normalized = hex.toUpperCase();
    setOwnedColors(prev => {
      if (prev.includes(normalized)) return prev;
      const next = [...prev, normalized];
      persistOwnedColors(next);
      return next;
    });
  }, []);

  const clearOwnedColors = useCallback(() => {
    persistOwnedColors([]);
    setOwnedColors([]);
  }, []);

  /** 把当前画布用到的颜色一键加入「已有颜色」 */
  const addCanvasColors = useCallback(() => {
    setOwnedColors(prev => {
      const next = new Set(prev);
      stats.forEach(s => { if (s.hex !== '#FFFFFF') next.add(s.hex); });
      const arr = Array.from(next);
      persistOwnedColors(arr);
      return arr;
    });
  }, [stats]);

  const setOwnedOnlyModePersisted = useCallback((v: boolean) => {
    try { localStorage.setItem(OWNED_ONLY_KEY, v ? '1' : '0'); } catch { /* ignore */ }
    setOwnedOnlyMode(v);
  }, []);

  const dismissOwnedGuide = useCallback(() => {
    try { localStorage.setItem(OWNED_GUIDE_KEY, '1'); } catch { /* ignore */ }
    setOwnedGuideDismissed(true);
  }, []);

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

  const getSystemKey = useCallback((hex: string): string => {
    const mapping = colorSystemMapping[hex as keyof typeof colorSystemMapping];
    return mapping ? mapping[selectedColorSystem] || hex : hex;
  }, [selectedColorSystem]);

  const getColorKey = useCallback((hex: string): string => {
    if (!showColorKeys || hex === '#FFFFFF') return '';
    return getSystemKey(hex);
  }, [showColorKeys, getSystemKey]);

  const handleMergeSimilarColors = useCallback(() => {
    const currentColorCount = new Set<string>();
    grid.forEach(row => row.forEach(c => { if (c !== '#FFFFFF') currentColorCount.add(c); }));
    const k = Math.min(currentColorCount.size, targetColorCount);
    if (k >= currentColorCount.size) return;
    if (!confirm(`将 ${currentColorCount.size} 种颜色合并为 ${k} 种，确定吗？`)) return;

    const reduced = reduceGridColors(grid, k);
    setGrid(reduced);
    pushUndo(gridRef.current);
  }, [grid, targetColorCount, pushUndo]);

  /**
   * 构建映射目标并执行映射（无 confirm，供所有映射入口复用）。
   * - 未设置已有颜色:映射到色板全色板
   * - 已设置已有颜色:优先映射到已有颜色,明显不同的颜色回退到色板;
   *   严格模式(ownedOnlyMode)下只使用已有颜色
   */
  const mapGridToPalette = useCallback((maxColors?: number) => {
    const fallbackPalette = createFullPaletteFromMapping(colorSystemMapping, selectedColorSystem, maxColors);

    if (ownedColors.length === 0) {
      setGrid(prev => mapColorsToPalette(prev, fallbackPalette));
    } else {
      const ownedPalette = ownedColors.map(hex => ({ hex, key: getSystemKey(hex) }));
      setGrid(prev => mapColorsToPaletteWithOwned(prev, ownedPalette, fallbackPalette, ownedOnlyMode));
    }
    pushUndo(gridRef.current);
  }, [selectedColorSystem, ownedColors, ownedOnlyMode, getSystemKey, pushUndo, gridRef, setGrid]);

  const handleMapToPalette = useCallback(() => {
    if (ownedColors.length > 0 && !ownedOnlyMode) {
      if (!confirm(`将按你已有的 ${ownedColors.length} 种颜色优先映射，画布上明显不同的颜色会回退到色板。确定吗？`)) return;
    } else if (ownedOnlyMode) {
      if (!confirm(`严格模式：画布将只映射到你已有的 ${ownedColors.length} 种颜色。确定吗？`)) return;
    } else {
      if (!confirm('映射到色板将把所有颜色转换为色板中最接近的颜色，确定吗？')) return;
    }

    // 根据选择的色板预设确定最大颜色数
    let maxColors: number | undefined;
    if (selectedPalettePreset !== 'all' && selectedPalettePreset !== 'custom') {
      maxColors = parseInt(selectedPalettePreset);
    }
    mapGridToPalette(maxColors);
  }, [ownedColors, ownedOnlyMode, selectedPalettePreset, mapGridToPalette]);

  const handlePalettePresetChange = useCallback((preset: string) => {
    setSelectedPalettePreset(preset);

    if (preset !== 'custom' && preset !== 'all') {
      const maxColors = parseInt(preset);

      if (confirm(`当前颜色将被映射到 ${maxColors} 色的色板，确定吗？`)) {
        mapGridToPalette(maxColors);
      }
    }
  }, [setSelectedPalettePreset, mapGridToPalette]);

  const displayStats = useMemo(() => {
    return stats.map(item => ({
      ...item,
      key: getColorKey(item.hex),
    }));
  }, [stats, getColorKey]);

  return {
    paletteGroups,
    paletteColors,
    allColors,
    getColorKey,
    displayStats,
    handleMergeSimilarColors,
    handleMapToPalette,
    handlePalettePresetChange,
    mapGridToPalette,
    expandedColorGroups,
    setExpandedColorGroups,
    toggleColorGroup,
    // ── 我的已有颜色 ──
    ownedColors,
    toggleOwnedColor,
    addOwnedColor,
    clearOwnedColors,
    addCanvasColors,
    ownedOnlyMode,
    setOwnedOnlyMode: setOwnedOnlyModePersisted,
    ownedGuideDismissed,
    dismissOwnedGuide,
  };
}
