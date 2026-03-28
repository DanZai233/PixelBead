import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { BrushTool } from './BrushTool';
import { EraserTool } from './EraserTool';
import { FillTool } from './FillTool';
import { ColorPickerTool } from './ColorPickerTool';
import { LineTool } from './LineTool';
import { RectangleTool } from './RectangleTool';
import { CircleTool } from './CircleTool';
import { BrushSizeSlider } from './BrushSizeSlider';

export function ToolPanel() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      accessibilityLabel="Drawing tools"
    >
      <Text style={styles.header}>Tools</Text>

      {/* Tool buttons grid */}
      <View style={styles.toolsGrid}>
        <View style={styles.toolRow}>
          <View style={styles.toolCell}>
            <BrushTool />
          </View>
          <View style={styles.toolCell}>
            <EraserTool />
          </View>
        </View>
        <View style={styles.toolRow}>
          <View style={styles.toolCell}>
            <FillTool />
          </View>
          <View style={styles.toolCell}>
            <ColorPickerTool />
          </View>
        </View>
        <View style={styles.toolRow}>
          <View style={styles.toolCell}>
            <LineTool />
          </View>
          <View style={styles.toolCell}>
            <RectangleTool />
          </View>
        </View>
        <View style={styles.toolRow}>
          <View style={styles.toolCell}>
            <CircleTool />
          </View>
        </View>
      </View>

      {/* Brush size control */}
      <View style={styles.brushSettingsContainer}>
        <Text style={styles.sectionHeader}>Brush Settings</Text>
        <BrushSizeSlider />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  toolsGrid: {
    marginBottom: 24,
  },
  toolRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  toolCell: {
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  brushSettingsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#4B5563',
  },
});
