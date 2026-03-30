import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface NewProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, width: number, height: number) => void;
}

const PRESET_SIZES = [
  { width: 8, height: 8, label: '8x8' },
  { width: 16, height: 16, label: '16x16' },
  { width: 20, height: 20, label: '20x20' },
  { width: 32, height: 32, label: '32x32' },
  { width: 48, height: 48, label: '48x48' },
];

const MIN_SIZE = 4;
const MAX_SIZE = 200;
const DEFAULT_SIZE = 20;

/**
 * New project modal component
 * Allows user to create a new canvas with custom name and dimensions
 * Includes preset buttons for common sizes
 */
export function NewProjectModal({ visible, onClose, onCreate }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [width, setWidth] = useState(DEFAULT_SIZE.toString());
  const [height, setHeight] = useState(DEFAULT_SIZE.toString());
  const [slideAnim] = useState(new Animated.Value(0));

  // Animate modal in/out
  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handlePresetSelect = (presetWidth: number, presetHeight: number) => {
    setWidth(presetWidth.toString());
    setHeight(presetHeight.toString());
  };

  const handleCreate = () => {
    if (isValid()) {
      onCreate(name.trim(), parseInt(width, 10), parseInt(height, 10));
      handleClose();
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setName('');
    setWidth(DEFAULT_SIZE.toString());
    setHeight(DEFAULT_SIZE.toString());
  };

  const isValid = (): boolean => {
    const trimmedName = name.trim();
    const widthNum = parseInt(width, 10);
    const heightNum = parseInt(height, 10);

    return (
      trimmedName.length > 0 &&
      trimmedName.length <= 50 &&
      !isNaN(widthNum) &&
      widthNum >= MIN_SIZE &&
      widthNum <= MAX_SIZE &&
      !isNaN(heightNum) &&
      heightNum >= MIN_SIZE &&
      heightNum <= MAX_SIZE
    );
  };

  const slideUpStyle = {
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [500, 0],
        }),
      },
    ],
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      accessible={true}
      accessibilityLabel="New project modal"
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalContainer, slideUpStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>New Canvas</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              accessible={true}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <MaterialIcons name="close" size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Project name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Project Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter project name"
                placeholderTextColor="#BDBDBD"
                maxLength={50}
                autoFocus
                accessible={true}
                accessibilityLabel="Project name input"
                accessibilityHint="Enter a name for your project"
              />
            </View>

            {/* Grid size */}
            <View style={styles.sizeInputGroup}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Width</Text>
                <TextInput
                  style={styles.input}
                  value={width}
                  onChangeText={setWidth}
                  placeholder={`${DEFAULT_SIZE}`}
                  keyboardType="number-pad"
                  maxLength={3}
                  accessible={true}
                  accessibilityLabel="Canvas width input"
                  accessibilityHint={`Enter width between ${MIN_SIZE} and ${MAX_SIZE}`}
                />
              </View>

              <View style={[styles.inputGroup, { marginLeft: 12 }]}>
                <Text style={styles.label}>Height</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  placeholder={`${DEFAULT_SIZE}`}
                  keyboardType="number-pad"
                  maxLength={3}
                  accessible={true}
                  accessibilityLabel="Canvas height input"
                  accessibilityHint={`Enter height between ${MIN_SIZE} and ${MAX_SIZE}`}
                />
              </View>
            </View>

            {/* Preset sizes */}
            <View style={styles.presetContainer}>
              <Text style={styles.presetLabel}>Quick Presets</Text>
              <View style={styles.presetButtons}>
                {PRESET_SIZES.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={[
                      styles.presetButton,
                      width === preset.width.toString() &&
                        height === preset.height.toString() &&
                        styles.presetButtonSelected,
                    ]}
                    onPress={() => handlePresetSelect(preset.width, preset.height)}
                    accessible={true}
                    accessibilityLabel={`${preset.label} preset`}
                    accessibilityRole="button"
                    accessibilityHint={`Set canvas size to ${preset.label}`}
                  >
                    <Text
                      style={[
                        styles.presetButtonText,
                        width === preset.width.toString() &&
                          height === preset.height.toString() &&
                          styles.presetButtonTextSelected,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              accessible={true}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.createButton, !isValid() && styles.createButtonDisabled]}
              onPress={handleCreate}
              disabled={!isValid()}
              accessible={true}
              accessibilityLabel="Create canvas"
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.createButtonText,
                  !isValid() && styles.createButtonTextDisabled,
                ]}
              >
                Create
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    flex: 1,
  },
  sizeInputGroup: {
    flexDirection: 'row',
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#212121',
  },
  presetContainer: {
    marginTop: 16,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    marginBottom: 8,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  presetButtonTextSelected: {
    color: '#1976D2',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },
  createButton: {
    backgroundColor: '#2196F3',
  },
  createButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  createButtonTextDisabled: {
    color: '#9E9E9E',
  },
});
