import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCanvasStore } from '../../stores/canvasStore';
import * as Haptics from 'expo-haptics';

export function BrushSizeSlider() {
  const brushSize = useCanvasStore(state => state.brushSize);
  const setBrushSize = useCanvasStore(state => state.setBrushSize);

  const handleSizeChange = (size: number) => {
    const clampedSize = Math.max(1, Math.min(5, size));
    setBrushSize(clampedSize);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Brush Size: {brushSize}px
      </Text>
      <View style={styles.sizeIndicator}>
        {[1, 2, 3, 4, 5].map((size) => (
          <View
            key={size}
            style={[
              styles.sizeDot,
              brushSize === size && styles.sizeDotActive,
              { width: size * 8, height: size * 8 },
            ]}
          />
        ))}
      </View>
      <View style={styles.sliderContainer}>
        {[1, 2, 3, 4, 5].map((size) => (
          <View
            key={size}
            style={[
              styles.sliderButton,
              brushSize === size && styles.sliderButtonActive,
              { minWidth: 44, minHeight: 44 },
            ]}
          >
            <Text
              style={[
                styles.sliderButtonText,
                brushSize === size && styles.sliderButtonTextActive,
              ]}
              onPress={() => handleSizeChange(size)}
            >
              {size}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 12,
    color: '#374151',
  },
  sizeIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sizeDot: {
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  sizeDotActive: {
    backgroundColor: '#3B82F6',
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  sliderButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonActive: {
    backgroundColor: '#3B82F6',
  },
  sliderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  sliderButtonTextActive: {
    color: '#FFFFFF',
  },
});
