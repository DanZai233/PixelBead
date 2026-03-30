import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useGalleryStore } from '../../stores/galleryStore';
import { type Material } from '../../services/galleryService';

interface GalleryCardProps {
  material: Material;
  onPress?: () => void;
}

export default function GalleryCard({ material, onPress }: GalleryCardProps) {
  const router = useRouter();
  const { isFavorite } = useGalleryStore();
  const isFav = isFavorite(material.id);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    } else {
      router.push(`/gallery/${material.id}`);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      accessibilityLabel={`${material.title} by ${material.author}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to load this design"
      activeOpacity={0.7}
    >
      {/* Favorite indicator */}
      {isFav && (
        <View style={styles.favoriteIndicator}>
          <MaterialIcons name="favorite" size={16} color="#EF4444" />
        </View>
      )}

      {/* Grid preview - simplified version using image placeholder */}
      <View style={styles.preview}>
        <Text style={styles.previewText}>{material.gridWidth}×{material.gridHeight}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {material.title}
        </Text>
        <Text style={styles.author}>by {material.author}</Text>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <MaterialIcons name="visibility" size={14} color="#9CA3AF" />
            <Text style={styles.statText}>{material.views}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="favorite" size={14} color="#9CA3AF" />
            <Text style={styles.statText}>{material.likes}</Text>
          </View>
        </View>

        {material.tags && material.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {material.tags.slice(0, 2).map((tag, index) => (
              <Text key={index} style={styles.tag}>
                #{tag}
              </Text>
            ))}
            {material.tags.length > 2 && (
              <Text style={styles.moreTags}>+{material.tags.length - 2}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
  },
  favoriteIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  preview: {
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    fontSize: 12,
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  moreTags: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
