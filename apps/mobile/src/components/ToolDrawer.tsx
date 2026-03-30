import React, { memo, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useCanvasStore } from '../stores/canvasStore';
import { useSettingsStore } from '../stores/settingsStore';
import { ToolType } from '../stores/canvasStore';

interface ToolButtonProps {
  tool: ToolType;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  selected: boolean;
  onPress: (tool: ToolType) => void;
}

const ToolButton = memo<ToolButtonProps>(({ tool, icon, label, selected, onPress }) => {
  const handlePress = () => onPress(tool);

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.toolButton, selected && styles.selected]}
      accessible={true}
      accessibilityLabel={`${label} tool`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityHint="Double tap to select tool"
    >
      <MaterialIcons
        name={icon}
        size={32}
        color={selected ? '#fff' : '#666'}
      />
      <Text style={[styles.toolLabel, selected && styles.labelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
});

ToolButton.displayName = 'ToolButton';

interface ToolDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DRAWER_HEIGHT = 200;

const ToolDrawer = memo<ToolDrawerProps>(({ isOpen, onClose }) => {
  const currentTool = useCanvasStore((state) => state.currentTool);
  const setTool = useCanvasStore((state) => state.setSelectedTool);
  const theme = useSettingsStore((state) => state.theme);
  const translateY = useSharedValue(DRAWER_HEIGHT);

  useEffect(() => {
    translateY.value = withSpring(isOpen ? 0 : DRAWER_HEIGHT, {
      damping: 20,
      stiffness: 300,
    });
  }, [isOpen]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const tools: { tool: ToolType; icon: keyof typeof MaterialIcons.glyphMap; label: string }[] = [
    { tool: 'brush', icon: 'brush', label: 'Brush' },
    { tool: 'eraser', icon: 'auto-fix-high', label: 'Eraser' },
    { tool: 'fill', icon: 'format-color-fill', label: 'Fill' },
    { tool: 'picker', icon: 'colorize', label: 'Picker' },
  ];

  const backgroundColor = theme === 'dark' ? '#2c2c2e' : '#f2f2f7';

  return (
    <Animated.View style={[styles.drawer, drawerStyle, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
          Tools
        </Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
        </Pressable>
      </View>

      <View style={styles.toolsContainer}>
        {tools.map((item) => (
          <ToolButton
            key={item.tool}
            tool={item.tool}
            icon={item.icon}
            label={item.label}
            selected={currentTool === item.tool}
            onPress={setTool}
          />
        ))}
      </View>
    </Animated.View>
  );
});

ToolDrawer.displayName = 'ToolDrawer';

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1,
  },
  toolButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  selected: {
    backgroundColor: '#007AFF',
  },
  toolLabel: {
    fontSize: 12,
    color: '#666',
  },
  labelSelected: {
    color: '#fff',
  },
});

export default ToolDrawer;
