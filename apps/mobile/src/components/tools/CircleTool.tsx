import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';
import { ToolButton } from './ToolButton';

export function CircleTool() {
  const setTool = useCanvasStore(state => state.setSelectedTool);
  const currentTool = useCanvasStore(state => state.currentTool);

  return (
    <ToolButton
      tool="circle"
      icon={<MaterialIcons name="radio-button-unchecked" size={24} color="#FFFFFF" />}
      label="Circle"
      onPress={() => setTool('circle')}
      currentTool={currentTool}
      accessibilityLabel="Circle tool"
    />
  );
}
