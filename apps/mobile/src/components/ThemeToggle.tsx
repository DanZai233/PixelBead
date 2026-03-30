import React, { memo, useRef, useEffect } from 'react';
import { StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSettingsStore } from '../stores/settingsStore';

const THEME_TOGGLE_SIZE = 60;
const ICON_SIZE = 28;

const ThemeToggle = memo(() => {
  const { theme, setTheme } = useSettingsStore();
  const translateX = useRef(new Animated.Value(theme === 'dark' ? THEME_TOGGLE_SIZE / 2 : 0)).current;
  const bgColor = useRef(new Animated.Value(theme === 'dark' ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: theme === 'dark' ? THEME_TOGGLE_SIZE / 2 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(bgColor, {
        toValue: theme === 'dark' ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [theme, translateX, bgColor]);

  const handleToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const backgroundColor = bgColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#f2f2f7', '#1c1c1e'],
  });

  return (
    <Pressable onPress={handleToggle} style={styles.pressable}>
      <Animated.View style={[styles.container, { backgroundColor }]}>
        <Animated.View style={[styles.iconContainer, { transform: [{ translateX }] }]}>
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
  pressable: { width: THEME_TOGGLE_SIZE * 2, height: THEME_TOGGLE_SIZE },
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
