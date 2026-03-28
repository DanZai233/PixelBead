// PaletteSelector component for switching palette presets and brands
// Horizontal toolbar with preset buttons and brand dropdown

import React, { memo, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// @ts-ignore - Workaround for path resolution
import { useColorStore } from '../../stores/colorStore';

type PaletteSize = 48 | 96 | 144 | 168;
type ColorSystem = 'MARD' | 'COCO' | '漫漫' | '盼盼' | '咪小窝';

const PALETTE_SIZES: PaletteSize[] = [48, 96, 144, 168];
const BRANDS: ColorSystem[] = ['MARD', 'COCO', '漫漫', '盼盼', '咪小窝'];

interface PaletteSelectorProps {
  onBrandChange?: (brand: ColorSystem) => void;
}

const PaletteSelector = memo(({ onBrandChange }: PaletteSelectorProps) => {
  const selectedPaletteSize = useColorStore((state) => state.selectedPaletteSize);
  const selectedBrand = useColorStore((state) => state.selectedBrand);
  const setSelectedPaletteSize = useColorStore((state) => state.setSelectedPaletteSize);
  const setSelectedBrand = useColorStore((state) => state.setSelectedBrand);

  const [showBrandModal, setShowBrandModal] = useState(false);

  const handlePaletteSizePress = (size: PaletteSize) => {
    setSelectedPaletteSize(size);
  };

  const handleBrandPress = () => {
    setShowBrandModal(true);
  };

  const handleBrandSelect = (brand: ColorSystem) => {
    setSelectedBrand(brand);
    setShowBrandModal(false);
    onBrandChange?.(brand);
  };

  return (
    <View style={styles.container}>
      {/* Palette size presets */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetScroll}
      >
        {PALETTE_SIZES.map((size) => (
          <TouchableOpacity
            key={size}
            style={[
              styles.presetButton,
              selectedPaletteSize === size && styles.selectedPresetButton,
            ]}
            onPress={() => handlePaletteSizePress(size)}
            accessibilityLabel={`${size} color palette`}
          >
            <Text
              style={[
                styles.presetButtonText,
                selectedPaletteSize === size && styles.selectedPresetButtonText,
              ]}
            >
              {size}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Brand selector */}
      <TouchableOpacity
        style={styles.brandSelector}
        onPress={handleBrandPress}
        accessibilityLabel={`Brand: ${selectedBrand}`}
        accessibilityHint="Tap to change brand"
      >
        <Text style={styles.brandText}>{selectedBrand}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={20} color="#000000" />
      </TouchableOpacity>

      {/* Brand selection modal */}
      <Modal
        visible={showBrandModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBrandModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBrandModal(false)}
        >
          <View style={styles.brandModal}>
            <Text style={styles.modalTitle}>Select Brand</Text>
            {BRANDS.map((brand) => (
              <TouchableOpacity
                key={brand}
                style={[
                  styles.brandOption,
                  selectedBrand === brand && styles.selectedBrandOption,
                ]}
                onPress={() => handleBrandSelect(brand)}
              >
                <Text
                  style={[
                    styles.brandOptionText,
                    selectedBrand === brand && styles.selectedBrandOptionText,
                  ]}
                >
                  {brand}
                </Text>
                {selectedBrand === brand && (
                  <MaterialIcons name="check" size={20} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    height: 50,
  },
  presetScroll: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedPresetButton: {
    backgroundColor: '#3b82f6',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  selectedPresetButtonText: {
    color: '#ffffff',
  },
  brandSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  brandText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandModal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  brandOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedBrandOption: {
    backgroundColor: '#f0f7ff',
  },
  brandOptionText: {
    fontSize: 16,
    color: '#000000',
  },
  selectedBrandOptionText: {
    fontWeight: '600',
    color: '#3b82f6',
  },
});

PaletteSelector.displayName = 'PaletteSelector';

export { PaletteSelector };
export default PaletteSelector;
