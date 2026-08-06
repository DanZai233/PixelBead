import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getMaterialList, getMaterialDetail, incrementMaterialViews, incrementMaterialLikes, type MaterialData } from '../services/materialService';
import { PixelStyle } from '../types';

interface MaterialGalleryProps {
  onApplyMaterial: (material: MaterialData) => void;
  onClose: () => void;
}

const PAGE_SIZE = 30;

export const MaterialGallery: React.FC<MaterialGalleryProps> = ({ onApplyMaterial, onClose }) => {
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortMode, setSortMode] = useState<'latest' | 'hot'>('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialData | null>(null);
  const [detailImage, setDetailImage] = useState<string | null>(null);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const cardObserverRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Refs for observer callbacks to avoid stale closures
  const isLoadingRef = useRef(isLoading);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const hasMoreRef = useRef(hasMore);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { isLoadingMoreRef.current = isLoadingMore; }, [isLoadingMore]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    materials.forEach(m => m.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [materials]);

  // Load a page of materials
  const loadPage = useCallback(async (page: number, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    try {
      const result = await getMaterialList(page, PAGE_SIZE, searchQuery || undefined);
      if (append) {
        setMaterials(prev => [...prev, ...result.materials]);
      } else {
        setMaterials(result.materials);
      }
      setTotalCount(result.total);
      setTotalPages(result.pages);
      setCurrentPage(page);
      setHasMore(page < result.pages);
    } catch (error) {
      console.error('加载素材失败:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery]);

  // Initial load + reload on search change
  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadPage(currentPage + 1, true);
    }
  }, [hasMore, isLoadingMore, currentPage, loadPage]);

  // Infinite scroll sentinel
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreRef.current && !isLoadingMoreRef.current && !isLoadingRef.current) {
          loadMore();
        }
      },
      { rootMargin: '400px' }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadMore]);

  // Lazy thumbnail renderer
  useEffect(() => {
    cardObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLDivElement;
            const id = el.dataset.materialId;
            if (id) {
              requestAnimationFrame(() => {
                renderThumbnail(id, el);
              });
              cardObserverRef.current?.unobserve(el);
            }
          }
        });
      },
      { rootMargin: '200px' }
    );
    return () => cardObserverRef.current?.disconnect();
  }, []);

  // Re-observe when materials change
  useEffect(() => {
    if (!cardObserverRef.current) return;
    const els = document.querySelectorAll('[data-material-id]');
    els.forEach(el => cardObserverRef.current!.observe(el));
  }, [materials.length]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleTagFilter = useCallback((tag: string) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
  }, [selectedTag]);

  // Client-side filtering/sorting
  const filteredMaterials = React.useMemo(() => {
    let result = selectedTag ? materials.filter(m => m.tags.includes(selectedTag)) : [...materials];
    if (sortMode === 'hot') {
      result.sort((a, b) => (b.views + b.likes * 3) - (a.views + a.likes * 3));
    }
    return result;
  }, [materials, selectedTag, sortMode]);

  const handleViewMaterial = useCallback(async (material: MaterialData) => {
    if (!material.grid && material.id) {
      try {
        const detail = await getMaterialDetail(material.id);
        if (detail) {
          setSelectedMaterial(detail);
        } else {
          setSelectedMaterial(material);
        }
      } catch {
        setSelectedMaterial(material);
      }
    } else {
      setSelectedMaterial(material);
    }
    incrementMaterialViews(material.id);
  }, []);

  const handleLike = useCallback(async (material: MaterialData, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLikes = await incrementMaterialLikes(material.id);
    if (newLikes !== null) {
      setMaterials(prev => prev.map(m =>
        m.id === material.id ? { ...m, likes: newLikes } : m
      ));
    }
  }, []);

  const handleApply = useCallback(() => {
    if (selectedMaterial) {
      onApplyMaterial(selectedMaterial);
      onClose();
    }
  }, [selectedMaterial, onApplyMaterial, onClose]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };

  // Detail image renderer
  useEffect(() => {
    if (selectedMaterial?.grid) {
      renderDetailImage(selectedMaterial).then(setDetailImage);
    } else {
      setDetailImage(null);
    }
  }, [selectedMaterial]);

  return (
    <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-6xl h-[90vh] md:h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 italic">素材广场</h2>
              <p className="text-xs md:text-sm text-slate-400 font-medium">发现和分享精彩的拼豆作品 ({totalCount})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 hover:bg-slate-100 rounded-xl transition-all">
            <svg className="w-6 h-6 md:w-7 md:h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar (desktop) */}
          <div className="hidden md:flex md:w-72 lg:w-80 bg-slate-50 p-4 flex-col gap-4 overflow-y-auto shrink-0 border-r border-slate-200">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">搜索</label>
              <div className="relative">
                <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                  placeholder="搜索素材..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all pl-10" />
                <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">排序</label>
              <div className="flex gap-2">
                <button onClick={() => setSortMode('latest')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-black transition-all ${sortMode === 'latest' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                  🕐 最新
                </button>
                <button onClick={() => setSortMode('hot')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-black transition-all ${sortMode === 'hot' ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                  🔥 热门
                </button>
              </div>
            </div>
            {allTags.length > 0 && (
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">标签</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedTag('')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${!selectedTag ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                    全部
                  </button>
                  {allTags.slice(0, isTagsExpanded ? allTags.length : 6).map(tag => (
                    <button key={tag} onClick={() => handleTagFilter(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                      {tag}
                    </button>
                  ))}
                  {allTags.length > 6 && (
                    <button onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                      className="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                      {isTagsExpanded ? '收起' : `+${allTags.length - 6}`}
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-slate-200">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">统计</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">素材总数</span>
                  <span className="font-bold text-slate-900">{totalCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">当前页数</span>
                  <span className="font-bold text-slate-900">{currentPage}/{totalPages || 1}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile header */}
            <div className="md:hidden p-4 bg-white border-b border-slate-200 shrink-0">
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                    placeholder="搜索素材..."
                    className="w-full px-4 py-3 bg-slate-100 border-0 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all pl-10" />
                  <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button onClick={() => setSortMode(s => s === 'latest' ? 'hot' : 'latest')}
                  className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${sortMode === 'hot' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {sortMode === 'hot' ? '🔥 热门' : '🕐 最新'}
                </button>
              </div>
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedTag('')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${!selectedTag ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    全部
                  </button>
                  {allTags.slice(0, isTagsExpanded ? allTags.length : 6).map(tag => (
                    <button key={tag} onClick={() => handleTagFilter(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 italic mb-2">暂无素材</h3>
                  <p className="text-xs md:text-sm text-slate-400 font-medium max-w-md">
                    {searchQuery || selectedTag ? '没有找到匹配的素材' : '还没有人分享素材，快来分享第一个吧！'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                    {filteredMaterials.map((material) => (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        onClick={() => handleViewMaterial(material)}
                        onLike={(e) => handleLike(material, e)}
                      />
                    ))}
                  </div>
                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent"></div>
                    </div>
                  )}
                  <div ref={sentinelRef} className="h-1" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Detail modal */}
        {selectedMaterial && (
          <DetailModal
            material={selectedMaterial}
            detailImage={detailImage}
            onApply={handleApply}
            onClose={() => setSelectedMaterial(null)}
            formatDate={formatDate}
          />
        )}
      </div>
    </div>
  );
};

// ---- Material Card ----

interface MaterialCardProps {
  material: MaterialData;
  onClick: () => void;
  onLike: (e: React.MouseEvent) => void;
}

const MaterialCard: React.FC<MaterialCardProps> = React.memo(({ material, onClick, onLike }) => {
  const placeholderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = placeholderRef.current;
    if (!el) return;
    el.setAttribute('data-material-id', material.id);
    if (material.thumbnailGrid) {
      el.setAttribute('data-thumbnail', JSON.stringify(material.thumbnailGrid));
    }
    if (material.pixelStyle) {
      el.setAttribute('data-pixel-style', material.pixelStyle);
    }
  }, [material.id, material.thumbnailGrid, material.pixelStyle]);

  return (
    <div onClick={onClick}
      className="group cursor-pointer bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border-2 border-transparent hover:border-indigo-500">
      <div className="aspect-square bg-slate-100 relative overflow-hidden p-2 md:p-0">
        <div ref={placeholderRef} className="w-full h-full flex items-center justify-center">
          <canvas className="w-full h-full object-contain hidden" />
          <div className="canvas-loading animate-pulse rounded-full h-6 w-6 md:h-8 md:w-8 border-2 border-indigo-400 border-t-transparent" />
        </div>
      </div>
      <div className="p-2 md:p-3">
        <h4 className="text-xs md:text-sm font-bold text-slate-900 truncate mb-1">{material.title}</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500">
            <span>{material.author}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{material.gridWidth || material.gridSize}×{material.gridHeight || material.gridSize}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            {material.views > 0 && <span>👁 {material.views}</span>}
            <button onClick={onLike} className="hover:scale-110 transition-transform">
              ❤️ {material.likes > 0 ? material.likes : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

MaterialCard.displayName = 'MaterialCard';

// ---- Detail Modal ----

interface DetailModalProps {
  material: MaterialData;
  detailImage: string | null;
  onApply: () => void;
  onClose: () => void;
  formatDate: (ts: number) => string;
}

const DetailModal: React.FC<DetailModalProps> = ({ material, detailImage, onApply, onClose, formatDate }) => (
  <div className="fixed inset-0 bg-black/80 z-[2001] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm">
    <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
      <div className="p-4 md:p-6 border-b border-slate-200 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl md:text-2xl font-black text-slate-900 italic mb-2">{material.title}</h3>
          <p className="text-sm md:text-base text-slate-600 mb-3">{material.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
            <div className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-medium">
              {material.gridWidth || material.gridSize}×{material.gridHeight || material.gridSize}
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium">
              {material.author}
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium">
              {formatDate(material.createdAt)}
            </div>
          </div>
          {material.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {material.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">{tag}</span>
              ))}
            </div>
          )}
        </div>
        <button onClick={onClose} className="p-2 md:p-3 hover:bg-slate-100 rounded-xl transition-all shrink-0">
          <svg className="w-6 h-6 md:w-7 md:h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 md:p-6 flex flex-col items-center gap-6">
        <div className="w-full max-w-2xl bg-slate-100 rounded-3xl overflow-hidden">
          {detailImage ? (
            <img src={detailImage} alt={material.title} className="w-full h-auto" />
          ) : (
            <div className="aspect-square flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          )}
        </div>
        <div className="flex gap-3 w-full max-w-2xl">
          <button onClick={onApply}
            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
            一键应用
          </button>
          <button onClick={onClose}
            className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold text-base hover:bg-slate-200 transition-all">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ---- Canvas rendering helpers (module-level) ----

const PREVIEW_SIZE_PX = 28;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.closePath();
}

function renderThumbnail(materialId: string, container: HTMLDivElement) {
  let canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.appendChild(canvas);
  }

  const spinner = container.querySelector('.canvas-loading') as HTMLElement | null;
  if (spinner) spinner.style.display = 'none';

  canvas.classList.remove('hidden');
  canvas.classList.add('w-full', 'h-full', 'object-contain');

  const gridRaw = container.getAttribute('data-thumbnail');
  if (!gridRaw) return;
  let grid: string[][];
  try { grid = JSON.parse(gridRaw); } catch { return; }

  const h = grid.length;
  const w = grid[0]?.length || 0;
  if (!w || !h) return;

  const maxDim = Math.max(w, h);
  const scale = PREVIEW_SIZE_PX / maxDim;
  const cellSize = Math.max(1, Math.floor(scale));

  canvas.width = w * cellSize;
  canvas.height = h * cellSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pixelStyle = container.getAttribute('data-pixel-style') || 'SQUARE';

  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const color = grid[row]?.[col];
      if (!color || color === '#FFFFFF') continue;
      ctx.fillStyle = color;

      if (pixelStyle === 'CIRCLE') {
        ctx.beginPath();
        ctx.arc(col * cellSize + cellSize / 2, row * cellSize + cellSize / 2, cellSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (pixelStyle === 'ROUNDED') {
        roundRect(ctx, col * cellSize, row * cellSize, cellSize, cellSize, Math.max(1, cellSize / 4));
        ctx.fill();
      } else {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }
}

async function renderDetailImage(material: MaterialData): Promise<string | null> {
  if (!material.grid) return null;
  const cellSize = 18;
  const gridWidth = material.gridWidth || material.gridSize || 32;
  const gridHeight = material.gridHeight || material.gridSize || 32;

  const canvas = document.createElement('canvas');
  canvas.width = gridWidth * cellSize;
  canvas.height = gridHeight * cellSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const color = material.grid[row]?.[col];
      if (!color || color === '#FFFFFF') continue;
      ctx.fillStyle = color;

      if (material.pixelStyle === PixelStyle.CIRCLE) {
        ctx.beginPath();
        ctx.arc(col * cellSize + cellSize / 2, row * cellSize + cellSize / 2, cellSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (material.pixelStyle === PixelStyle.ROUNDED) {
        roundRect(ctx, col * cellSize, row * cellSize, cellSize, cellSize, Math.max(1, cellSize / 4));
        ctx.fill();
      } else {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }

  return canvas.toDataURL('image/png');
}
