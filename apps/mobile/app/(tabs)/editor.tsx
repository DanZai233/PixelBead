import React, { useState } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CanvasGrid from '../../src/components/CanvasGrid';
import ToolDrawer from '../../src/components/ToolDrawer';
import ThemeToggle from '../../src/components/ThemeToggle';

export default function EditorScreen() {
  const { width, height } = useWindowDimensions();
  const [isToolDrawerOpen, setIsToolDrawerOpen] = useState(false);

  return (
    <View style={[styles.container, { width, height }]}>
      <CanvasGrid width={width} height={height} />

      {/* Tool drawer button */}
      <Pressable
        style={styles.toolDrawerButton}
        onPress={() => setIsToolDrawerOpen(true)}
      >
        <MaterialIcons name="more-horiz" size={24} color="#666" />
      </Pressable>

      {/* Theme toggle button */}
      <View style={styles.themeToggleContainer}>
        <ThemeToggle />
      </View>

      {/* Tool drawer */}
      <ToolDrawer
        isOpen={isToolDrawerOpen}
        onClose={() => setIsToolDrawerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  toolDrawerButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  themeToggleContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
});
