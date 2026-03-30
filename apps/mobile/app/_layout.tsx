import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Performance optimizations:
// - Hermes JS engine enabled (default in Expo SDK 55)
// - New Architecture enabled for JSI bindings (MMKV, Skia)
// - File-based routing with automatic code splitting (Expo Router)
// - MMKV synchronous storage (no async overhead)
// - React.memo on components (CanvasGrid, ToolDrawer)
// - useAnimatedStyle with useNativeDriver for GPU animations

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
