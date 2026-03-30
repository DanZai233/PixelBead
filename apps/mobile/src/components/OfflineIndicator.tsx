import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/**
 * Offline indicator component
 * Shows banner at top of screen when device is offline
 * Automatically appears/disappears based on network state
 */
export function OfflineIndicator() {
  const [showBanner, setShowBanner] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected || !state.isInternetReachable;

      if (offline && !showBanner) {
        setShowBanner(true);
        // Slide in animation
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (!offline && showBanner) {
        // Slide out animation
        Animated.timing(slideAnim, {
          toValue: -40,
          duration: 300,
          useNativeDriver: true,
        }).start();
        // Hide banner after animation
        setTimeout(() => setShowBanner(false), 300);
      }
    });

    // Cleanup subscription
    return unsubscribe;
  }, [showBanner, slideAnim]);

  if (!showBanner) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        { transform: [{ translateY: slideAnim }] },
      ]}
      accessible={true}
      accessibilityLabel="You are currently offline"
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityHint="Core editing features still work offline"
    >
      <View style={styles.bannerContent}>
        <MaterialIcons name="wifi-off" size={20} color="#FFFFFF" />
        <Text style={styles.bannerText}>You're offline</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#FF9800', // Orange/warning color
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
