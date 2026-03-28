import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';
import { ToolButton } from './ToolButton';

export function RectangleTool() {
  const setTool = useCanvasStore(state => state.setSelectedTool);
  const currentTool = useCanvasStore(state => state.currentTool);

  return (
    <ToolButton
      tool="rectangle"
      icon={<MaterialIcons name="crop-square" size={24} color="#FFFFFF" />}
      label="Rectangle"
      onPress={() => setTool('rectangle')}
      currentTool={currentTool}
      accessibilityLabel="Rectangle tool"
    />
  );
}
