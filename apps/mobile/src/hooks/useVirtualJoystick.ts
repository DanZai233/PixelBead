import { useCallback, useRef, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { calculateJoystickDirection, calculateJoystickMagnitude } from '../utils/joystickUtils';

interface JoystickState {
  position: { x: number; y: number };
  direction: { x: number; y: number };
  magnitude: number;
  isActive: boolean;
}

interface UseVirtualJoystickOptions {
  maxRadius: number;
  onPan: (dx: number, dy: number, direction: { x: number; y: number }, magnitude: number) => void;
  onReset?: () => void;
  hapticFeedback?: boolean;
}

export function useVirtualJoystick(options: UseVirtualJoystickOptions) {
  const { maxRadius, onPan, onReset, hapticFeedback = false } = options;

  const [state, setState] = useState<JoystickState>({
    position: { x: 0, y: 0 },
    direction: { x: 0, y: 0 },
    magnitude: 0,
    isActive: false,
  });

  const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const previousMagnitudeRef = useRef(0);

  const updateState = useCallback(
    (dx: number, dy: number, isActive: boolean) => {
      const direction = calculateJoystickDirection(dx, dy);
      const magnitude = calculateJoystickMagnitude(dx, dy, maxRadius);

      setState({
        position: { x: dx, y: dy },
        direction,
        magnitude,
        isActive,
      });

      // Trigger callback
      onPan(dx, dy, direction, magnitude);

      // Optional: Haptic feedback on threshold crossing
      if (hapticFeedback) {
        const threshold = 0.5;
        const crossedThreshold = previousMagnitudeRef.current < threshold && magnitude >= threshold;
        if (crossedThreshold) {
          import('expo-haptics').then((Haptics) => {
            Haptics.default.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          });
        }
        previousMagnitudeRef.current = magnitude;
      }
    },
    [maxRadius, onPan, hapticFeedback]
  );

  const panGesture = Gesture.Pan()
    .onStart((event) => {
      centerRef.current = { x: event.absoluteX, y: event.absoluteY };
      previousMagnitudeRef.current = 0;
      updateState(0, 0, true);
    })
    .onUpdate((event) => {
      const dx = event.absoluteX - centerRef.current.x;
      const dy = event.absoluteY - centerRef.current.y;
      updateState(dx, dy, true);
    })
    .onEnd(() => {
      updateState(0, 0, false);
      previousMagnitudeRef.current = 0;
      if (onReset) {
        onReset();
      }
    });

  return {
    gesture: panGesture,
    state,
  };
}
