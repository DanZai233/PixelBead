import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getMaterialList, searchMaterials, getMaterialFromUpstash, incrementMaterialViews, incrementMaterialLikes, type MaterialData } from '../services/upstashService';
import { PixelStyle } from '../types';

interface MaterialGalleryProps {
  onApplyMaterial: (material: MaterialData) => void;
  onClose: () => void;
}

const PREVIEW_SIZE = 20;

export const MaterialGallery: React.FC<MaterialGalleryProps> = ({ onApplyMaterial, onClose }) => {
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<MaterialData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialData | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [detailImage, setDetailImage] = useState<string | null>(null);

  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    materials.forEach(m => m.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [materials]);

  const loadMaterials = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMaterialList();
      setMaterials(data);
      setFilteredMaterials(data);
    } catch (error) {
      console.error('加载素材失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    try {
      let results;
      if (query.trim()) {
        results = await searchMaterials(query);
      } else {
        results = await getMaterialList();
      }
      setFilteredMaterials(results);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTagFilter = useCallback((tag: string) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
  }, [selectedTag]);

  useEffect(() => {
    if (selectedTag) {
      const filtered = materials.filter(m => m.tags.includes(selectedTag));
      setFilteredMaterials(filtered);
    } else {
      setFilteredMaterials(materials);
    }
  }, [selectedTag, materials]);

  const handleViewMaterial = useCallback(async (material: MaterialData) => {
    setSelectedMaterial(material);
    await incrementMaterialViews(material.id);
  }, []);

  const handleLike = useCallback(async (material: MaterialData, e: React.MouseEvent) => {
    e.stopPropagation();
    await incrementMaterialLikes(material.id);
    loadMaterials();
  }, [loadMaterials]);

  const handleApply = useCallback(() => {
    if (selectedMaterial) {
      onApplyMaterial(selectedMaterial);
      onClose();
    }
  }, [selectedMaterial, onApplyMaterial, onClose]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}/${String(date.getMonth() +1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };

  const generateThumbnail = useCallback((material: MaterialData): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';
    
    const roundRect = (x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x, y + radius);
      ctx.closePath();
    };
    
    let cellSize: number;
    let offsetX: number;
    let offsetY: number;
    
    if (material.gridSize <= PREVIEW_SIZE) {
      canvas.width = PREVIEW_SIZE;
      canvas.height = PREVIEW_SIZE;
      
      cellSize = Math.floor(PREVIEW_SIZE / material.gridSize);
      offsetX = (PREVIEW_SIZE - material.gridSize * cellSize) / 2;
      offsetY = (PREVIEW_SIZE - material.gridSize * cellSize) / 2;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      
      for (let row = 0; row < material.gridSize; row++) {
        for (let col = 0; col < material.gridSize; col++) {
          const color = material.grid[row]?.[col];
          if (color && color !== '#FFFFFF') {
            ctx.fillStyle = color;
            
            if (material.pixelStyle === PixelStyle.CIRCLE) {
              ctx.beginPath();
              ctx.arc(
                offsetX + col * cellSize + cellSize / 2,
                offsetY + row * cellSize + cellSize / 2,
                cellSize / 2,
                0,
                Math.PI * 2
              );
              ctx.fill();
            } else if (material.pixelStyle === PixelStyle.ROUNDED) {
              const radius = Math.max(1, cellSize / 4);
              roundRect(
                offsetX + col * cellSize,
                offsetY + row * cellSize,
                cellSize,
                cellSize,
                radius
              );
              ctx.fill();
            } else {
              ctx.fillRect(
                offsetX + col * cellSize,
                offsetY + row * cellSize,
                cellSize,
                cellSize
              );
            }
          }
        }
      }
    } else {
      canvas.width = PREVIEW_SIZE;
      canvas.height = PREVIEW_SIZE;
      
      const scale = PREVIEW_SIZE / material.gridSize;
      cellSize = Math.floor(scale);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      
      for (let row = 0; row < material.gridSize; row++) {
        for (let col = 0; col < material.gridSize; col++) {
          const color = material.grid[row]?.[col];
          if (color && color !== '#FFFFFF') {
            ctx.fillStyle = color;
            
            if (material.pixelStyle === PixelStyle.CIRCLE) {
              ctx.beginPath();
              ctx.arc(
                col * cellSize + cellSize / 2,
                row * cellSize + cellSize / 2,
                cellSize / 2,
                0,
                Math.PI * 2
              );
              ctx.fill();
            } else if (material.pixelStyle === PixelStyle.ROUNDED) {
              const radius = Math.max(1, scale / 4);
              roundRect(
                col * scale,
                row * scale,
                scale,
                scale,
                radius
              );
              ctx.fill();
            } else {
              ctx.fillRect(
                col * scale,
                row * scale,
                scale,
                scale
              );
            }
          }
        }
      }
    }
    
    return canvas.toDataURL('image/png');
  }, []);

  useEffect(() => {
    materials.forEach(async (material) => {
      if (!thumbnails[material.id]) {
        const thumbnail = generateThumbnail(material);
        setThumbnails(prev => ({
          ...prev,
          [material.id]: thumbnail,
        }));
      }
    });
  }, [materials, thumbnails, generateThumbnail]);

  useEffect(() => {
    if (selectedMaterial) {
      const detailCanvas = document.createElement('canvas');
      const cellSize = 20;
      
      detailCanvas.width = selectedMaterial.gridSize * cellSize;
      detailCanvas.height = selectedMaterial.gridSize * cellSize;
      const ctx = detailCanvas.getContext('2d');
      
      if (!ctx) return;
      
      const roundRect = (x: number, y: number, width: number, height: number, radius: number) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, detailCanvas.width, detailCanvas.height);
      
      for (let row = 0; row < selectedMaterial.gridSize; row++) {
        for (let col = 0; col < selectedMaterial.gridSize; col++) {
          const color = selectedMaterial.grid[row]?.[col];
          if (color && color !== '#FFFFFF') {
            ctx.fillStyle = color;
            
            if (selectedMaterial.pixelStyle === PixelStyle.CIRCLE) {
              ctx.beginPath();
              ctx.arc(
                col * cellSize + cellSize / 2,
                row * cellSize + cellSize / 2,
                cellSize / 2,
                0,
                Math.PI * 2
              );
              ctx.fill();
            } else if (selectedMaterial.pixelStyle === PixelStyle.ROUNDED) {
              const radius = Math.max(1, cellSize / 4);
              roundRect(
                col * cellSize,
                row * cellSize,
                cellSize,
                cellSize,
                radius
              );
              ctx.fill();
            } else {
              ctx.fillRect(
                col * cellSize,
                row * cellSize,
                cellSize,
                cellSize
              );
            }
          }
        }
      }
      
      setDetailImage(detailCanvas.toDataURL('image/png'));
    }
  }, [selectedMaterial]);

  return (
    <div className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-6xl h-[90vh] md:h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 italic">素材广场</h2>
              <p className="text-xs md:text-sm text-slate-400 font-medium">发现和分享精彩的拼豆作品</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 md:p-3 hover:bg-slate-100 rounded-xl transition-all"
          >
            <svg className="w-6 h-6 md:w-7 md:h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-full md:w-72 lg:w-80 bg-slate-50 p-4 overflow-y-auto shrink-0 border-r border-slate-200">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">搜索</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="搜索素材..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all pl-10"
                  />
                  <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {allTags.length > 0 && (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">标签</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTag('')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${!selectedTag ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                      全部
                    </button>
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagFilter(tag)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  统计
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">素材总数</span>
                    <span className="font-bold text-slate-900">{filteredMaterials.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">标签数量</span>
                    <span className="font-bold text-slate-900">{allTags.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                  {searchQuery || selectedTag ? '没有找到匹配的素材，试试其他搜索词或标签' : '还没有人分享素材，快来分享第一个吧！'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredMaterials.map((material) => (
                  <div
                    key={material.id}
                    onClick={() => handleViewMaterial(material)}
                    className="group cursor-pointer bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all overflow-hidden border-2 border-transparent hover:border-indigo-500"
                  >
                    <div className="aspect-square bg-slate-100 relative overflow-hidden">
                      {thumbnails[material.id] ? (
                        <img 
                          src={thumbnails[material.id]}
                          alt={material.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 font-bold text-sm text-indigo-600">
                          查看详情
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-sm md:text-base text-slate-900 truncate mb-1">{material.title}</h3>
                      <p className="text-[10px] md:text-xs text-slate-500 line-clamp-2 mb-2">{material.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="truncate max-w-[60px]">{material.author}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{material.views}</span>
                          </div>
                          <button
                            onClick={(e) => handleLike(material, e)}
                            className="flex items-center gap-1 text-[10px] text-pink-500 hover:text-pink-600 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            <span>{material.likes}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedMaterial && (
          <div className="fixed inset-0 bg-black/80 z-[2001] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 md:p-6 border-b border-slate-200 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 italic mb-2">{selectedMaterial.title}</h3>
                  <p className="text-sm md:text-base text-slate-600 mb-3">{selectedMaterial.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
                    <div className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      {selectedMaterial.gridSize}×{selectedMaterial.gridSize}
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 016 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {selectedMaterial.author}
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(selectedMaterial.createdAt)}
                    </div>
                  </div>
                  {selectedMaterial.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedMaterial.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="p-2 md:p-3 hover:bg-slate-100 rounded-xl transition-all shrink-0"
                >
                  <svg className="w-6 h-6 md:w-7 md:h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 md:p-6 flex flex-col items-center gap-6">
                <div className="w-full max-w-2xl bg-slate-100 rounded-3xl overflow-hidden">
                  {detailImage ? (
                    <img 
                      src={detailImage}
                      alt={selectedMaterial.title}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="aspect-square flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 w-full max-w-2xl">
                  <button
                    onClick={handleApply}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    一键应用
                  </button>
                  <button
                    onClick={() => setSelectedMaterial(null)}
                    className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold text-base hover:bg-slate-200 transition-all"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
