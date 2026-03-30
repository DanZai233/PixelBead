// ImageCropper component for custom crop region selection
// Simplified version with basic crop functionality

import React, { memo } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';

interface ImageCropperProps {
  visible: boolean;
  onClose: () => void;
  onConvert: () => void;
}

const ImageCropper = memo(({ visible, onClose, onConvert }: ImageCropperProps) => {
  const importedImage = useCanvasStore((state) => state.importedImage);

  const handleConvert = () => {
    // TODO: Implement actual pixelation logic
    // For now, just close the modal
    onConvert();
    onClose();
  };

  if (!importedImage) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Crop Image</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.imageContainer}>
            <Image source={{ uri: importedImage }} style={styles.image} />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.convertButton}
              onPress={handleConvert}
            >
              <Text style={styles.convertButtonText}>Convert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
  },
  imageContainer: {
    padding: 16,
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  convertButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  convertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

ImageCropper.displayName = 'ImageCropper';

export { ImageCropper };
export default ImageCropper;
