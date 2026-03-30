import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGalleryStore } from '../../stores/galleryStore';
import { useCanvasStore } from '../../stores/canvasStore';
import { type Material } from '../../services/galleryService';

export default function GalleryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { materials, toggleFavorite, isFavorite } = useGalleryStore();
  const { loadMaterialIntoCanvas } = useCanvasStore();
  const [material, setMaterial] = useState<Material | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      const found = materials.find((m) => m.id === id);
      if (found) {
        setMaterial(found);
      }
    }
  }, [id, materials]);

  if (!material) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFoundText}>Design not found</Text>
      </View>
    );
  }

  const handleLoadIntoCanvas = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    loadMaterialIntoCanvas(material);
    router.push('/editor');
  };

  const handleToggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(material.id);
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLiked(true);
    // Note: Likes are local-only updates in this implementation
  };

  const isFav = isFavorite(material.id);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <MaterialIcons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{material.title}</Text>
          <View style={styles.spacer} />
        </View>

        {/* Preview */}
        <View style={styles.previewSection}>
          <View style={styles.previewContainer}>
            {/* Simplified preview - in full implementation would use CanvasGrid */}
            <Text style={styles.previewText}>
              {material.gridWidth}×{material.gridHeight}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{material.title}</Text>
          <Text style={styles.author}>by {material.author}</Text>
          {material.description && (
            <Text style={styles.description}>{material.description}</Text>
          )}
          {material.tags && material.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {material.tags.map((tag, index) => (
                <Text key={index} style={styles.tag}>
                  #{tag}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <MaterialIcons name="visibility" size={20} color="#9CA3AF" />
            <Text style={styles.statText}>{material.views}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons
              name="favorite"
              size={20}
              color={isLiked ? '#EF4444' : '#9CA3AF'}
            />
            <Text style={styles.statText}>{material.likes}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLoadIntoCanvas}
            accessibilityLabel="Load into Canvas"
            accessibilityRole="button"
            accessibilityHint="Double tap to load this design into canvas"
          >
            <MaterialIcons name="add" size={20} color="#FFF" />
            <Text style={styles.primaryButtonText}>Load into Canvas</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                isFav && styles.secondaryButtonActive,
              ]}
              onPress={handleToggleFavorite}
              accessibilityLabel="Favorite"
              accessibilityRole="button"
              accessibilityHint={
                isFav
                  ? 'Remove from favorites'
                  : 'Add to favorites'
              }
            >
              <MaterialIcons
                name="favorite"
                size={20}
                color={isFav ? '#EF4444' : '#666'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleLike}
              accessibilityLabel="Like"
              accessibilityRole="button"
              accessibilityHint="Like this design"
            >
              <MaterialIcons
                name="thumb-up"
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  notFoundText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },
  previewSection: {
    padding: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#6B7280',
  },
  infoSection: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    fontSize: 14,
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionsSection: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  secondaryButtonActive: {
    backgroundColor: '#FEF2F2',
  },
});
