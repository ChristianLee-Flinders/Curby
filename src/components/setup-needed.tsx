import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Muted, Title, Txt } from '@/components/txt';
import { colors } from '@/lib/theme';

/** Shown when the Supabase keys haven't been added yet, instead of a blank or crashing app. */
export function SetupNeeded() {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  const steps = [
    'Create a project at supabase.com',
    'Run supabase/migrations/…_init.sql, then supabase/seed.sql, in the SQL editor',
    'Copy .env.example to .env and paste your Project URL and anon key',
    'Restart Expo with: npx expo start --clear',
  ];
  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: insets.top + 40 }} style={{ backgroundColor: colors.bg }}>
      <Image source={require('@/assets/images/logo.png')} style={{ height: 34, width: 105 }} resizeMode="contain" />
      <Title style={{ marginTop: 28 }}>Connect Supabase</Title>
      <Muted size={15} style={{ marginTop: 8, lineHeight: 22 }}>
        Curby needs your Supabase project keys before it can sign people in and load parking spaces.
      </Muted>
      <View style={{ marginTop: 24, gap: 14 }}>
        {steps.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' }}>
              <Txt w="bold" size={13} color={colors.primaryDark}>
                {i + 1}
              </Txt>
            </View>
            <Txt size={15} style={{ flex: 1, lineHeight: 22 }}>
              {s}
            </Txt>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
