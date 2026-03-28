export type EasingFunction = (t: number) => number;
export type AnimationProgress = (progress: number) => void;
export type AnimationComplete = () => void;

export interface AnimationOptions {
  duration: number;
  easing?: EasingFunction;
  onProgress?: AnimationProgress;
  onComplete?: AnimationComplete;
}

// Easing functions
export const linear: EasingFunction = (t) => t;

export const easeInOut: EasingFunction = (t) => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

export function animateValue(
  start: number,
  end: number,
  options: AnimationOptions
): () => void {
  const { duration, easing = linear, onProgress, onComplete } = options;
  const startTime = performance.now();
  let cancelled = false;

  const animate = (currentTime: number) => {
    if (cancelled) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const value = start + (end - start) * easedProgress;

    if (onProgress) {
      onProgress(value);
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      if (onComplete) {
        onComplete();
      }
    }
  };

  requestAnimationFrame(animate);

  // Return cancel function
  return () => {
    cancelled = true;
  };
}

export function createSmoothAnimation(
  options: AnimationOptions
): {
  start: () => void;
  cancel: () => void;
  isAnimating: () => boolean;
} {
  let animationFrameId: number | null = null;
  let startTime: number | null = null;
  let isRunning = false;

  const { duration, easing = linear, onProgress, onComplete } = options;

  const animate = (currentTime: number) => {
    if (!isRunning) return;

    if (!startTime) startTime = currentTime;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    if (onProgress) {
      onProgress(easedProgress);
    }

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      isRunning = false;
      startTime = null;
      if (onComplete) {
        onComplete();
      }
    }
  };

  return {
    start: () => {
      if (isRunning) return;
      isRunning = true;
      startTime = null;
      animationFrameId = requestAnimationFrame(animate);
    },
    cancel: () => {
      isRunning = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      startTime = null;
    },
    isAnimating: () => isRunning,
  };
}
