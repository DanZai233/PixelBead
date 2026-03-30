import React from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useProjectStore } from '../../stores/projectStore';
import { formatRelativeTime } from '../../utils/projectStorage';

interface ProjectListProps {
  onSelectProject: (projectId: string) => void;
}

/**
 * Project list component
 * Displays saved projects with metadata (name, size, date)
 * Supports loading and deleting projects
 */
export function ProjectList({ onSelectProject }: ProjectListProps) {
  const { projects, currentProjectId, deleteProject } = useProjectStore();

  const handleDeleteProject = (projectId: string, e: any) => {
    e.stopPropagation();
    deleteProject(projectId);
  };

  const renderProjectItem = ({ item }: { item: any }) => {
    const isSelected = item.id === currentProjectId;
    const sizeLabel = `${item.gridSize.width}x${item.gridSize.height}`;

    return (
      <TouchableOpacity
        style={[styles.projectItem, isSelected && styles.selectedItem]}
        onPress={() => onSelectProject(item.id)}
        accessible={true}
        accessibilityLabel={`${item.name}, ${sizeLabel} grid, ${formatRelativeTime(item.updatedAt)}`}
        accessibilityRole="button"
        accessibilityHint="Double tap to load project"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.projectInfo}>
          <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
            <MaterialIcons
              name="grid-on"
              size={24}
              color={isSelected ? '#FFFFFF' : '#757575'}
            />
          </View>
          <View style={styles.projectDetails}>
            <Text style={[styles.projectName, isSelected && styles.selectedText]}>
              {item.name}
            </Text>
            <Text style={[styles.projectMeta, isSelected && styles.selectedMeta]}>
              {sizeLabel} • {formatRelativeTime(item.updatedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.projectActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => handleDeleteProject(item.id, e)}
            accessible={true}
            accessibilityLabel={`Delete ${item.name}`}
            accessibilityRole="button"
            accessibilityHint="Double tap to delete project"
          >
            <MaterialIcons
              name="delete-outline"
              size={24}
              color={isSelected ? '#FFFFFF' : '#F44336'}
            />
          </TouchableOpacity>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={isSelected ? '#FFFFFF' : '#757575'}
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (projects.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="folder-open" size={64} color="#BDBDBD" />
        <Text style={styles.emptyText}>No saved projects</Text>
        <Text style={styles.emptySubtext}>
          Create a new canvas or import a project to get started
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={projects}
      keyExtractor={(item) => item.id}
      renderItem={renderProjectItem}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  selectedItem: {
    backgroundColor: '#2196F3',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginLeft: 16 + 44 + 12, // iconContainer width + icon size + spacing
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  projectDetails: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  projectMeta: {
    fontSize: 14,
    color: '#757575',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  selectedMeta: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#757575',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 8,
    textAlign: 'center',
  },
});
