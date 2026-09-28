import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SavedProject } from '../utils/projectStorage';

interface ProjectsModalProps {
  projects: SavedProject[];
  activeProjectId: string | null;
  currentName: string;
  currentCanvasSize: string;
  onClose: () => void;
  onOpenProject: (project: SavedProject) => void;
  onSaveCurrent: (name: string) => void;
  onSaveAsNew: (name: string) => void;
  onDuplicate: (project: SavedProject) => void;
  onRename: (project: SavedProject, name: string) => void;
  onToggleFavorite: (project: SavedProject) => void;
  onUpdateTags: (project: SavedProject, tags: string | string[]) => void;
  onDelete: (project: SavedProject) => void;
  onShareFile: (project: SavedProject) => void;
  onImportFile: (file: File) => void;
}

type ProjectSort = 'opened' | 'updated' | 'created' | 'name';

const getProjectStats = (project: SavedProject) => {
  const colorCounts = new Map<string, number>();
  let beadCount = 0;

  project.grid.forEach(row => {
    row.forEach(color => {
      if (color === '#FFFFFF') return;
      beadCount += 1;
      colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
    });
  });

  const palette = [...colorCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([color]) => color);

  return { beadCount, palette };
};

const formatProjectDate = (timestamp: number) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '未知时间';

  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
};

const formatRelativeProjectTime = (timestamp: number) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '未知时间';

  const elapsed = Date.now() - timestamp;
  if (elapsed < 60 * 1000) return '刚刚';
  if (elapsed < 60 * 60 * 1000) return `${Math.floor(elapsed / (60 * 1000))} 分钟前`;
  if (elapsed < 24 * 60 * 60 * 1000) return `${Math.floor(elapsed / (60 * 60 * 1000))} 小时前`;
  if (elapsed < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(elapsed / (24 * 60 * 60 * 1000))} 天前`;

  return formatProjectDate(timestamp);
};

const ProjectThumbnail: React.FC<{ project: SavedProject }> = ({ project }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const maxSize = 160;
    const scale = Math.max(1, Math.floor(maxSize / Math.max(project.gridWidth, project.gridHeight)));
    canvas.width = project.gridWidth * scale;
    canvas.height = project.gridHeight * scale;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    project.grid.forEach((row, rowIndex) => {
      row.forEach((color, colIndex) => {
        if (color === '#FFFFFF') return;
        context.fillStyle = color;
        context.fillRect(colIndex * scale, rowIndex * scale, scale, scale);
      });
    });
  }, [project]);

  return (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-inner sm:h-28 sm:w-28">
      <canvas ref={canvasRef} className="h-full w-full object-contain" />
    </div>
  );
};

const ProjectCard: React.FC<{
  project: SavedProject;
  isActive: boolean;
  renamingId: string | null;
  renameDraft: string;
  setRenameDraft: (value: string) => void;
  startRename: (project: SavedProject) => void;
  submitRename: (project: SavedProject) => void;
  cancelRename: () => void;
  onOpenProject: (project: SavedProject) => void;
  onDuplicate: (project: SavedProject) => void;
  onToggleFavorite: (project: SavedProject) => void;
  onUpdateTags: (project: SavedProject, tags: string | string[]) => void;
  onDelete: (project: SavedProject) => void;
  onShareFile: (project: SavedProject) => void;
}> = ({
  project,
  isActive,
  renamingId,
  renameDraft,
  setRenameDraft,
  startRename,
  submitRename,
  cancelRename,
  onOpenProject,
  onDuplicate,
  onToggleFavorite,
  onUpdateTags,
  onDelete,
  onShareFile,
}) => {
  const { beadCount, palette } = useMemo(() => getProjectStats(project), [project]);
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const recentTime = project.lastOpenedAt ?? project.updatedAt;

  const submitTagDraft = () => {
    if (!tagDraft.trim()) return;
    onUpdateTags(project, [...(project.tags || []), tagDraft]);
    setTagDraft('');
  };

  return (
    <div
      className={`rounded-3xl border-2 p-3 transition-all ${
        isActive
          ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-white'
          : 'border-slate-100 bg-white hover:border-slate-200'
      }`}
    >
      <div className="flex gap-3">
        <ProjectThumbnail project={project} />

        <div className="flex min-w-0 flex-1 flex-col">
          {renamingId === project.id ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={renameDraft}
                onChange={event => setRenameDraft(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') submitRename(project);
                  if (event.key === 'Escape') cancelRename();
                }}
                className="min-w-0 flex-1 rounded-lg border border-indigo-200 px-2 py-1.5 text-sm font-bold outline-none focus:border-indigo-400"
              />
              <button
                onClick={() => submitRename(project)}
                className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-black text-white active:scale-95"
              >
                确定
              </button>
              <button
                onClick={cancelRename}
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-black text-slate-600 active:scale-95"
              >
                取消
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-black text-slate-900" title={project.name}>
                {project.name}
              </p>
              <button
                onClick={() => onToggleFavorite(project)}
                title={project.favorite ? '取消收藏' : '收藏并置顶'}
                className={`shrink-0 rounded-lg p-1 transition-all active:scale-90 ${
                  project.favorite
                    ? 'bg-amber-100 text-amber-500'
                    : 'text-slate-300 hover:bg-slate-100 hover:text-amber-400'
                }`}
              >
                <svg
                  className="h-4 w-4"
                  fill={project.favorite ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.05 3.69c.32-.84 1.58-.84 1.9 0l1.8 4.68a1 1 0 00.58.6l4.94 1.6c.87.28.87 1.51 0 1.79l-4.94 1.6a1 1 0 00-.58.6l-1.8 4.68c-.32.84-1.58.84-1.9 0l-1.8-4.68a1 1 0 00-.58-.6l-4.94-1.6c-.87-.28-.87-1.51 0-1.79l4.94-1.6a1 1 0 00.58-.6l1.8-4.68z" />
                </svg>
              </button>
              {isActive && (
                <span className="shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-black text-white">
                  当前
                </span>
              )}
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
              {project.gridWidth} × {project.gridHeight}
            </span>
            <span className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
              {beadCount.toLocaleString()} 豆
            </span>
            <span
              className="rounded-lg bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700"
              title={`更新 ${formatProjectDate(project.updatedAt)}`}
            >
              {project.lastOpenedAt ? '打开' : '更新'} {formatRelativeProjectTime(recentTime)}
            </span>
          </div>

          {(project.tags?.length || tagEditorOpen) ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {project.tags?.map(tag => (
                <span
                  key={tag}
                  className="group flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600"
                >
                  #{tag}
                  <button
                    onClick={() => onUpdateTags(project, project.tags?.filter(item => item !== tag) || [])}
                    className="text-slate-300 transition-colors hover:text-red-500 group-hover:text-red-400"
                    title={`删除标签 ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={() => setTagEditorOpen(open => !open)}
                className="rounded-lg border border-dashed border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-400 transition-colors hover:border-indigo-200 hover:text-indigo-500"
              >
                {tagEditorOpen ? '收起' : '+ 标签'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setTagEditorOpen(true)}
              className="mt-2 rounded-lg border border-dashed border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-400 transition-colors hover:border-indigo-200 hover:text-indigo-500"
            >
              + 添加标签
            </button>
          )}

          {tagEditorOpen && (
            <div className="mt-2 flex items-center gap-1.5">
              <input
                value={tagDraft}
                onChange={event => setTagDraft(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitTagDraft();
                  }
                  if (event.key === 'Escape') {
                    setTagDraft('');
                    setTagEditorOpen(false);
                  }
                }}
                placeholder="输入标签，回车添加"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-bold outline-none focus:border-indigo-400"
              />
              <button
                onClick={submitTagDraft}
                className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-black text-white active:scale-95"
              >
                添加
              </button>
            </div>
          )}

          <div className="mt-auto pt-3">
            <p className="text-[10px] font-bold text-slate-400">主色调</p>
            <div className="mt-1 flex items-center gap-1.5">
              {palette.length > 0 ? (
                palette.map(color => (
                  <span
                    key={color}
                    title={color}
                    className="h-5 w-5 rounded-md border border-white shadow-sm ring-1 ring-slate-200"
                    style={{ backgroundColor: color }}
                  />
                ))
              ) : (
                <span className="text-[10px] text-slate-400">暂无用色</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        <button
          onClick={() => onOpenProject(project)}
          className="col-span-2 rounded-lg bg-indigo-600 py-2 text-xs font-black text-white active:scale-95 transition-all"
        >
          打开
        </button>
        <button
          onClick={() => startRename(project)}
          className="rounded-lg bg-slate-100 py-2 text-xs font-black text-slate-700 active:scale-95 transition-all"
        >
          重命名
        </button>
        <button
          onClick={() => onDuplicate(project)}
          className="rounded-lg bg-slate-100 py-2 text-xs font-black text-slate-700 active:scale-95 transition-all"
        >
          副本
        </button>
        <button
          onClick={() => onShareFile(project)}
          className="rounded-lg bg-emerald-50 py-2 text-xs font-black text-emerald-700 active:scale-95 transition-all"
        >
          分享文件
        </button>
        <button
          onClick={() => onDelete(project)}
          className="rounded-lg bg-red-50 py-2 text-xs font-black text-red-600 active:scale-95 transition-all"
        >
          删除
        </button>
      </div>
    </div>
  );
};

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  projects,
  activeProjectId,
  currentName,
  currentCanvasSize,
  onClose,
  onOpenProject,
  onSaveCurrent,
  onSaveAsNew,
  onDuplicate,
  onRename,
  onToggleFavorite,
  onUpdateTags,
  onDelete,
  onShareFile,
  onImportFile,
}) => {
  const [nameDraft, setNameDraft] = useState(currentName);
  const [searchDraft, setSearchDraft] = useState('');
  const [sortType, setSortType] = useState<ProjectSort>('updated');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameDraft(currentName);
  }, [currentName]);

  const totalBeadCount = useMemo(
    () => projects.reduce((total, project) => {
      return total + project.grid.reduce((rowTotal, row) => {
        return rowTotal + row.reduce((cellTotal, color) => cellTotal + (color === '#FFFFFF' ? 0 : 1), 0);
      }, 0);
    }, 0),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    const keyword = searchDraft.trim().toLowerCase();
    const matched = keyword
      ? projects.filter(project => {
          const haystack = [project.name, ...(project.tags || [])].join(' ').toLowerCase();
          return haystack.includes(keyword);
        })
      : [...projects];

    const tagFiltered = activeTag
      ? matched.filter(project => project.tags?.includes(activeTag))
      : matched;
    const favoriteFiltered = favoritesOnly
      ? tagFiltered.filter(project => project.favorite)
      : tagFiltered;

    return favoriteFiltered.sort((left, right) => {
      if (left.favorite !== right.favorite) return left.favorite ? -1 : 1;
      if (sortType === 'name') return left.name.localeCompare(right.name, 'zh-CN');
      if (sortType === 'created') return right.createdAt - left.createdAt;
      if (sortType === 'opened') {
        return (right.lastOpenedAt ?? right.updatedAt) - (left.lastOpenedAt ?? left.updatedAt);
      }
      return right.updatedAt - left.updatedAt;
    });
  }, [activeTag, favoritesOnly, projects, searchDraft, sortType]);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach(project => {
      project.tags?.forEach(tag => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([tag]) => tag);
  }, [projects]);

  const startRename = (project: SavedProject) => {
    setRenamingId(project.id);
    setRenameDraft(project.name);
  };

  const submitRename = (project: SavedProject) => {
    onRename(project, renameDraft);
    setRenamingId(null);
  };

  const cancelRename = () => setRenamingId(null);

  return (
    <div
      className="fixed inset-0 z-[1900] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]"
        onClick={event => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-100 px-5 pt-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-black text-slate-900 sm:text-xl">个人中心 · 我的作品</h2>
              <p className="mt-0.5 text-xs text-slate-500">保存当前进度，随时继续创作和管理文件</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-bold text-slate-400">作品数量</p>
              <p className="text-base font-black text-slate-900">{projects.length}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 px-3 py-2.5">
              <p className="text-[10px] font-bold text-amber-500">累计用豆</p>
              <p className="text-base font-black text-amber-700">{totalBeadCount.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-indigo-50 px-3 py-2.5">
              <p className="text-[10px] font-bold text-indigo-400">当前画布</p>
              <p className="truncate text-base font-black text-indigo-700">{currentCanvasSize}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={nameDraft}
              onChange={event => setNameDraft(event.target.value)}
              placeholder="作品名称"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-indigo-400"
            />
            <button
              onClick={() => onSaveCurrent(nameDraft)}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white transition-all active:scale-95"
            >
              {activeProjectId ? '保存进度' : '保存作品'}
            </button>
            <button
              onClick={() => onSaveAsNew(nameDraft)}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-black text-slate-700 transition-all active:scale-95"
            >
              另存新作品
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              <input
                value={searchDraft}
                onChange={event => setSearchDraft(event.target.value)}
                placeholder="搜索作品名称"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-bold outline-none focus:border-indigo-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortType}
                onChange={event => setSortType(event.target.value as ProjectSort)}
                className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-600 outline-none focus:border-indigo-400"
              >
                <option value="updated">最近更新</option>
                <option value="opened">最近打开</option>
                <option value="created">最近创建</option>
                <option value="name">名称排序</option>
              </select>
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) onImportFile(file);
                  event.target.value = '';
                }}
              />
              <button
                onClick={() => importInputRef.current?.click()}
                className="shrink-0 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-black text-white transition-all active:scale-95"
              >
                导入文件
              </button>
            </div>
          </div>

          {(favoritesOnly || allTags.length > 0) && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFavoritesOnly(value => !value)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black transition-all ${
                  favoritesOnly ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                ★ 收藏
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(current => (current === tag ? null : tag))}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black transition-all ${
                    activeTag === tag ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {projects.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 px-6 py-14 text-center">
              <p className="text-sm font-black text-slate-700">还没有保存的作品</p>
              <p className="mt-1 text-xs text-slate-500">画到一半也可以先保存，下次打开继续画。</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 px-6 py-14 text-center">
              <p className="text-sm font-black text-slate-700">没有找到匹配的作品</p>
              <p className="mt-1 text-xs text-slate-500">试试其他关键词，或清空搜索查看全部作品。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isActive={project.id === activeProjectId}
                  renamingId={renamingId}
                  renameDraft={renameDraft}
                  setRenameDraft={setRenameDraft}
                  startRename={startRename}
                  submitRename={submitRename}
                  cancelRename={cancelRename}
                  onOpenProject={onOpenProject}
                  onDuplicate={onDuplicate}
                  onToggleFavorite={onToggleFavorite}
                  onUpdateTags={onUpdateTags}
                  onDelete={onDelete}
                  onShareFile={onShareFile}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
