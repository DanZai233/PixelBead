import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal as RNModal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAiStore } from '../../stores/aiStore';
import { useCanvasStore } from '../../stores/canvasStore';
import { generatePixelArtImage } from '../../services/aiService';

interface AiGenerateModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AiGenerateModal({ visible, onClose }: AiGenerateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 16, height: 16 });

  const { provider, apiKey, endpoint, model } = useAiStore();
  const { loadGeneratedImage } = useCanvasStore();

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        base64: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const base64 = result.assets[0].base64;
        setReferenceImage(`data:image/jpeg;base64,${base64}`);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    if (!apiKey) {
      Alert.alert('Error', 'Please configure AI API key in settings');
      return;
    }

    setIsGenerating(true);

    try {
      const config = {
        provider,
        apiKey,
        endpoint,
        model,
      };

      const imageData = await generatePixelArtImage(prompt, config, referenceImage || undefined);

      // Load generated image into canvas
      await loadGeneratedImage(imageData, canvasSize.width, canvasSize.height);

      // Close modal on success
      onClose();
    } catch (err: any) {
      console.error('Generation error:', err);
      Alert.alert('Generation Failed', err.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const presets = [
    { width: 8, height: 8, label: '8x8' },
    { width: 16, height: 16, label: '16x16' },
    { width: 32, height: 32, label: '32x32' },
    { width: 64, height: 64, label: '64x64' },
  ];

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Generate Pixel Art</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Prompt</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Describe your pixel art..."
                placeholderTextColor="#999"
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                accessibilityLabel="AI generation prompt"
                accessibilityHint="Enter a description of the pixel art you want to generate"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reference Image (Optional)</Text>
              {!referenceImage ? (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickImage}
                  accessibilityLabel="Upload reference image"
                  accessibilityRole="button"
                  accessibilityHint="Tap to select an image from your library"
                >
                  <MaterialIcons name="add-photo-alternate" size={32} color="#3B82F6" />
                  <Text style={styles.uploadButtonText}>Upload Image</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.imagePreviewContainer}>
                  <View style={styles.imagePreview}>
                    <Text style={styles.imagePreviewText}>Image selected</Text>
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setReferenceImage(null)}
                      accessibilityLabel="Remove image"
                      accessibilityRole="button"
                    >
                      <MaterialIcons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Canvas Size</Text>
              <View style={styles.sizeInputsContainer}>
                <View style={styles.sizeInputWrapper}>
                  <Text style={styles.sizeLabel}>Width</Text>
                  <TextInput
                    style={styles.sizeInput}
                    value={canvasSize.width.toString()}
                    onChangeText={(text) => {
                      const width = parseInt(text) || 4;
                      const clampedWidth = Math.max(4, Math.min(200, width));
                      setCanvasSize({ ...canvasSize, width: clampedWidth });
                    }}
                    keyboardType="numeric"
                    accessibilityLabel="Canvas width"
                  />
                </View>
                <Text style={styles.sizeX}>×</Text>
                <View style={styles.sizeInputWrapper}>
                  <Text style={styles.sizeLabel}>Height</Text>
                  <TextInput
                    style={styles.sizeInput}
                    value={canvasSize.height.toString()}
                    onChangeText={(text) => {
                      const height = parseInt(text) || 4;
                      const clampedHeight = Math.max(4, Math.min(200, height));
                      setCanvasSize({ ...canvasSize, height: clampedHeight });
                    }}
                    keyboardType="numeric"
                    accessibilityLabel="Canvas height"
                  />
                </View>
              </View>
              <View style={styles.presetsContainer}>
                {presets.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={[
                      styles.presetButton,
                      canvasSize.width === preset.width &&
                        canvasSize.height === preset.height &&
                        styles.presetButtonActive,
                    ]}
                    onPress={() => setCanvasSize({ width: preset.width, height: preset.height })}
                    accessibilityLabel={`Set canvas size to ${preset.label}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.presetButtonText,
                        canvasSize.width === preset.width &&
                          canvasSize.height === preset.height &&
                          styles.presetButtonTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.generateButton,
                (!prompt.trim() || isGenerating) && styles.generateButtonDisabled,
              ]}
              onPress={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              accessibilityLabel="Generate pixel art"
              accessibilityRole="button"
              accessibilityHint={
                isGenerating ? 'Generating pixel art, please wait' : 'Tap to generate pixel art'
              }
            >
              {isGenerating ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.generateButtonText}>Generating...</Text>
                </View>
              ) : (
                <Text style={styles.generateButtonText}>Generate</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 80,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadButtonText: {
    marginTop: 8,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imagePreviewText: {
    fontSize: 16,
    color: '#6B7280',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sizeInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sizeInputWrapper: {
    flex: 1,
  },
  sizeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  sizeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  sizeX: {
    fontSize: 20,
    color: '#6B7280',
    marginHorizontal: 12,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
  },
  presetButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  presetButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  presetButtonTextActive: {
    color: '#FFF',
  },
  generateButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
