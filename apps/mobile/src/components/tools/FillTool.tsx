import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';
import { ToolButton } from './ToolButton';

export function FillTool() {
  const setTool = useCanvasStore(state => state.setSelectedTool);
  const currentTool = useCanvasStore(state => state.currentTool);

  return (
    <ToolButton
      tool="fill"
      icon={<MaterialIcons name="format-color-fill" size={24} color="#FFFFFF" />}
      label="Fill"
      onPress={() => setTool('fill')}
      currentTool={currentTool}
      accessibilityLabel="Fill bucket tool"
    />
  );
}
