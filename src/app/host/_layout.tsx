import { Redirect, Stack } from 'expo-router';

import { colors } from '@/lib/theme';
import { useAppState } from '@/providers/app-state';

export default function HostLayout() {
  const { mode } = useAppState();
  if (mode === 'driver') return <Redirect href="/" />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="new-listing" options={{ presentation: 'modal', gestureEnabled: false }} />
    </Stack>
  );
}
