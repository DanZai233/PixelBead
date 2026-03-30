// PixelStyleSelector component for toggling pixel shapes
// Circle, Square, and Rounded pixel styles

import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';
import { PixelStyle } from '../../types/shared';

interface StyleOption {
  value: PixelStyle;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  { value: PixelStyle.CIRCLE, icon: 'radio-button-checked', label: 'Circle' },
  { value: PixelStyle.SQUARE, icon: 'crop-square', label: 'Square' },
  { value: PixelStyle.ROUNDED, icon: 'check-box-outline-blank', label: 'Rounded' },
];

interface PixelStyleSelectorProps {
  onStyleChange?: (style: PixelStyle) => void;
}

const PixelStyleSelector = memo(({ onStyleChange }: PixelStyleSelectorProps) => {
  const pixelStyle = useCanvasStore((state) => state.pixelStyle);
  const setPixelStyle = useCanvasStore((state) => state.setPixelStyle);

  const handleStylePress = (style: PixelStyle) => {
    setPixelStyle(style);
    onStyleChange?.(style);
  };

  return (
    <View style={styles.container}>
      {STYLE_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.styleButton,
            pixelStyle === option.value && styles.selectedStyleButton,
          ]}
          onPress={() => handleStylePress(option.value)}
          accessibilityLabel={`${option.label} pixels`}
          accessibilityHint={`Select ${option.label} pixel style`}
        >
          <View
            style={[
              styles.iconContainer,
              pixelStyle === option.value && styles.selectedIconContainer,
            ]}
          >
            <MaterialIcons
              name={option.icon}
              size={24}
              color={pixelStyle === option.value ? '#ffffff' : '#000000'}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#ffffff',
  },
  styleButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedStyleButton: {
    backgroundColor: '#3b82f6',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIconContainer: {
    backgroundColor: '#2563eb',
    borderRadius: 6,
  },
});

PixelStyleSelector.displayName = 'PixelStyleSelector';

export { PixelStyleSelector };
export default PixelStyleSelector;
