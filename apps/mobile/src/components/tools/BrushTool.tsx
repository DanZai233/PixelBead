import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';
import { ToolButton } from './ToolButton';

export function BrushTool() {
  const setTool = useCanvasStore(state => state.setSelectedTool);
  const currentTool = useCanvasStore(state => state.currentTool);

  return (
    <ToolButton
      tool="brush"
      icon={<MaterialIcons name="brush" size={24} color="#FFFFFF" />}
      label="Brush"
      onPress={() => setTool('brush')}
      currentTool={currentTool}
      accessibilityLabel="Brush tool"
    />
  );
}
