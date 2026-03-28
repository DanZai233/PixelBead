import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useCanvasStore } from '../../stores/canvasStore';
import { VirtualJoystick } from './VirtualJoystick';

const JOYSTICK_SIZE = 80;
const JOYSTICK_MAX_RADIUS = 40;
const ZOOM_SENSITIVITY = 0.01;

export function JoystickContainer() {
  const panOffset = useCanvasStore(state => state.panOffset);
  const zoom = useCanvasStore(state => state.zoom);
  const setPanOffset = useCanvasStore(state => state.setPanOffset);
  const setZoom = useCanvasStore(state => state.setZoom);

  const handlePan = (dx: number, dy: number) => {
    setPanOffset(
      panOffset.x + dx * 0.5, // Sensitivity factor
      panOffset.y + dy * 0.5
    );
  };

  const handleZoom = (dy: number) => {
    // Drag up (negative dy) = zoom in
    // Drag down (positive dy) = zoom out
    const zoomDelta = -dy * ZOOM_SENSITIVITY;
    const newZoom = Math.max(0.5, Math.min(3.0, zoom + zoomDelta));
    setZoom(newZoom);
  };

  return (
    <View style={styles.container}>
      {/* Left joystick for panning */}
      <View style={styles.joystickWrapper}>
        <VirtualJoystick
          type="pan"
          maxRadius={JOYSTICK_MAX_RADIUS}
          size={JOYSTICK_SIZE}
          onPan={handlePan}
          hapticFeedback={true}
        />
      </View>

      {/* Right joystick for zoom */}
      <View style={styles.joystickWrapperRight}>
        <VirtualJoystick
          type="zoom"
          maxRadius={JOYSTICK_MAX_RADIUS}
          size={JOYSTICK_SIZE}
          onZoom={handleZoom}
          hapticFeedback={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 100,
  },
  joystickWrapper: {
    position: 'absolute',
    bottom: 32,
    left: 32,
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  joystickWrapperRight: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
});
