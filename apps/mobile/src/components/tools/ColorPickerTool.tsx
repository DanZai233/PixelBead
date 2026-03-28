import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';
import { ToolButton } from './ToolButton';

export function ColorPickerTool() {
  const setTool = useCanvasStore(state => state.setSelectedTool);
  const currentTool = useCanvasStore(state => state.currentTool);

  return (
    <ToolButton
      tool="picker"
      icon={<MaterialIcons name="colorize" size={24} color="#FFFFFF" />}
      label="Picker"
      onPress={() => setTool('picker')}
      currentTool={currentTool}
      accessibilityLabel="Color picker tool"
    />
  );
}
