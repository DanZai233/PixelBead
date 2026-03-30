import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal as RNModal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';
import { useGalleryStore } from '../../stores/galleryStore';
import { useProjectStore } from '../../stores/projectStore';
// @ts-ignore - Workaround for path resolution
import { PixelStyle } from '../../../packages/shared-types/src';

interface PublishModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PublishModal({ visible, onClose }: PublishModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const { grid, gridSize, pixelStyle } = useCanvasStore();
  const { publishMaterial } = useGalleryStore();
  const { projects, currentProjectId } = useProjectStore();

  // Get current project from projects array
  const currentProject = projects.find((p) => p.id === currentProjectId);

  // Initialize from canvas/project on modal open
  React.useEffect(() => {
    if (visible) {
      setTitle(currentProject?.name || 'Untitled');
      setAuthor('');
      setDescription('');
      setTags('');
    }
  }, [visible, currentProject?.name]);

  const handlePublish = async () => {
    if (!title.trim() || !author.trim()) {
      return;
    }

    setIsPublishing(true);

    try {
      // Convert canvas grid to 2D array for Material interface
      const { width: maxWidth, height: maxHeight } = gridSize;
      const grid2D: string[][] = [];
      for (let y = 0; y < maxHeight; y++) {
        const row: string[] = [];
        for (let x = 0; x < maxWidth; x++) {
          const color = grid.get(`${x},${y}`);
          row.push(color || '');
        }
        grid2D.push(row);
      }

      // Parse tags: split by comma, trim whitespace, filter empty strings
      const parsedTags = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await publishMaterial({
        title: title.trim(),
        author: author.trim(),
        description: description.trim(),
        tags: parsedTags,
        gridWidth: maxWidth,
        gridHeight: maxHeight,
        pixelStyle: pixelStyle.toString(),
        grid: grid2D,
      });

      onClose();
    } catch (error: any) {
      console.error('Error publishing material:', error);
      alert(error.message || 'Failed to publish design');
    } finally {
      setIsPublishing(false);
    }
  };

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
            <Text style={styles.headerTitle}>Publish Design</Text>
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
              <Text style={styles.sectionTitle}>Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Design title"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                accessibilityLabel="Design title"
                accessibilityHint="Enter a title for your design"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Author *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Your name"
                placeholderTextColor="#999"
                value={author}
                onChangeText={setAuthor}
                accessibilityLabel="Author name"
                accessibilityHint="Enter your name as the author"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Describe your design..."
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                accessibilityLabel="Design description"
                accessibilityHint="Enter an optional description for your design"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags (comma-separated)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="pixel art, cute, cartoon"
                placeholderTextColor="#999"
                value={tags}
                onChangeText={setTags}
                accessibilityLabel="Design tags"
                accessibilityHint="Enter tags separated by commas (optional)"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.publishButton,
                (!title.trim() || !author.trim() || isPublishing) && styles.publishButtonDisabled,
              ]}
              onPress={handlePublish}
              disabled={isPublishing || !title.trim() || !author.trim()}
              accessibilityLabel="Publish to gallery"
              accessibilityRole="button"
              accessibilityHint={
                isPublishing
                  ? 'Publishing design, please wait'
                  : 'Tap to publish your design to the gallery'
              }
            >
              <Text style={styles.publishButtonText}>
                {isPublishing ? 'Publishing...' : 'Publish'}
              </Text>
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
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  multilineInput: {
    minHeight: 80,
  },
  publishButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  publishButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  publishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});
