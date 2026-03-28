import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useVirtualJoystick } from '../../hooks/useVirtualJoystick';
import { meetsWCAGAA } from '../../utils/joystickUtils';

interface VirtualJoystickProps {
  type: 'pan' | 'zoom';
  maxRadius: number;
  size?: number;
  onPan?: (dx: number, dy: number) => void;
  onZoom?: (delta: number) => void;
  hapticFeedback?: boolean;
}

export function VirtualJoystick({
  type,
  maxRadius,
  size = 60,
  onPan,
  onZoom,
  hapticFeedback = false,
}: VirtualJoystickProps) {
  const { gesture, state } = useVirtualJoystick({
    maxRadius,
    onPan: (dx, dy, _direction, _magnitude) => {
      if (type === 'pan' && onPan) {
        onPan(dx, dy);
      } else if (type === 'zoom' && onZoom) {
        // Convert vertical drag to zoom delta
        onZoom(dy);
      }
    },
    hapticFeedback,
  });

  const backgroundColor = type === 'pan' ? '#3B82F6' : '#10B981'; // Blue for pan, Green for zoom
  const knobColor = '#FFFFFF';

  // Validate contrast ratio for accessibility
  const contrastRatio = meetsWCAGAA(knobColor, backgroundColor);

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            backgroundColor,
            opacity: state.isActive ? 0.8 : 0.4,
          },
          !contrastRatio && styles.contrastWarning,
        ]}
        accessibilityLabel={type === 'pan' ? 'Pan joystick' : 'Zoom joystick'}
        accessibilityRole="button"
        accessibilityState={{ selected: state.isActive }}
      >
        {/* Joystick knob */}
        <View
          style={[
            styles.knob,
            {
              width: size * 0.4,
              height: size * 0.4,
              backgroundColor: knobColor,
              transform: [
                {
                  translateX: Math.max(-maxRadius, Math.min(maxRadius, state.position.x)),
                },
                {
                  translateY: Math.max(-maxRadius, Math.min(maxRadius, state.position.y)),
                },
              ],
            },
          ]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999, // Circle
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    minHeight: 60,
  },
  knob: {
    borderRadius: 9999, // Circle
    position: 'absolute',
  },
  contrastWarning: {
    borderWidth: 2,
    borderColor: '#EF4444',
  },
});
