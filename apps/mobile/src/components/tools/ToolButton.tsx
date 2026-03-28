import React, { memo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

export type ToolType = 'brush' | 'eraser' | 'fill' | 'picker' | 'line' | 'rectangle' | 'circle';

export interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  currentTool: ToolType;
  accessibilityLabel?: string;
}

export const ToolButton = memo<ToolButtonProps>(({
  tool,
  icon,
  label,
  onPress,
  currentTool,
  accessibilityLabel,
}) => {
  const isActive = currentTool === tool;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        isActive ? styles.activeButton : styles.inactiveButton,
      ]}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      {icon}
    </TouchableOpacity>
  );
});

ToolButton.displayName = 'ToolButton';

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: '#3B82F6',
  },
  inactiveButton: {
    backgroundColor: '#D1D5DB',
  },
});
