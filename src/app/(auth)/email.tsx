import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { Muted, Title, Txt } from '@/components/txt';
import { Button, Field, NavBar } from '@/components/ui';
import { errorMessage, supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { useToast } from '@/providers/toast';

export default function EmailAuth() {
  const toast = useToast();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const canSubmit = emailOk && password.length >= 8 && (mode === 'signin' || name.trim().length > 1);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        // With email confirmation on, there's no session until the link is tapped
        if (!data.session) setSent(true);
      }
    } catch (e) {
      const m = errorMessage(e);
      toast(m.includes('Invalid login') ? 'That email and password don’t match. Try again or reset your password.' : m, 'error');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!emailOk) return toast('Enter your email first, then tap “Forgot password”', 'error');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    toast(error ? errorMessage(error) : 'Check your email for a reset link', error ? 'error' : 'ok');
  };

  if (sent)
    return (
      <View style={{ flex: 1 }}>
        <NavBar />
        <View style={{ padding: 24 }}>
          <Title>Check your email</Title>
          <Muted size={15} style={{ marginTop: 10, lineHeight: 22 }}>
            We’ve sent a confirmation link to {email.trim()}. Tap it on this phone, then come back and sign in.
          </Muted>
          <Button title="Back to sign in" variant="secondary" style={{ marginTop: 24 }} onPress={() => (setSent(false), setMode('signin'))} />
        </View>
      </View>
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavBar />
      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 8, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Title>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Title>
        <Muted size={15} style={{ marginBottom: 6 }}>
          {mode === 'signin' ? 'Sign in to book and manage parking.' : 'It takes less than a minute.'}
        </Muted>
        {mode === 'signup' && <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" placeholder="Olivia Martin" />}
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          textContentType={mode === 'signin' ? 'password' : 'newPassword'}
          placeholder="At least 8 characters"
          onSubmitEditing={() => canSubmit && submit()}
        />
        {mode === 'signin' && (
          <Pressable onPress={reset} hitSlop={8} style={{ alignSelf: 'flex-end' }}>
            <Txt w="semibold" size={14} color={colors.primary}>
              Forgot password?
            </Txt>
          </Pressable>
        )}
        <Button title={mode === 'signin' ? 'Sign in' : 'Create account'} onPress={submit} loading={busy} disabled={!canSubmit} style={{ marginTop: 6 }} />
        <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={{ alignSelf: 'center', padding: 8 }}>
          <Txt w="semibold" size={14.5} color={colors.grey}>
            {mode === 'signin' ? 'New to Curby? ' : 'Already have an account? '}
            <Txt w="bold" size={14.5} color={colors.primary}>
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </Txt>
          </Txt>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
