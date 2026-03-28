import React, { memo } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import ThemeToggle from '../../src/components/ThemeToggle';
import { useSettingsStore } from '../../src/stores/settingsStore';

const SettingItem = memo<{ title: string; description: string }>(({ title, description }) => (
  <View style={styles.settingItem}>
    <View style={styles.settingTextContainer}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
  </View>
));

SettingItem.displayName = 'SettingItem';

export default function SettingsScreen() {
  const { theme } = useSettingsStore();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#fff' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>
          Settings
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#999' : '#666' }]}>
          Appearance
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>
              Theme
            </Text>
            <Text style={[styles.settingDescription, { color: theme === 'dark' ? '#999' : '#666' }]}>
              Switch between dark and light mode
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      {/* Future settings sections (Phase 5) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#999' : '#666' }]}>
          Preferences
        </Text>
        <SettingItem
          title="Grid Lines"
          description="Show grid lines on canvas (Phase 2)"
        />
        <SettingItem
          title="Auto-save"
          description="Automatically save projects (Phase 5)"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginLeft: 20,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  settingItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
});
