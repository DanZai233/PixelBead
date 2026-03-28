import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';
import { ToolButton } from './ToolButton';

export function EraserTool() {
  const setTool = useCanvasStore(state => state.setSelectedTool);
  const currentTool = useCanvasStore(state => state.currentTool);

  return (
    <ToolButton
      tool="eraser"
      icon={<MaterialIcons name="auto-fix-high" size={24} color="#FFFFFF" />}
      label="Eraser"
      onPress={() => setTool('eraser')}
      currentTool={currentTool}
      accessibilityLabel="Eraser tool"
    />
  );
}
