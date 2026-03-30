// ImmersiveMode component for distraction-free viewing with toggleable overlays

import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';

const ImmersiveMode = memo(() => {
  const immersiveMode = useCanvasStore((state) => state.immersiveMode);
  const showRulers = useCanvasStore((state) => state.showRulers);
  const showColorCodes = useCanvasStore((state) => state.showColorCodes);
  const showGridLines = useCanvasStore((state) => state.showGridLines);

  const setImmersiveMode = useCanvasStore((state) => state.setImmersiveMode);
  const setShowRulers = useCanvasStore((state) => state.setShowRulers);
  const setShowColorCodes = useCanvasStore((state) => state.setShowColorCodes);
  const setShowGridLines = useCanvasStore((state) => state.setShowGridLines);

  if (!immersiveMode) {
    // Floating button to enable immersive mode
    return (
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setImmersiveMode(true)}
      >
        <MaterialIcons name="fullscreen" size={24} color="#ffffff" />
      </TouchableOpacity>
    );
  }

  // Expanded toolbar when immersive mode is enabled
  return (
    <View style={styles.toolbar}>
      <TouchableOpacity
        style={[styles.toolbarButton, showGridLines && styles.toolbarButtonActive]}
        onPress={() => setShowGridLines(!showGridLines)}
      >
        <MaterialIcons name="grid-on" size={20} color={showGridLines ? '#ffffff' : '#000000'} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.toolbarButton, showRulers && styles.toolbarButtonActive]}
        onPress={() => setShowRulers(!showRulers)}
      >
        <MaterialIcons name="straighten" size={20} color={showRulers ? '#ffffff' : '#000000'} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.toolbarButton, showColorCodes && styles.toolbarButtonActive]}
        onPress={() => setShowColorCodes(!showColorCodes)}
      >
        <MaterialIcons name="tag" size={20} color={showColorCodes ? '#ffffff' : '#000000'} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.toolbarButton}
        onPress={() => setImmersiveMode(false)}
      >
        <MaterialIcons name="fullscreen-exit" size={20} color="#000000" />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  toolbar: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    gap: 8,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  toolbarButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarButtonActive: {
    backgroundColor: '#3b82f6',
  },
});

ImmersiveMode.displayName = 'ImmersiveMode';

export { ImmersiveMode };
export default ImmersiveMode;
