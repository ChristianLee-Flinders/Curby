import { router } from 'expo-router';
import { ArrowLeftRight, Car, CircleQuestionMark, CreditCard, House, LogOut, Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMyBookings, useSavedIds, useVehicles } from '@/api/queries';
import { Sheet } from '@/components/sheet';
import { TAB_BAR_SPACE } from '@/components/tab-bar';
import { Muted, Txt } from '@/components/txt';
import { Button, Card, Field, ListGroup, ListRow, SectionLabel } from '@/components/ui';
import { initials, monthName } from '@/lib/format';
import { errorMessage, supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { useAppState } from '@/providers/app-state';
import { useAuth } from '@/providers/auth';
import { useToast } from '@/providers/toast';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { profile, session, signOut, refreshProfile } = useAuth();
  const { setMode } = useAppState();
  const toast = useToast();
  const vehicles = useVehicles();
  const bookings = useMyBookings();
  const saved = useSavedIds();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(profile?.full_name ?? '');
  const [busy, setBusy] = useState(false);

  const since = profile ? new Date(profile.created_at) : null;

  const saveName = async () => {
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', session!.user.id);
    setBusy(false);
    if (error) return toast(errorMessage(error), 'error');
    await refreshProfile();
    setEdit(false);
    toast('Name updated');
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}>
      <View style={[styles.head, { paddingTop: insets.top + 18 }]}>
        <View style={styles.ring}>
          <View style={styles.av}>
            <Txt w="bold" size={24} color={colors.primaryDark}>
              {initials(profile?.full_name)}
            </Txt>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Txt w="extrabold" size={26} tracking={-0.9} numberOfLines={1}>
            {profile?.full_name || 'Your profile'}
          </Txt>
          <Muted size={13.5}>
            {session?.user.email}
            {since ? `\nOn Curby since ${monthName(since.getMonth())} ${since.getFullYear()}` : ''}
          </Muted>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit name" onPress={() => (setName(profile?.full_name ?? ''), setEdit(true))} hitSlop={10}>
          <Pencil size={20} color={colors.grey} />
        </Pressable>
      </View>

      <View style={styles.stats}>
        <Stat n={bookings.data?.length ?? 0} label="Bookings" />
        <Stat n={vehicles.data?.length ?? 0} label="Vehicles" />
        <Stat n={saved.data?.length ?? 0} label="Saved spaces" />
      </View>

      <Pressable accessibilityRole="button" onPress={() => setMode('host')} style={styles.host}>
        <View style={styles.hostIcon}>
          <House size={26} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Txt w="extrabold" size={17} color="#fff">
            Switch to hosting
          </Txt>
          <Txt size={13} color="#C8CCE0" style={{ marginTop: 3 }}>
            List your driveway, manage bookings and track earnings.
          </Txt>
        </View>
        <ArrowLeftRight size={22} color="#fff" />
      </Pressable>

      <SectionLabel>Account</SectionLabel>
      <ListGroup>
        <ListRow first icon={Car} title="Vehicles" subtitle={vehicles.data?.map((v) => v.registration).join(' · ') || 'Add your car'} onPress={() => router.push('/vehicles')} />
        <ListRow icon={CreditCard} title="Payment methods" subtitle="Test mode: no payment is taken yet" />
      </ListGroup>

      <SectionLabel>Support</SectionLabel>
      <ListGroup>
        <ListRow first icon={CircleQuestionMark} title="Help centre" subtitle="Get help with a booking" onPress={() => Linking.openURL('mailto:help@curby.app').catch(() => toast('Email help@curby.app'))} />
        <ListRow icon={LogOut} title="Sign out" danger onPress={() => signOut()} />
      </ListGroup>
      <Muted size={12} style={{ textAlign: 'center', marginTop: 20 }}>
        Curby 1.0 · Made in London
      </Muted>

      <Sheet visible={edit} onClose={() => setEdit(false)} title="Your name">
        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          <Field label="Full name" value={name} onChangeText={setName} autoFocus autoComplete="name" />
          <Button title="Save" onPress={saveName} loading={busy} disabled={name.trim().length < 2} />
        </View>
      </Sheet>
    </ScrollView>
  );
}

const Stat = ({ n, label }: { n: number; label: string }) => (
  <Card style={{ flex: 1, padding: 12 }}>
    <Txt w="extrabold" size={19} tracking={-0.4}>
      {n}
    </Txt>
    <Muted size={11.5} w="semibold">
      {label}
    </Muted>
  </Card>
);

const styles = StyleSheet.create({
  head: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  ring: { width: 72, height: 72, borderRadius: 36, padding: 3, backgroundColor: colors.primary },
  av: { flex: 1, borderRadius: 33, borderWidth: 2, borderColor: '#fff', backgroundColor: '#E2D9FF', alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 18 },
  host: { marginHorizontal: 16, marginTop: 18, padding: 18, borderRadius: 24, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', gap: 14 },
  hostIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
});
