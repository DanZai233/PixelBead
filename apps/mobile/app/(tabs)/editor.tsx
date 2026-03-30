import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import CanvasGrid from '../../src/components/CanvasGrid';
import ToolDrawer from '../../src/components/ToolDrawer';
import ThemeToggle from '../../src/components/ThemeToggle';
import { ExportModal } from '../../src/components/export/ExportModal';
import PublishModal from '../../src/components/gallery/PublishModal';
import { exportCanvasAsPng, shareExportedImage } from '../../src/utils/canvasExport';
import { useCanvasStore } from '../../src/stores/canvasStore';
import { OnboardingGuide } from '../../src/components/OnboardingGuide';
import { OfflineIndicator } from '../../src/components/OfflineIndicator';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import AiGenerateModal from '../../src/components/ai/AiGenerateModal';
import AiSettingsModal from '../../src/components/ai/AiSettingsModal';

export default function EditorScreen() {
    const { width, height } = useWindowDimensions();
    const canvasStore = useCanvasStore();
    const { hasSeenOnboarding } = useOnboardingStore();
    const [isToolDrawerOpen, setIsToolDrawerOpen] = useState(false);
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [onboardingVisible, setOnboardingVisible] = useState(false);
    const [showAiGenerate, setShowAiGenerate] = useState(false);
    const [showAiSettings, setShowAiSettings] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);

   // Show onboarding on first launch
   useEffect(() => {
     if (!hasSeenOnboarding) {
       setOnboardingVisible(true);
     }
   }, [hasSeenOnboarding]);

   const handleExport = async (options: {
     showGrid: boolean;
     showColorCodes: boolean;
     mirror: 'none' | 'horizontal' | 'vertical';
     exportSelection: boolean;
   }) => {
     try {
       // Prepare canvas state for export
       const canvasState = {
         grid: canvasStore.grid,
         gridSize: canvasStore.gridSize,
         pixelStyle: canvasStore.pixelStyle,
         selectionRegion: canvasStore.selectionRegion,
       };

       // Export canvas as PNG
       const fileUri = await exportCanvasAsPng(canvasState, options);

       // Share exported image
       await shareExportedImage(fileUri);

       // Show success message
       Alert.alert('Success', 'Export successful!');
     } catch (error) {
       console.error('Export failed:', error);
       Alert.alert('Error', 'Failed to export image. Please try again.');
     }
   };

   return (
     <View style={[styles.container, { width, height }]}>
       {/* Offline indicator (always visible when offline) */}
       <OfflineIndicator />

       <CanvasGrid width={width} height={height} />

      {/* Tool drawer button */}
      <Pressable
        style={styles.toolDrawerButton}
        onPress={() => setIsToolDrawerOpen(true)}
      >
        <MaterialIcons name="more-horiz" size={24} color="#666" />
      </Pressable>

      {/* Export button */}
      <Pressable
        style={styles.exportButton}
        onPress={() => setExportModalVisible(true)}
        accessible={true}
        accessibilityLabel="Export image"
        accessibilityRole="button"
        accessibilityHint="Export canvas as PNG image"
      >
        <MaterialIcons name="file-download" size={24} color="#666" />
      </Pressable>

      {/* AI Generate button */}
      <Pressable
        style={styles.aiButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowAiGenerate(true);
        }}
        accessible={true}
        accessibilityLabel="Generate pixel art with AI"
        accessibilityRole="button"
        accessibilityHint="Double tap to open AI generation"
      >
        <MaterialIcons name="auto-awesome" size={24} color="#666" />
      </Pressable>

      {/* AI Settings button */}
      <Pressable
        style={styles.aiSettingsButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowAiSettings(true);
        }}
        accessible={true}
        accessibilityLabel="Configure AI settings"
        accessibilityRole="button"
        accessibilityHint="Double tap to configure AI provider and API key"
      >
        <MaterialIcons name="settings-suggest" size={24} color="#666" />
      </Pressable>

      {/* Publish button */}
      <Pressable
        style={styles.publishButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowPublishModal(true);
        }}
        accessible={true}
        accessibilityLabel="Publish to gallery"
        accessibilityRole="button"
        accessibilityHint="Double tap to publish your design to gallery"
      >
        <MaterialIcons name="cloud-upload" size={24} color="#666" />
      </Pressable>

      {/* Tool drawer button */}
      <Pressable
        style={styles.toolDrawerButton}
        onPress={() => setIsToolDrawerOpen(true)}
        accessible={true}
        accessibilityLabel="Open tools"
        accessibilityRole="button"
        accessibilityHint="Double tap to open drawing tools"
      >
        <MaterialIcons name="more-horiz" size={24} color="#666" />
      </Pressable>

      {/* Theme toggle button */}
      <View style={styles.themeToggleContainer}>
        <ThemeToggle />
      </View>

      {/* Tool drawer */}
      <ToolDrawer
        isOpen={isToolDrawerOpen}
        onClose={() => setIsToolDrawerOpen(false)}
      />

      {/* Export modal */}
      <ExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        onExport={handleExport}
      />

      {/* AI Generate modal */}
      <AiGenerateModal
        visible={showAiGenerate}
        onClose={() => setShowAiGenerate(false)}
      />

      {/* AI Settings modal */}
      <AiSettingsModal
        visible={showAiSettings}
        onClose={() => setShowAiSettings(false)}
      />

      {/* Publish modal */}
      <PublishModal
        visible={showPublishModal}
        onClose={() => setShowPublishModal(false)}
      />

      {/* Onboarding guide (full-screen overlay) */}
      <OnboardingGuide
        visible={onboardingVisible}
        onDismiss={() => setOnboardingVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  toolDrawerButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  themeToggleContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  exportButton: {
    position: 'absolute',
    top: 120,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiButton: {
    position: 'absolute',
    top: 180,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiSettingsButton: {
    position: 'absolute',
    top: 240,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  publishButton: {
    position: 'absolute',
    top: 300,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
