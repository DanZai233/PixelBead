// SelectionOverlay component for visual selection rectangle

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useCanvasStore } from '../../stores/canvasStore';

const SelectionOverlay = memo(() => {
  const selectionRegion = useCanvasStore((state) => state.selectionRegion);
  const zoom = useCanvasStore((state) => state.zoom);
  const panOffset = useCanvasStore((state) => state.panOffset);
  const cellSize = 20 * zoom; // Base cell size * zoom level

  if (!selectionRegion) {
    return null;
  }

  // Convert grid coordinates to screen coordinates
  const screenX = selectionRegion.x1 * cellSize + panOffset.x;
  const screenY = selectionRegion.y1 * cellSize + panOffset.y;
  const width = (selectionRegion.x2 - selectionRegion.x1 + 1) * cellSize;
  const height = (selectionRegion.y2 - selectionRegion.y1 + 1) * cellSize;

  return (
    <View
      style={[
        styles.selection,
        {
          left: screenX,
          top: screenY,
          width,
          height,
        },
      ]}
    >
      <View style={styles.cornerHandle} style={{ left: -5, top: -5 }} />
      <View style={styles.cornerHandle} style={{ right: -5, top: -5 }} />
      <View style={styles.cornerHandle} style={{ left: -5, bottom: -5 }} />
      <View style={styles.cornerHandle} style={{ right: -5, bottom: -5 }} />
    </View>
  );
});

const styles = StyleSheet.create({
  selection: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  cornerHandle: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
});

SelectionOverlay.displayName = 'SelectionOverlay';

export { SelectionOverlay };
export default SelectionOverlay;
