import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkvStorage';
// @ts-ignore - Workaround for path resolution
import { AIProvider, AI_MODELS, DEFAULT_ENDPOINTS } from '../../../packages/shared-types/src';

interface AIModelInfo {
  id: string;
  name: string;
  isImageModel?: boolean;
}

interface AIStore {
  provider: AIProvider;
  apiKey: string;
  endpoint: string;
  model: string;
  imageUrlModel: string;
  favorites: string[];

  // Actions
  setProvider: (provider: AIProvider) => void;
  setApiKey: (key: string) => void;
  setEndpoint: (endpoint: string) => void;
  setModel: (model: string) => void;
  setImageUrlModel: (model: string) => void;
  resetConfig: () => void;
  getModelsForProvider: () => AIModelInfo[];
  getAvailableModels: () => typeof AI_MODELS;
}

export const useAiStore = create<AIStore>()(
  persist(
    (set, get) => ({
      provider: AIProvider.OPENAI,
      apiKey: '',
      endpoint: '',
      model: '',
      imageUrlModel: '',
      favorites: [],

      setProvider: (provider: AIProvider) => {
        set({ provider });
        // Update endpoint and model when provider changes
        const newEndpoint = DEFAULT_ENDPOINTS[provider] || '';
        const models = AI_MODELS[provider] || [];
        const newModel = (models.find((m: AIModelInfo) => m.isImageModel) as AIModelInfo)?.id || (models[0] as AIModelInfo)?.id || '';
        set({
          endpoint: newEndpoint,
          model: newModel,
        });
      },

      setApiKey: (key: string) => set({ apiKey: key }),
      setEndpoint: (endpoint: string) => set({ endpoint }),
      setModel: (model: string) => set({ model }),
      setImageUrlModel: (model: string) => set({ imageUrlModel: model }),

      resetConfig: () => set({
        provider: AIProvider.OPENAI,
        apiKey: '',
        endpoint: '',
        model: '',
        imageUrlModel: '',
        favorites: [],
      }),

      getModelsForProvider: () => {
        const { provider } = get();
        const models = AI_MODELS[provider] || [];
        // Filter for image models only
        return models.filter((m: AIModelInfo) => m.isImageModel) as AIModelInfo[];
      },

      getAvailableModels: () => {
        return AI_MODELS;
      },
    }),
    {
      name: 'ai-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
