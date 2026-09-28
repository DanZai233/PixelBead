import { PixelStyle } from '../types';

export interface ProjectBackground {
  src: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

export interface SavedProject {
  id: string;
  name: string;
  grid: string[][];
  gridWidth: number;
  gridHeight: number;
  pixelStyle: PixelStyle;
  selectedColor: string;
  zoom: number;
  backgroundImage?: ProjectBackground | null;
  createdAt: number;
  updatedAt: number;
}

const PROJECTS_KEY = 'pixelbead_projects_v1';
const PROJECT_FILE_TYPE = 'pixelbead-project';

function isColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{3,8}$/.test(value);
}

function isGrid(value: unknown, width: number, height: number): value is string[][] {
  return Array.isArray(value)
    && value.length === height
    && value.every(row => Array.isArray(row) && row.length === width && row.every(isColor));
}

export function loadProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item: any): SavedProject | null => {
        const width = Number(item?.gridWidth);
        const height = Number(item?.gridHeight);
        if (!isGrid(item?.grid, width, height)) return null;
        return {
          id: typeof item.id === 'string' ? item.id : createProjectId(),
          name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : '未命名作品',
          grid: item.grid,
          gridWidth: width,
          gridHeight: height,
          pixelStyle: Object.values(PixelStyle).includes(item.pixelStyle)
            ? item.pixelStyle
            : PixelStyle.SQUARE,
          selectedColor: isColor(item.selectedColor) ? item.selectedColor : '#000000',
          zoom: Number(item.zoom) || 80,
          backgroundImage: item.backgroundImage && typeof item.backgroundImage.src === 'string'
            ? item.backgroundImage
            : null,
          createdAt: Number(item.createdAt) || Date.now(),
          updatedAt: Number(item.updatedAt) || Number(item.createdAt) || Date.now(),
        };
      })
      .filter((item): item is SavedProject => Boolean(item))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveProjects(projects: SavedProject[]): boolean {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return true;
  } catch {
    return false;
  }
}

export function createProjectId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeProjectName(name: string): string {
  const clean = name.trim().replace(/\s+/g, ' ').slice(0, 60);
  return clean || '未命名作品';
}

export function duplicateProject(project: SavedProject): SavedProject {
  const now = Date.now();
  return {
    ...project,
    id: createProjectId(),
    name: normalizeProjectName(`${project.name} 副本`),
    grid: project.grid.map(row => [...row]),
    backgroundImage: project.backgroundImage ? { ...project.backgroundImage } : null,
    createdAt: now,
    updatedAt: now,
  };
}

export function safeProjectFileName(name: string): string {
  const clean = name.trim().replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);
  return `${clean || '未命名作品'}.pixelbead.json`;
}

export async function shareProjectFile(project: SavedProject): Promise<'shared' | 'downloaded'> {
  const payload = {
    type: PROJECT_FILE_TYPE,
    version: 1,
    project,
  };
  const fileName = safeProjectFileName(project.name);
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const file = new File([blob], fileName, { type: 'application/json' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: project.name });
      return 'shared';
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return 'shared';
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}

export function parseProjectFile(content: string): SavedProject {
  const data = JSON.parse(content);
  const project = data?.type === PROJECT_FILE_TYPE ? data.project : data;
  const width = Number(project?.gridWidth);
  const height = Number(project?.gridHeight);
  if (!isGrid(project?.grid, width, height)) {
    throw new Error('invalid project');
  }

  const now = Date.now();
  return {
    id: createProjectId(),
    name: normalizeProjectName(project.name || '导入的作品'),
    grid: project.grid,
    gridWidth: width,
    gridHeight: height,
    pixelStyle: Object.values(PixelStyle).includes(project.pixelStyle)
      ? project.pixelStyle
      : PixelStyle.SQUARE,
    selectedColor: isColor(project.selectedColor) ? project.selectedColor : '#000000',
    zoom: Number(project.zoom) || 80,
    backgroundImage: project.backgroundImage && typeof project.backgroundImage.src === 'string'
      ? project.backgroundImage
      : null,
    createdAt: Number(project.createdAt) || now,
    updatedAt: now,
  };
}
