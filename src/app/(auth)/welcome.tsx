import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Muted, Txt } from '@/components/txt';
import { Button } from '@/components/ui';
import { housePhoto } from '@/lib/places';
import { appleAvailable, signInWithApple, signInWithGoogle } from '@/lib/social-auth';
import { errorMessage } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { useToast } from '@/providers/toast';

function GoogleMark() {
  // Simple four-colour "G" badge so we don't ship Google's artwork
  return (
    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line }}>
      <Txt w="extrabold" size={12} color="#4285F4">
        G
      </Txt>
    </View>
  );
}

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [apple, setApple] = useState(false);
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);

  useEffect(() => {
    appleAvailable().then(setApple);
  }, []);

  const run = async (which: 'google' | 'apple') => {
    setBusy(which);
    try {
      await (which === 'google' ? signInWithGoogle() : signInWithApple());
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.hero}>
        <Image source={housePhoto(1)} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.fade} />
        <View style={[styles.logoWrap, { top: insets.top + 12 }]}>
          <Image source={require('@/assets/images/logo.png')} style={{ height: 36, width: 111 }} contentFit="contain" accessibilityLabel="Curby" />
        </View>
      </View>
      <View style={[styles.body, { paddingBottom: insets.bottom + 20 }]}>
        <Txt w="extrabold" size={36} tracking={-1.2} lh={42}>
          Parking, <Txt w="extrabold" size={36} color={colors.primary} tracking={-1.2}>sorted.</Txt>
        </Txt>
        <Muted size={15.5} style={{ marginTop: 8, lineHeight: 23 }}>
          Book private driveways across London, or earn from yours when you’re not using it.
        </Muted>
        <View style={{ gap: 10, marginTop: 26 }}>
          {apple && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={18}
              style={{ height: 54, opacity: busy ? 0.5 : 1 }}
              onPress={() => !busy && run('apple')}
            />
          )}
          <Pressable
            accessibilityRole="button"
            disabled={!!busy}
            onPress={() => run('google')}
            style={({ pressed }) => [styles.google, (pressed || busy) && { opacity: 0.7 }]}>
            <GoogleMark />
            <Txt w="bold" size={16.5}>
              {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
            </Txt>
          </Pressable>
          <Button title="Continue with email" icon={Mail} onPress={() => router.push('/(auth)/email')} />
        </View>
        <Muted size={12} style={{ textAlign: 'center', marginTop: 16, lineHeight: 18 }}>
          By continuing you agree to Curby’s Terms and Privacy Policy.
        </Muted>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, minHeight: 260 },
  fade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(248,249,252,0.0)' },
  logoWrap: { position: 'absolute', left: 20, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  body: { backgroundColor: colors.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, paddingHorizontal: 22, paddingTop: 28 },
  google: {
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
