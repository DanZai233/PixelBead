import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useProjectStore } from '../../stores/projectStore';
import { ProjectList } from './ProjectList';
import { NewProjectModal } from './NewProjectModal';

/**
 * Project manager component
 * Provides toolbar with buttons for project operations:
 * - Save: Save current canvas as project
 * - Load: Open project list modal
 * - Import: Import project from JSON file
 * - Export: Export project as JSON and share
 * - New Canvas: Create new canvas with custom size
 * - Clear: Clear current canvas with confirmation
 */
export function ProjectManager() {
  const { currentProjectId, saveProject, loadProject, exportProjectAsJson, importProjectFromJson } =
    useProjectStore();

  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [newCanvasModalVisible, setNewCanvasModalVisible] = useState(false);

  const handleSave = () => {
    if (currentProjectId) {
      // Update existing project
      saveProject(`Project ${currentProjectId.substring(0, 8)}`);
      Alert.alert('Success', 'Project saved!');
    } else {
      // New project - prompt for name
      Alert.prompt(
        'Save Project',
        'Enter a name for your project',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (name: string | undefined) => {
              if (name && name.trim()) {
                saveProject(name.trim());
                Alert.alert('Success', 'Project saved!');
              }
            },
          },
        ],
        'plain-text',
        `Project ${Date.now().toString().substring(-4)}`
      );
    }
  };

  const handleLoad = () => {
    setLoadModalVisible(true);
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const jsonData = await FileSystem.readAsStringAsync(fileUri);

      importProjectFromJson(jsonData);
      Alert.alert('Success', 'Project imported!');
    } catch (error) {
      console.error('Failed to import project:', error);
      Alert.alert('Error', 'Failed to import project. Please check the file format.');
    }
  };

  const handleExport = async () => {
    try {
      if (!currentProjectId) {
        Alert.alert('Info', 'Please save the current project first.');
        return;
      }

      const jsonData = await exportProjectAsJson(currentProjectId);

      // Write to temporary file
      const file = FileSystem.documentDirectory + 'project_export.json';
      await FileSystem.writeAsStringAsync(file, jsonData);

      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file, {
          mimeType: 'application/json',
          dialogTitle: 'Share Project',
        });
        Alert.alert('Success', 'Project exported!');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Failed to export project:', error);
      Alert.alert('Error', 'Failed to export project.');
    }
  };

  const handleNewCanvas = () => {
    setNewCanvasModalVisible(true);
  };

  const handleCreateCanvas = (name: string, width: number, height: number) => {
    useProjectStore.getState().createNewCanvas(width, height);
    // Optionally save the new canvas
    saveProject(name);
    Alert.alert('Success', `Created ${width}x${height} canvas!`);
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Canvas',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            useProjectStore.getState().clearCurrentCanvas();
            Alert.alert('Cleared', 'Canvas has been cleared.');
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* Save Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
        accessible={true}
        accessibilityLabel="Save project"
        accessibilityRole="button"
        accessibilityHint="Save current canvas as a project"
      >
        <MaterialIcons name="save" size={24} color="#212121" />
      </TouchableOpacity>

      {/* Load Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleLoad}
        accessible={true}
        accessibilityLabel="Load project"
        accessibilityRole="button"
        accessibilityHint="Open saved projects list"
      >
        <MaterialIcons name="folder-open" size={24} color="#212121" />
      </TouchableOpacity>

      {/* Import Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleImport}
        accessible={true}
        accessibilityLabel="Import project"
        accessibilityRole="button"
        accessibilityHint="Import project from JSON file"
      >
        <MaterialIcons name="file-upload" size={24} color="#212121" />
      </TouchableOpacity>

      {/* Export Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleExport}
        accessible={true}
        accessibilityLabel="Export project"
        accessibilityRole="button"
        accessibilityHint="Export project as JSON and share"
      >
        <MaterialIcons name="file-download" size={24} color="#212121" />
      </TouchableOpacity>

      {/* New Canvas Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleNewCanvas}
        accessible={true}
        accessibilityLabel="New canvas"
        accessibilityRole="button"
        accessibilityHint="Create new canvas with custom size"
      >
        <MaterialIcons name="add-box" size={24} color="#212121" />
      </TouchableOpacity>

      {/* Clear Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleClear}
        accessible={true}
        accessibilityLabel="Clear canvas"
        accessibilityRole="button"
        accessibilityHint="Clear current canvas (cannot be undone)"
      >
        <MaterialIcons name="delete-sweep" size={24} color="#F44336" />
      </TouchableOpacity>

      {/* Load Project Modal */}
      <Modal
        visible={loadModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLoadModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Load Project</Text>
            <TouchableOpacity
              onPress={() => setLoadModalVisible(false)}
              style={styles.modalCloseButton}
              accessible={true}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <MaterialIcons name="close" size={24} color="#212121" />
            </TouchableOpacity>
          </View>
          <ProjectList onSelectProject={(projectId) => loadProject(projectId)} />
        </View>
      </Modal>

      {/* New Canvas Modal */}
      <NewProjectModal
        visible={newCanvasModalVisible}
        onClose={() => setNewCanvasModalVisible(false)}
        onCreate={handleCreateCanvas}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
