import React from 'react';
import { View, StyleSheet } from 'react-native';
import GalleryDetailScreen from '../../../src/components/gallery/GalleryDetailScreen';

export default function GalleryIdScreen() {
  return (
    <View style={styles.container}>
      <GalleryDetailScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
});
