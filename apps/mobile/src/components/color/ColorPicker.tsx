// HSL Color Picker component for custom color selection
// Hue, Saturation, and Lightness sliders with color preview

import React, { memo, useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { useCanvasStore } from '../../stores/canvasStore';
// @ts-ignore - Workaround for path resolution
import { rgbToHsl, hexToRgb } from '../../../../packages/color-system/src';

const HSLColorPicker = memo(() => {
  const selectedColor = useCanvasStore((state) => state.selectedColor);
  const setSelectedColor = useCanvasStore((state) => state.setSelectedColor);

  const [h, setH] = useState(0);
  const [s, setS] = useState(50);
  const [l, setL] = useState(50);

  // Convert selected color to HSL on mount and when color changes from other sources
  useEffect(() => {
    const rgb = hexToRgb(selectedColor);
    if (rgb) {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      setH(hsl.h);
      setS(hsl.s);
      setL(hsl.l);
    }
  }, [selectedColor]);

  // HSL to RGB conversion helper
  const hslToRgb = (h: number, s: number, l: number) => {
    s /= 100;
    l /= 100;

    const k = (n: number) => (n + h / 30) % 12;
    const a = (s * Math.min(l, 1 - l)) / 100;

    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    return {
      r: Math.round(f(0) * 255),
      g: Math.round(f(8) * 255),
      b: Math.round(f(4) * 255),
    };
  };

  // RGB to HEX conversion
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const handleColorChange = (newH: number, newS: number, newL: number) => {
    const rgb = hslToRgb(newH, newS, newL);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setSelectedColor(hex);
  };

  const handleHueChange = (value: number) => {
    setH(value);
    handleColorChange(value, s, l);
  };

  const handleSaturationChange = (value: number) => {
    setS(value);
    handleColorChange(h, value, l);
  };

  const handleLightnessChange = (value: number) => {
    setL(value);
    handleColorChange(h, s, value);
  };

  const getCurrentColor = () => {
    const rgb = hslToRgb(h, s, l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  };

  const hueGradient = () => {
    // Create rainbow gradient for hue slider
    const colors = [];
    for (let i = 0; i < 360; i += 10) {
      const rgb = hslToRgb(i, 100, 50);
      colors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    return colors.join(',');
  };

  const saturationGradient = () => {
    // Gray to full color gradient for saturation
    const rgb1 = hslToRgb(h, 0, l);
    const rgb2 = hslToRgb(h, 100, l);
    return `${rgbToHex(rgb1.r, rgb1.g, rgb1.b)}, ${rgbToHex(rgb2.r, rgb2.g, rgb2.b)}`;
  };

  const lightnessGradient = () => {
    // Black to white gradient for lightness
    return '#000000, #FFFFFF';
  };

  return (
    <View style={styles.container}>
      {/* Color preview */}
      <View style={styles.previewContainer}>
        <View
          style={[
            styles.colorPreview,
            { backgroundColor: getCurrentColor() },
          ]}
        />
        <Text style={styles.colorCode}>{getCurrentColor()}</Text>
      </View>

      {/* Hue slider */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Hue: {Math.round(h)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={360}
          step={1}
          value={h}
          onValueChange={handleHueChange}
          minimumTrackTintColor={`linear-gradient(90deg, ${hueGradient()})`}
          maximumTrackTintColor="#e0e0e0"
          thumbTintColor="#3b82f6"
          accessibilityLabel="Hue slider"
          accessibilityHint="Adjust color hue (0-360 degrees)"
        />
      </View>

      {/* Saturation slider */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Saturation: {Math.round(s)}%</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={s}
          onValueChange={handleSaturationChange}
          minimumTrackTintColor={`linear-gradient(90deg, ${saturationGradient()})`}
          maximumTrackTintColor="#e0e0e0"
          thumbTintColor="#3b82f6"
          accessibilityLabel="Saturation slider"
          accessibilityHint="Adjust color saturation (0-100%)"
        />
      </View>

      {/* Lightness slider */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Lightness: {Math.round(l)}%</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={l}
          onValueChange={handleLightnessChange}
          minimumTrackTintColor={`linear-gradient(90deg, ${lightnessGradient()})`}
          maximumTrackTintColor="#e0e0e0"
          thumbTintColor="#3b82f6"
          accessibilityLabel="Lightness slider"
          accessibilityHint="Adjust color lightness (0-100%)"
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  colorPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  colorCode: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
});

HSLColorPicker.displayName = 'HSLColorPicker';

export { HSLColorPicker };
export default HSLColorPicker;
