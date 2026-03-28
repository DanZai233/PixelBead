// ImageImporter component for importing images from photo library

import React, { memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';

const ImageImporter = memo(() => {
  const setImportedImage = useCanvasStore((state) => state.setImportedImage);

  const handleImportPress = async () => {
    try {
      // Request camera roll permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to import images.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        aspect: undefined,
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setImportedImage(imageUri);
      }
    } catch (error) {
      console.error('Error importing image:', error);
      Alert.alert('Error', 'Failed to import image. Please try again.');
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleImportPress}
      accessibilityLabel="Import image from photo library"
      accessibilityHint="Opens photo picker to select an image"
    >
      <MaterialIcons name="image-plus" size={24} color="#000000" />
      <Text style={styles.label}>Import</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    minWidth: 80,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
});

ImageImporter.displayName = 'ImageImporter';

export { ImageImporter };
export default ImageImporter;
