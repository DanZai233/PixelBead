import { create } from 'zustand';
import { generateShareLink, loadSharedProject } from '../services/shareService';
import { useCanvasStore } from './canvasStore';
import Clipboard from 'expo-clipboard';

interface ShareState {
  shareUrl: string;
  isGenerating: boolean;
  error: string | null;
  isCopying: boolean;

  // Actions
  generateShareLink: (projectData: {
    name: string;
    grid: any[][];
    gridWidth: number;
    gridHeight: number;
    pixelStyle: any;
  }) => Promise<void>;
  copyToClipboard: () => Promise<void>;
  resetShare: () => void;
  loadSharedProject: (shareId: string) => Promise<void>;
}

export const useShareStore = create<ShareState>()((set, get) => ({
  shareUrl: '',
  isGenerating: false,
  error: null,
  isCopying: false,

  generateShareLink: async (projectData) => {
    set({ isGenerating: true, error: null, shareUrl: '' });

    try {
      const url = await generateShareLink(projectData);
      set({ shareUrl: url, isGenerating: false });
    } catch (error: any) {
      console.error('Error generating share link:', error);
      set({
        isGenerating: false,
        error: error.message || 'Failed to generate share link',
      });
      throw error;
    }
  },

  copyToClipboard: async () => {
    const { shareUrl } = get();
    if (!shareUrl) return;

    set({ isCopying: true });

    try {
      await Clipboard.setStringAsync(shareUrl);
      setTimeout(() => set({ isCopying: false }), 1000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      set({ isCopying: false });
      throw error;
    }
  },

  resetShare: () => {
    set({ shareUrl: '', error: null });
  },

  loadSharedProject: async (shareId: string) => {
    try {
      const shareData = await loadSharedProject(shareId);
      const { loadMaterialIntoCanvas } = useCanvasStore.getState();

      // Convert grid from ShareData format to Material format
      const material = {
        ...shareData,
        id: shareId,
        title: shareData.name,
        author: 'Shared',
        description: '',
        tags: [],
        createdAt: shareData.createdAt,
        views: 0,
        likes: 0,
      };

      loadMaterialIntoCanvas(material);
    } catch (error: any) {
      console.error('Error loading shared project:', error);
      set({ error: error.message || 'Failed to load shared project' });
      throw error;
    }
  },
}));
