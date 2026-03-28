import { useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';

interface FeedbackOptions {
  enabled?: boolean;
  debounceMs?: number;
}

export function useHapticFeedback(options: FeedbackOptions = {}) {
  const { enabled = true, debounceMs = 50 } = options;
  const lastFeedbackTime = useRef<Record<string, number>>({});

  const triggerFeedback = useCallback(
    async (type: string, feedbackFn: () => Promise<void>) => {
      if (!enabled) return;

      const now = Date.now();
      const lastTime = lastFeedbackTime.current[type] || 0;

      // Debounce same feedback type
      if (now - lastTime < debounceMs) {
        return;
      }

      try {
        await feedbackFn();
        lastFeedbackTime.current[type] = now;
      } catch (error) {
        // Haptics not supported on device
        console.warn('Haptic feedback not available:', error);
      }
    },
    [enabled, debounceMs]
  );

  const toolChange = useCallback(() => {
    return triggerFeedback('toolChange', () =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    );
  }, [triggerFeedback]);

  const pixelPlace = useCallback(() => {
    return triggerFeedback('pixelPlace', () =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    );
  }, [triggerFeedback]);

  const fillComplete = useCallback(() => {
    return triggerFeedback('fillComplete', () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    );
  }, [triggerFeedback]);

  const colorPick = useCallback(() => {
    return triggerFeedback('colorPick', () =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    );
  }, [triggerFeedback]);

  const shapeComplete = useCallback(() => {
    return triggerFeedback('shapeComplete', () =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    );
  }, [triggerFeedback]);

  return {
    toolChange,
    pixelPlace,
    fillComplete,
    colorPick,
    shapeComplete,
    // Generic trigger for custom feedback
    trigger: triggerFeedback,
  };
}
