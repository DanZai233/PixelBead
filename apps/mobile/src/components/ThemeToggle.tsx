import React, { memo } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSettingsStore } from '../stores/settingsStore';

const THEME_TOGGLE_SIZE = 60;
const ICON_SIZE = 28;

const ThemeToggle = memo(() => {
  const { theme, setTheme } = useSettingsStore();
  const toggleProgress = useSharedValue(theme === 'dark' ? 1 : 0);

  const handleToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    toggleProgress.value = withTiming(newTheme === 'dark' ? 1 : 0, {
      duration: 300,
    });
  };

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      theme === 'dark' ? '#1c1c1e' : '#f2f2f7',
      { duration: 300 }
    ),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(theme === 'dark' ? THEME_TOGGLE_SIZE / 2 : 0, {
          duration: 300,
        }),
      },
    ],
  }));

  return (
    <Pressable onPress={handleToggle} style={styles.pressable}>
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <MaterialIcons
            name={theme === 'light' ? 'light-mode' : 'dark-mode'}
            size={ICON_SIZE}
            color={theme === 'light' ? '#000' : '#fff'}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
});

ThemeToggle.displayName = 'ThemeToggle';

const styles = StyleSheet.create({
  pressable: {
    width: THEME_TOGGLE_SIZE * 2,
    height: THEME_TOGGLE_SIZE,
  },
  container: {
    width: THEME_TOGGLE_SIZE * 2,
    height: THEME_TOGGLE_SIZE,
    borderRadius: THEME_TOGGLE_SIZE / 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  iconContainer: {
    width: THEME_TOGGLE_SIZE,
    height: THEME_TOGGLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ThemeToggle;
