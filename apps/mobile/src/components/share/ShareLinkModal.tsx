import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal as RNModal,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useShareStore } from '../../stores/shareStore';
import { useCanvasStore } from '../../stores/canvasStore';
import { useProjectStore } from '../../stores/projectStore';

interface ShareLinkModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ShareLinkModal({ visible, onClose }: ShareLinkModalProps) {
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);

  const { shareUrl, isGenerating, generateShareLink, copyToClipboard } = useShareStore();
  const { grid, gridSize, pixelStyle } = useCanvasStore();
  const { projects, currentProjectId } = useProjectStore();

  const currentProject = projects.find((p) => p.id === currentProjectId);

  useEffect(() => {
    if (visible && shareUrl === '') {
      // Convert grid Map to array for sharing
      const { width: maxWidth, height: maxHeight } = gridSize;
      const gridArray: any[][] = [];
      for (let y = 0; y < maxHeight; y++) {
        const row: any[] = [];
        for (let x = 0; x < maxWidth; x++) {
          const color = grid.get(`${x},${y}`);
          row.push(color || '');
        }
        gridArray.push(row);
      }

      generateShareLink({
        name: currentProject?.name || 'Untitled',
        grid: gridArray,
        gridWidth: maxWidth,
        gridHeight: maxHeight,
        pixelStyle,
      });
    }
  }, [visible, shareUrl]);

  const handleCopy = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await copyToClipboard();
    setShowCopyFeedback(true);
    setTimeout(() => setShowCopyFeedback(false), 1000);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (shareUrl) {
      await Sharing.shareAsync(shareUrl, {
        mimeType: 'text/plain',
      });
    }
  };

  const handleRegenerate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCopyFeedback(false);
    // Regenerate by calling generateShareLink again
    const { width: maxWidth, height: maxHeight } = gridSize;
    const gridArray: any[][] = [];
    for (let y = 0; y < maxHeight; y++) {
      const row: any[] = [];
      for (let x = 0; x < maxWidth; x++) {
        const color = grid.get(`${x},${y}`);
        row.push(color || '');
      }
      gridArray.push(row);
    }

    await generateShareLink({
      name: currentProject?.name || 'Untitled',
      grid: gridArray,
      gridWidth: maxWidth,
      gridHeight: maxHeight,
      pixelStyle,
    });
  };

  const displayUrl = shareUrl.length > 40 ? shareUrl.substring(0, 40) + '...' : shareUrl;

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
            <Text style={styles.headerTitle}>Share Project</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.urlSection}>
            <Text style={styles.urlLabel}>Share Link</Text>
            <Text style={styles.urlText}>{displayUrl}</Text>
          </View>

          {showCopyFeedback && (
            <View style={styles.feedback}>
              <Text style={styles.feedbackText}>Copied!</Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.copyButton]}
              onPress={handleCopy}
              accessibilityLabel="Copy to clipboard"
              accessibilityRole="button"
              accessibilityHint="Double tap to copy share link"
            >
              <MaterialIcons name="content-copy" size={24} color="#666" />
              <Text style={styles.actionButtonText}>{showCopyFeedback ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
              accessibilityLabel="Share"
              accessibilityRole="button"
              accessibilityHint="Double tap to open system share sheet"
            >
              <MaterialIcons name="share" size={24} color="#666" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRegenerate}
              accessibilityLabel="Regenerate link"
              accessibilityRole="button"
              accessibilityHint="Double tap to generate new share link"
            >
              <MaterialIcons name="refresh" size={24} color="#666" />
              <Text style={styles.actionButtonText}>Regenerate</Text>
            </TouchableOpacity>
          </View>

          {isGenerating && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Generating link...</Text>
            </View>
          )}
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
  urlSection: {
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  urlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  urlText: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#1F2937',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  feedback: {
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    flex: 1,
  },
  copyButton: {
    backgroundColor: '#EFF6FF',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
