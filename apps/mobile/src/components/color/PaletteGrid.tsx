// PaletteGrid component for color selection
// Displays colors grouped by letter with selection indicator

import React, { memo } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
// @ts-ignore - Workaround for path resolution
import { useColorStore } from '../../stores/colorStore';
// @ts-ignore - Workaround for path resolution
import { useCanvasStore } from '../../stores/canvasStore';

interface ColorButtonProps {
  hex: string;
  isSelected: boolean;
  onPress: () => void;
}

const ColorButton = memo(({ hex, isSelected, onPress }: ColorButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.colorButton,
        isSelected && styles.selectedColorButton,
      ]}
      onPress={onPress}
      accessibilityLabel={`Color ${hex}`}
      accessibilityHint={isSelected ? 'Selected' : undefined}
    >
      <View
        style={[
          styles.colorSwatch,
          { backgroundColor: hex },
        ]}
      />
    </TouchableOpacity>
  );
});

interface LetterGroupProps {
  letter: string;
  colors: Array<{ hex: string; key: string }>;
  selectedColor: string;
  onSelectColor: (hex: string) => void;
}

const LetterGroup = memo(({ letter, colors, selectedColor, onSelectColor }: LetterGroupProps) => {
  return (
    <View style={styles.letterGroup}>
      <View style={styles.letterHeader}>
        {/* Letter header would go here */}
      </View>
      <View style={styles.colorRow}>
        {colors.map((color) => (
          <ColorButton
            key={color.hex}
            hex={color.hex}
            isSelected={color.hex === selectedColor}
            onPress={() => onSelectColor(color.hex)}
          />
        ))}
      </View>
    </View>
  );
});

interface PaletteGridProps {
  numColumns?: number;
}

const PaletteGrid = memo(({ numColumns = 6 }: PaletteGridProps) => {
  const selectedColor = useCanvasStore((state) => state.selectedColor);
  const paletteGroups = useColorStore((state) => state.paletteGroups);

  const handleSelectColor = (hex: string) => {
    useColorStore.getState().selectColor(hex);
  };

  // Flatten palette groups for FlatList
  const renderGroup = ({ item }: { item: typeof paletteGroups[0] }) => {
    return (
      <LetterGroup
        letter={item.letter}
        colors={item.colors}
        selectedColor={selectedColor}
        onSelectColor={handleSelectColor}
      />
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={paletteGroups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.letter}
        contentContainerStyle={styles.listContent}
        scrollEnabled
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listContent: {
    padding: 8,
  },
  letterGroup: {
    marginBottom: 8,
  },
  letterHeader: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 4,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorButton: {
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 2,
  },
});

PaletteGrid.displayName = 'PaletteGrid';

export { PaletteGrid };
export default PaletteGrid;
