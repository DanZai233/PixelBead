// SelectionTools component for selection actions (copy, cut, clear, invert)

import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';
import { useSelectionOperations } from '../../hooks/useSelection';

const SelectionTools = memo(() => {
  const selectionRegion = useCanvasStore((state) => state.selectionRegion);
  const { copy, cut, clear, invert } = useSelectionOperations();

  if (!selectionRegion) {
    return null;
  }

  const handleCopy = () => copy(selectionRegion);
  const handleCut = () => cut(selectionRegion);
  const handleClear = () => clear(selectionRegion);
  const handleInvert = () => invert(selectionRegion);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleCopy}
        accessibilityLabel="Copy selection"
      >
        <MaterialIcons name="content-copy" size={20} color="#000000" />
        <Text style={styles.buttonLabel}>Copy</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleCut}
        accessibilityLabel="Cut selection"
      >
        <MaterialIcons name="content-cut" size={20} color="#000000" />
        <Text style={styles.buttonLabel}>Cut</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleClear}
        accessibilityLabel="Clear selection"
      >
        <MaterialIcons name="clear" size={20} color="#000000" />
        <Text style={styles.buttonLabel}>Clear</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleInvert}
        accessibilityLabel="Invert selection"
      >
        <MaterialIcons name="flip" size={20} color="#000000" />
        <Text style={styles.buttonLabel}>Invert</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 4,
  },
});

SelectionTools.displayName = 'SelectionTools';

export { SelectionTools };
export default SelectionTools;
