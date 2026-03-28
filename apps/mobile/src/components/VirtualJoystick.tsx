import React, { memo, useState, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useCanvasStore } from '../stores/canvasStore';

interface VirtualJoystickProps {
  type: 'pan' | 'zoom';
  position?: 'left' | 'right';
}

const JOYSTICK_SIZE = 100;
const HANDLE_SIZE = 40;

const VirtualJoystick = memo<VirtualJoystickProps>(({ type, position = 'left' }) => {
  const [handlePosition, setHandlePosition] = useState({ x: 0, y: 0 });
  const active = useRef(false);
  const origin = useRef({ x: 0, y: 0 });

  const zoom = useCanvasStore((state) => state.zoom);
  const panOffset = useCanvasStore((state) => state.panOffset);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const setPanOffset = useCanvasStore((state) => state.setPanOffset);

  const handleGestureEvent = (event: any) => {
    if (!active.current) {
      active.current = true;
      origin.current = { x: event.nativeEvent.absoluteX, y: event.nativeEvent.absoluteY };
      setHandlePosition({ x: 0, y: 0 });
      return;
    }

    const deltaX = event.nativeEvent.absoluteX - origin.current.x;
    const deltaY = event.nativeEvent.absoluteY - origin.current.y;

    if (type === 'pan') {
      // Pan: movement translates directly to canvas pan
      const maxDelta = JOYSTICK_SIZE / 2 - HANDLE_SIZE / 2;
      const clampedX = Math.max(-maxDelta, Math.min(maxDelta, deltaX));
      const clampedY = Math.max(-maxDelta, Math.min(maxDelta, deltaY));

      setHandlePosition({ x: clampedX, y: clampedY });

      // Scale movement for smoother pan (2x multiplier)
      setPanOffset(
        panOffset.x + deltaX * 0.5,
        panOffset.y + deltaY * 0.5
      );
    } else if (type === 'zoom') {
      // Zoom: vertical movement controls zoom level
      const maxDelta = JOYSTICK_SIZE / 2 - HANDLE_SIZE / 2;
      const clampedY = Math.max(-maxDelta, Math.min(maxDelta, deltaY));

      setHandlePosition({ x: 0, y: clampedY });

      // Up = zoom in (increase), down = zoom out (decrease)
      // Scale: 1px = 0.01x zoom change
      const zoomChange = -deltaY * 0.01;
      const newZoom = zoom + zoomChange;
      setZoom(newZoom);
    }
  };

  const handleGestureEnd = () => {
    active.current = false;
    setHandlePosition({ x: 0, y: 0 });
  };

  const label = type === 'pan' ? 'PAN' : 'ZOOM';

  return (
    <View style={[styles.container, position === 'left' ? styles.left : styles.right]}>
      <Text style={styles.label}>{label}</Text>
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === 5) { // State.END
            handleGestureEnd();
          } else if (nativeEvent.state === 1) { // State.BEGAN
            handleGestureEvent(nativeEvent);
          }
        }}
      >
        <View style={styles.joystick}>
          <View
            style={[
              styles.handle,
              {
                transform: [
                  { translateX: handlePosition.x },
                  { translateY: handlePosition.y },
                ],
              },
            ]}
          />
        </View>
      </PanGestureHandler>
    </View>
  );
});

VirtualJoystick.displayName = 'VirtualJoystick';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE + 20, // Extra space for label
    alignItems: 'center',
  },
  left: {
    left: 20,
  },
  right: {
    right: 20,
  },
  label: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  joystick: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  handle: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    position: 'absolute',
  },
});

export default VirtualJoystick;
