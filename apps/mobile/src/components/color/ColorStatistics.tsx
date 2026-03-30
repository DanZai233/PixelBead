// ColorStatistics component for real-time color statistics with bead counts

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';
import { useColorStatistics } from '../../hooks/useColorStatistics';
import * as Haptics from 'expo-haptics';

interface ColorEntryProps {
  hex: string;
  count: number;
  onSelect: () => void;
  onHighlight: () => void;
  isHighlighted: boolean;
}

const ColorEntry = memo(({ hex, count, onSelect, onHighlight, isHighlighted }: ColorEntryProps) => {
  return (
    <View style={styles.colorEntry}>
      <TouchableOpacity
        style={styles.colorSwatch}
        onPress={onSelect}
      >
        <View style={[styles.swatch, { backgroundColor: hex }]} />
      </TouchableOpacity>
      <View style={styles.colorInfo}>
        <Text style={styles.colorHex}>{hex}</Text>
        <Text style={styles.colorCount}>{count} beads</Text>
      </View>
      <TouchableOpacity
        style={styles.highlightButton}
        onPress={() => {
          onHighlight();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <MaterialIcons
          name={isHighlighted ? 'visibility' : 'visibility-off'}
          size={20}
          color={isHighlighted ? '#3b82f6' : '#999999'}
        />
      </TouchableOpacity>
    </View>
  );
});

interface ColorStatisticsProps {
  visible: boolean;
  onClose: () => void;
}

const ColorStatistics = memo(({ visible, onClose }: ColorStatisticsProps) => {
  const setSelectedColor = useCanvasStore((state) => state.setSelectedColor);
  const { colorCounts, handleMergeSimilarColors, highlightColor, totalBeads } = useColorStatistics();

  const [mergeThreshold] = React.useState(0.15);

  const handleMerge = () => {
    Alert.alert(
      'Merge Similar Colors',
      'This will modify your canvas by merging similar colors. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          onPress: () => {
            handleMergeSimilarColors(mergeThreshold);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  const highlightedColor = useCanvasStore((state) => state.highlightedColor);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Color Statistics</Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="close" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <View style={styles.mergeSection}>
        <View style={styles.thresholdContainer}>
          <Text style={styles.thresholdLabel}>
            Merge Threshold: {Math.round(mergeThreshold * 100)}%
          </Text>
        </View>
        <TouchableOpacity style={styles.mergeButton} onPress={handleMerge}>
          <MaterialIcons name="merge-type" size={18} color="#ffffff" />
          <Text style={styles.mergeButtonText}>Merge</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total: {totalBeads} beads</Text>
      </View>

      <FlatList
        data={colorCounts}
        keyExtractor={(item) => item.hex}
        renderItem={({ item }) => (
          <ColorEntry
            hex={item.hex}
            count={item.count || 0}
            onSelect={() => {
              setSelectedColor(item.hex);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            onHighlight={() => {
              if (highlightedColor === item.hex) {
                highlightColor(null);
              } else {
                highlightColor(item.hex);
              }
            }}
            isHighlighted={highlightedColor === item.hex}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  mergeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  thresholdContainer: {
    flex: 1,
    marginRight: 12,
  },
  thresholdLabel: {
    fontSize: 14,
    color: '#666666',
  },
  mergeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mergeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  totalContainer: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  list: {
    padding: 8,
  },
  colorEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  colorSwatch: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  colorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  colorHex: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  colorCount: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  highlightButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

ColorStatistics.displayName = 'ColorStatistics';

export { ColorStatistics };
export default ColorStatistics;
