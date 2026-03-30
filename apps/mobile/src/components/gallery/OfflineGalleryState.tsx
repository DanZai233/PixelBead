import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function OfflineGalleryState() {
  return (
    <View style={styles.container}>
      <MaterialIcons name="wifi-off" size={64} color="#F59E0B" />
      <Text style={styles.title}>You're offline</Text>
      <Text style={styles.subtitle}>Check your connection to view designs</Text>
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
    color: '#F59E0B',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
