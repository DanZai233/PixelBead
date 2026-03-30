import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCanvasStore } from '../../stores/canvasStore';
import type { ExportOptions } from '../../utils/canvasExport';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
}

const MIRROR_OPTIONS = [
  { value: 'none' as const, label: 'None', icon: 'crop-none' },
  { value: 'horizontal' as const, label: 'Horizontal', icon: 'flip-horizontal' },
  { value: 'vertical' as const, label: 'Vertical', icon: 'flip-vertical' },
];

/**
 * Export options modal component
 * Allows user to customize PNG export with toggles and options
 */
export function ExportModal({ visible, onClose, onExport }: ExportModalProps) {
  const selectionRegion = useCanvasStore((state) => state.selectionRegion);
  const hasSelection = selectionRegion !== null;

  const [showGrid, setShowGrid] = useState(true);
  const [showColorCodes, setShowColorCodes] = useState(false);
  const [mirror, setMirror] = useState<'none' | 'horizontal' | 'vertical'>('none');
  const [exportSelection, setExportSelection] = useState(false);

  const handleExport = () => {
    onExport({
      showGrid,
      showColorCodes,
      mirror,
      exportSelection: exportSelection && hasSelection,
    });
    onClose();
  };

  const handleMirrorSelect = (value: 'none' | 'horizontal' | 'vertical') => {
    setMirror(value);
  };

  const toggleShowGrid = () => {
    setShowGrid((prev) => !prev);
  };

  const toggleShowColorCodes = () => {
    setShowColorCodes((prev) => !prev);
  };

  const toggleExportSelection = () => {
    setExportSelection((prev) => !prev);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessible={true}
      accessibilityLabel="Export options modal"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Export Options</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessible={true}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <MaterialIcons name="close" size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Grid Lines Toggle */}
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <MaterialIcons name="grid-on" size={24} color="#212121" />
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>Show Grid Lines</Text>
                  <Text style={styles.optionDescription}>
                    Display pixel grid in exported image
                  </Text>
                </View>
              </View>
              <Switch
                value={showGrid}
                onValueChange={toggleShowGrid}
                accessible={true}
                accessibilityLabel="Show grid lines"
                accessibilityRole="switch"
                accessibilityHint="Toggle grid lines in export"
              />
            </View>

            {/* Color Codes Toggle */}
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <MaterialIcons name="tag" size={24} color="#212121" />
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>Show Color Codes</Text>
                  <Text style={styles.optionDescription}>
                    Display hex codes on each pixel
                  </Text>
                </View>
              </View>
              <Switch
                value={showColorCodes}
                onValueChange={toggleShowColorCodes}
                accessible={true}
                accessibilityLabel="Show color codes"
                accessibilityRole="switch"
                accessibilityHint="Toggle color codes on pixels"
              />
            </View>

            {/* Mirror Options */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Mirror</Text>
              <View style={styles.mirrorButtons}>
                {MIRROR_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.mirrorButton,
                      mirror === option.value && styles.mirrorButtonSelected,
                    ]}
                    onPress={() => handleMirrorSelect(option.value)}
                    accessible={true}
                    accessibilityLabel={`Mirror ${option.label}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: mirror === option.value }}
                  >
                    <MaterialIcons
                      name={option.icon as any}
                      size={24}
                      color={mirror === option.value ? '#FFFFFF' : '#212121'}
                    />
                    <Text
                      style={[
                        styles.mirrorButtonText,
                        mirror === option.value && styles.mirrorButtonTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Export Selection Toggle */}
            <View style={[styles.optionRow, styles.optionRowLast]}>
              <View style={styles.optionInfo}>
                <MaterialIcons name="crop" size={24} color="#212121" />
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>Export Selection Only</Text>
                  {hasSelection ? (
                    <Text style={styles.optionDescription}>
                      Export only selected region
                    </Text>
                  ) : (
                    <Text style={styles.optionDisabled}>
                      Select a region first
                    </Text>
                  )}
                </View>
              </View>
              <Switch
                value={exportSelection && hasSelection}
                onValueChange={toggleExportSelection}
                disabled={!hasSelection}
                accessible={true}
                accessibilityLabel="Export selection only"
                accessibilityRole="switch"
                accessibilityHint={
                  hasSelection
                    ? 'Toggle to export only selected region'
                    : 'Disabled: Select a region first'
                }
                accessibilityState={{ disabled: !hasSelection }}
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              accessible={true}
              accessibilityLabel="Cancel export"
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.exportButton]}
              onPress={handleExport}
              accessible={true}
              accessibilityLabel="Export image"
              accessibilityRole="button"
            >
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    maxWidth: 500,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  optionText: {
    marginLeft: 12,
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#757575',
  },
  optionDisabled: {
    fontSize: 14,
    color: '#BDBDBD',
    fontStyle: 'italic',
  },
  mirrorButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mirrorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 8,
  },
  mirrorButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  mirrorButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  mirrorButtonTextSelected: {
    color: '#FFFFFF',
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
  exportButton: {
    backgroundColor: '#2196F3',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
