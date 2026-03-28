import React, { useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { ToolButton, ToolButtonProps } from './ToolButton';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

interface AnimatedToolButtonProps extends Omit<ToolButtonProps, 'onPress'> {
  onPress?: ToolButtonProps['onPress'];
  animationDuration?: number;
  hapticOnPress?: boolean;
}

export function AnimatedToolButton({
  onPress,
  animationDuration = 150,
  hapticOnPress = true,
  ...props
}: AnimatedToolButtonProps) {
  const { toolChange } = useHapticFeedback();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Animate scale down then back up
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: animationDuration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: animationDuration / 2,
        useNativeDriver: true,
      }),
    ]).start();

    // Trigger haptic feedback
    if (hapticOnPress) {
      toolChange();
    }

    // Call original onPress
    if (onPress) {
      onPress();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <ToolButton
        {...props}
        onPress={handlePress}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 44,
    minHeight: 44,
  },
});
