import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useGalleryStore } from '../../stores/galleryStore';
import GalleryCard from './GalleryCard';
import LoadingGalleryState from './LoadingGalleryState';
import EmptyGalleryState from './EmptyGalleryState';
import OfflineGalleryState from './OfflineGalleryState';

export default function GalleryScreen() {
  const { materials, isLoading, isOffline, searchQuery, fetchMaterials, setSearchQuery, clearError } = useGalleryStore();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch materials on mount
  useEffect(() => {
    fetchMaterials();
  }, []);

  // Debounce search (500ms)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        fetchMaterials();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMaterials();
    setRefreshing(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingGalleryState />;
    }

    if (isOffline && materials.length === 0) {
      return <OfflineGalleryState />;
    }

    if (materials.length === 0 && searchQuery) {
      return <EmptyGalleryState />;
    }

    return (
      <FlatList
        data={materials}
        renderItem={({ item }) => (
          <GalleryCard
            material={item}
            onPress={() => {
              // Navigate to detail screen (will be implemented in plan 03)
              console.log('Pressed material:', item.id);
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Material Gallery</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search designs..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            clearError();
          }}
          accessibilityLabel="Search designs"
          accessibilityRole="search"
        />
        {searchQuery && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <MaterialIcons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
});
