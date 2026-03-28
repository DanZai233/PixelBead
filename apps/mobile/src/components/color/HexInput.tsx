// HEX Color Input component for direct color code entry
// Validates HEX format (#RRGGBB) and provides copy functionality

import React, { memo, useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// @ts-ignore - Workaround for package resolution
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useCanvasStore } from '../../stores/canvasStore';

const HexInput = memo(() => {
  const selectedColor = useCanvasStore((state) => state.selectedColor);
  const setSelectedColor = useCanvasStore((state) => state.setSelectedColor);

  const [hexInput, setHexInput] = useState(selectedColor);
  const [isValid, setIsValid] = useState(true);

  // Update input when selectedColor changes from other sources
  useEffect(() => {
    setHexInput(selectedColor);
    setIsValid(true);
  }, [selectedColor]);

  // Validate HEX format
  const validateHex = (hex: string): boolean => {
    const regex = /^#?([0-9A-Fa-f]{6})$/;
    return regex.test(hex);
  };

  const handleInputChange = (text: string) => {
    setHexInput(text);
    setIsValid(validateHex(text));
  };

  const handleApply = () => {
    if (isValid && validateHex(hexInput)) {
      // Ensure # prefix
      const hex = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;
      setSelectedColor(hex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Alert.alert('Invalid HEX Code', 'Please enter a valid 6-digit HEX code (e.g., #FF0000)');
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(selectedColor);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Copied', `Color ${selectedColor} copied to clipboard`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>HEX Color</Text>
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Text style={styles.hashSign}>#</Text>
          <TextInput
            style={[
              styles.input,
              !isValid && styles.invalidInput,
            ]}
            value={hexInput.replace('#', '')}
            onChangeText={handleInputChange}
            placeholder="RRGGBB"
            placeholderTextColor="#999999"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            accessibilityLabel="HEX color input"
            accessibilityHint="Enter 6-digit HEX code"
            keyboardType="default"
          />
        </View>
        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopy}
          accessibilityLabel="Copy color"
          accessibilityHint="Copy current color to clipboard"
        >
          <MaterialIcons name="content-copy" size={20} color="#666666" />
        </TouchableOpacity>
      </View>
      {!isValid && hexInput.length > 0 && (
        <Text style={styles.errorText}>Invalid HEX code</Text>
      )}
      <TouchableOpacity
        style={[
          styles.applyButton,
          (!isValid || hexInput.length === 0) && styles.disabledButton,
        ]}
        onPress={handleApply}
        disabled={!isValid || hexInput.length === 0}
        accessibilityLabel="Apply color"
        accessibilityHint={!isValid ? 'Invalid HEX code' : 'Apply this color'}
      >
        <Text style={[
          styles.applyButtonText,
          (!isValid || hexInput.length === 0) && styles.disabledButtonText,
        ]}>
          Apply
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  hashSign: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  invalidInput: {
    color: '#dc2626',
  },
  copyButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
  applyButton: {
    marginTop: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  disabledButtonText: {
    color: '#999999',
  },
});

HexInput.displayName = 'HexInput';

export { HexInput };
export default HexInput;
