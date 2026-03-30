import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Slot, useRouter, usePathname } from 'expo-router';

const tabs = [
  { name: '/(tabs)/editor', label: 'Editor', icon: 'edit' as const },
  { name: '/(tabs)/gallery', label: 'Gallery', icon: 'grid-view' as const },
  { name: '/(tabs)/settings', label: 'Settings', icon: 'settings' as const },
];

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <Slot />
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = pathname.includes(tab.name.replace('/(tabs)', ''));
          return (
            <Pressable
              key={tab.name}
              style={styles.tab}
              onPress={() => router.replace(tab.name as any)}
            >
              <MaterialIcons
                name={tab.icon}
                size={24}
                color={isActive ? '#007AFF' : '#999'}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    paddingBottom: 5,
    paddingTop: 5,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: { fontSize: 11, color: '#999', marginTop: 2 },
  tabLabelActive: { color: '#007AFF' },
});
