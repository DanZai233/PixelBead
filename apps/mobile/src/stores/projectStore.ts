// Project store with MMKV persistence
// Manages saved projects, current project, and project operations
// Use selector-based subscriptions: useProjectStore(state => state.projects)
// Avoid subscribing to entire store: useProjectStore() ❌

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkvStorage';
import {
  serializeProject,
  deserializeProject,
  generateProjectId,
  validateProjectData,
  type Project,
  type ProjectExport,
} from '../utils/projectStorage';
import { useCanvasStore } from './canvasStore';
import { PixelStyle } from '../types/shared';

/**
 * Project state interface
 */
interface ProjectState {
  // Projects list
  projects: Project[];
  currentProjectId: string | null;

  // Loading states
  isSaving: boolean;
  isLoading: boolean;

  // Actions
  saveProject: (name: string) => void;
  loadProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  createNewCanvas: (width: number, height: number) => void;
  clearCurrentCanvas: () => void;
  exportProjectAsJson: (projectId: string) => Promise<string>;
  importProjectFromJson: (jsonData: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      currentProjectId: null,
      isSaving: false,
      isLoading: false,

      saveProject: (name: string) => {
        set({ isSaving: true });

        try {
          const { projects, currentProjectId } = get();
          const canvasStore = useCanvasStore.getState();

          // Serialize current canvas state
          const exportData = serializeProject(canvasStore, name);
          const now = new Date().toISOString();

          if (currentProjectId) {
            // Update existing project
            const updatedProjects = projects.map((project) =>
              project.id === currentProjectId
                ? {
                    ...project,
                    name,
                    gridSize: exportData.gridSize,
                    grid: exportData.grid,
                    updatedAt: now,
                  }
                : project
            );
            set({ projects: updatedProjects });
          } else {
            // Create new project
            const newProject: Project = {
              id: generateProjectId(),
              name,
              gridSize: exportData.gridSize,
              grid: exportData.grid,
              createdAt: now,
              updatedAt: now,
            };
            set({
              projects: [newProject, ...projects],
              currentProjectId: newProject.id,
            });
          }
        } finally {
          set({ isSaving: false });
        }
      },

      loadProject: (projectId: string) => {
        set({ isLoading: true });

        try {
          const { projects } = get();
          const project = projects.find((p) => p.id === projectId);

          if (!project) {
            console.error(`Project not found: ${projectId}`);
            return;
          }

          // Deserialize project data
          const exportData: ProjectExport = {
            name: project.name,
            gridSize: project.gridSize,
            grid: project.grid,
            pixelStyle: PixelStyle.CIRCLE, // Default style, will be overridden by canvas store
            version: '1.0',
          };

          const { gridSize, grid, pixelStyle } = deserializeProject(exportData);

          // Update canvas store
          const canvasStore = useCanvasStore.getState();
          canvasStore.setGridSize(gridSize.width, gridSize.height);
          canvasStore.setPixelStyle(pixelStyle);

          // Restore grid pixel by pixel
          for (const [key, color] of grid.entries()) {
            const [x, y] = key.split(',').map(Number);
            canvasStore.setPixel(x, y, color);
          }

          // Reset undo/redo stacks
          canvasStore.clearCanvas();
          canvasStore.setGridSize(gridSize.width, gridSize.height);

          // Restore grid again after clear
          for (const [key, color] of grid.entries()) {
            const [x, y] = key.split(',').map(Number);
            canvasStore.setPixel(x, y, color);
          }

          set({ currentProjectId: projectId });
        } finally {
          set({ isLoading: false });
        }
      },

      deleteProject: (projectId: string) => {
        const { projects, currentProjectId } = get();
        const updatedProjects = projects.filter((p) => p.id !== projectId);

        // Clear currentProjectId if deleting current project
        const newCurrentProjectId = currentProjectId === projectId ? null : currentProjectId;

        set({
          projects: updatedProjects,
          currentProjectId: newCurrentProjectId,
        });
      },

      createNewCanvas: (width: number, height: number) => {
        const canvasStore = useCanvasStore.getState();

        // Clear canvas
        canvasStore.clearCanvas();

        // Set new grid size
        canvasStore.setGridSize(width, height);

        // Clear undo/redo stacks
        set({ currentProjectId: null });
      },

      clearCurrentCanvas: () => {
        const canvasStore = useCanvasStore.getState();
        canvasStore.clearCanvas();
      },

      exportProjectAsJson: async (projectId: string): Promise<string> => {
        const { projects } = get();
        const project = projects.find((p) => p.id === projectId);

        if (!project) {
          throw new Error(`Project not found: ${projectId}`);
        }

        const exportData: ProjectExport = {
          name: project.name,
          gridSize: project.gridSize,
          grid: project.grid,
          pixelStyle: PixelStyle.CIRCLE, // Default style
          version: '1.0',
        };

        return JSON.stringify(exportData, null, 2);
      },

      importProjectFromJson: (jsonData: string) => {
        try {
          const data = JSON.parse(jsonData);

          // Validate project data
          if (!validateProjectData(data)) {
            throw new Error('Invalid project data format');
          }

          // Create new project from imported data
          const exportData = data as ProjectExport;
          const now = new Date().toISOString();
          const newProject: Project = {
            id: generateProjectId(),
            name: `${exportData.name} (imported)`,
            gridSize: exportData.gridSize,
            grid: exportData.grid,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            projects: [newProject, ...state.projects],
            currentProjectId: newProject.id,
          }));

          // Load the imported project
          get().loadProject(newProject.id);
        } catch (error) {
          console.error('Failed to import project:', error);
          throw error;
        }
      },
    }),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
