import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function EmptyGalleryState() {
  return (
    <View style={styles.container}>
      <MaterialIcons name="search" size={64} color="#9CA3AF" />
      <Text style={styles.title}>No designs found</Text>
      <Text style={styles.subtitle}>Try a different search term</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
