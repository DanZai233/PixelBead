// ContextMenu component for long-press actions

import React, { memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../stores/canvasStore';
import { useSelectionOperations } from '../../hooks/useSelection';
import * as Haptics from 'expo-haptics';

interface ContextMenuItem {
  id: string;
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

const ContextMenu = memo(({ visible, position, onClose }: ContextMenuProps) => {
  const setSelectedColor = useCanvasStore((state) => state.setSelectedColor);
  const setSelectedTool = useCanvasStore((state) => state.setSelectedTool);
  const selectionRegion = useCanvasStore((state) => state.selectionRegion);
  const { copy, cut, clear } = useSelectionOperations();

  const menuItems: ContextMenuItem[] = [
    {
      id: 'picker',
      icon: 'colorize',
      label: 'Color Picker',
      onPress: () => {
        // Color picker logic would be implemented here
        // For now, just close menu
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    },
    {
      id: 'copy',
      icon: 'content-copy',
      label: 'Copy',
      onPress: () => {
        if (selectionRegion) {
          copy(selectionRegion);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
      disabled: !selectionRegion,
    },
    {
      id: 'cut',
      icon: 'content-cut',
      label: 'Cut',
      onPress: () => {
        if (selectionRegion) {
          cut(selectionRegion);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
      disabled: !selectionRegion,
    },
    {
      id: 'clear',
      icon: 'delete-outline',
      label: 'Clear',
      onPress: () => {
        if (selectionRegion) {
          clear(selectionRegion);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
      disabled: !selectionRegion,
    },
    {
      id: 'erase',
      icon: 'auto-fix-high',
      label: 'Erase',
      onPress: () => {
        setSelectedColor('#FFFFFF');
        setSelectedTool('eraser');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    },
  ];

  const handleMenuItemPress = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onPress();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.menu,
            {
              left: position.x,
              top: position.y,
            },
          ]}
        >
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                item.disabled && styles.menuItemDisabled,
              ]}
              onPress={() => handleMenuItemPress(item)}
              disabled={item.disabled}
            >
              <MaterialIcons
                name={item.icon as any}
                size={20}
                color={item.disabled ? '#cccccc' : '#000000'}
              />
              <Text
                style={[
                  styles.menuItemText,
                  item.disabled && styles.menuItemTextDisabled,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    minWidth: 180,
    maxWidth: 220,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#000000',
  },
  menuItemTextDisabled: {
    color: '#cccccc',
  },
});

ContextMenu.displayName = 'ContextMenu';

export { ContextMenu };
export default ContextMenu;
