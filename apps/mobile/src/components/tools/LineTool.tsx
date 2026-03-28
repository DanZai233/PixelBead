import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';
import { ToolButton } from './ToolButton';

export function LineTool() {
  const setTool = useCanvasStore(state => state.setSelectedTool);
  const currentTool = useCanvasStore(state => state.currentTool);

  return (
    <ToolButton
      tool="line"
      icon={<MaterialIcons name="horizontal-rule" size={24} color="#FFFFFF" />}
      label="Line"
      onPress={() => setTool('line')}
      currentTool={currentTool}
      accessibilityLabel="Line tool"
    />
  );
}
