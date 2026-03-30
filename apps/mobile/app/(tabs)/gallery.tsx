import React from 'react';
import { View, StyleSheet } from 'react-native';
import GalleryScreen from '../../src/components/gallery/GalleryScreen';

export default function GalleryTab() {
  return (
    <View style={styles.container}>
      <GalleryScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
});
