import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkvStorage';
import { fetchMaterials, publishMaterial, type Material } from '../services/galleryService';

interface GalleryState {
  materials: Material[];
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  favorites: string[];
  searchQuery: string;

  // Actions
  fetchMaterials: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  publishMaterial: (data: {
    title: string;
    author: string;
    description: string;
    tags: string[];
    gridWidth: number;
    gridHeight: number;
    pixelStyle: string;
    grid: any[][];
  }) => Promise<void>;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  setOffline: (status: boolean) => void;
  clearError: () => void;
}

export const useGalleryStore = create<GalleryState>()(
  persist(
    (set, get) => ({
  materials: [],
  isLoading: false,
  error: null,
  isOffline: false,
  favorites: [],
  searchQuery: '',

  fetchMaterials: async () => {
    const { searchQuery } = get();
    set({ isLoading: true, error: null });

    try {
      const materials = await fetchMaterials(searchQuery);
      set({ materials, isLoading: false, isOffline: false });
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      set({
        isLoading: false,
        error: 'Failed to load materials',
        isOffline: error.message === 'Network error',
      });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  publishMaterial: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const result = await publishMaterial(data);
      const { materials } = get();
      const newMaterial = { ...data, id: result.id, createdAt: Date.now(), views: 0, likes: 0 } as Material;
      set({ materials: [newMaterial, ...materials], isLoading: false });
    } catch (error: any) {
      console.error('Error publishing material:', error);
      set({
        isLoading: false,
        error: error.message || 'Failed to publish',
        isOffline: error.message === 'Network error',
      });
      throw error;
    }
  },

  toggleFavorite: (id: string) => {
    const { favorites } = get();
    if (favorites.includes(id)) {
      set({ favorites: favorites.filter((favId) => favId !== id) });
    } else {
      set({ favorites: [...favorites, id] });
    }
  },

  isFavorite: (id: string) => {
    const { favorites } = get();
    return favorites.includes(id);
  },

  setOffline: (status: boolean) => {
    set({ isOffline: status });
  },

  clearError: () => {
    set({ error: null });
  },

  likeMaterial: (id: string) => {
    const { materials } = get();
    const newMaterials = materials.map((m) => {
      if (m.id === id) {
        return { ...m, likes: m.likes + 1 };
      }
      return m;
    });
    set({ materials: newMaterials });
  },

  getFavorites: () => {
    const { materials, favorites } = get();
    return materials.filter((m) => favorites.includes(m.id));
  },

  clearFavorites: () => {
    set({ favorites: [] });
  },
    }),
    {
      name: 'gallery-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
