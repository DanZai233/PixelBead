// Onboarding store with MMKV persistence
// Tracks first-time user onboarding status
// Use selector-based subscriptions: useOnboardingStore(state => state.hasSeenOnboarding)
// Avoid subscribing to entire store: useOnboardingStore() ❌

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkvStorage';

/**
 * Onboarding state interface
 */
interface OnboardingState {
  hasSeenOnboarding: boolean;
  onboardingStep: number; // 0-5 for multi-step guide
}

/**
 * Onboarding actions interface
 */
interface OnboardingActions {
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setOnboardingStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
}

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()(
  persist(
    (set) => ({
      // Initial state
      hasSeenOnboarding: false,
      onboardingStep: 0,

      // Actions
      completeOnboarding: () => {
        set({ hasSeenOnboarding: true });
      },

      resetOnboarding: () => {
        set({ hasSeenOnboarding: false, onboardingStep: 0 });
      },

      setOnboardingStep: (step) => {
        set({ onboardingStep: step });
      },

      nextStep: () => {
        set((state) => ({
          onboardingStep: Math.min(state.onboardingStep + 1, 5), // Max 5 steps
        }));
      },

      previousStep: () => {
        set((state) => ({
          onboardingStep: Math.max(state.onboardingStep - 1, 0), // Min 0
        }));
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
