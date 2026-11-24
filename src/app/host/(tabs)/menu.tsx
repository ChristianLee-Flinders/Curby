import { router } from 'expo-router';
import { ArrowLeftRight, Car, CircleQuestionMark, FileText, Landmark, LogOut, Plus, ShieldCheck } from 'lucide-react-native';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHostListings } from '@/api/queries';
import { TAB_BAR_SPACE } from '@/components/tab-bar';
import { Muted, Txt } from '@/components/txt';
import { ListGroup, ListRow, SectionLabel } from '@/components/ui';
import { initials } from '@/lib/format';
import { colors } from '@/lib/theme';
import { useAppState } from '@/providers/app-state';
import { useAuth } from '@/providers/auth';
import { useToast } from '@/providers/toast';

export default function HostMenu() {
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const { setMode } = useAppState();
  const toast = useToast();
  const { data: ls = [] } = useHostListings();

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}>
      <View style={[styles.head, { paddingTop: insets.top + 18 }]}>
        <View style={styles.ring}>
          <View style={styles.av}>
            <Txt w="bold" size={21} color={colors.primaryDark}>
              {initials(profile?.full_name)}
            </Txt>
          </View>
        </View>
        <View>
          <Txt w="extrabold" size={24} tracking={-0.8}>
            {profile?.full_name || 'Host'}
          </Txt>
          <Muted size={13.5}>
            {ls.length} space{ls.length === 1 ? '' : 's'} listed
          </Muted>
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={() => setMode('driver')} style={styles.switch}>
        <View style={styles.switchIcon}>
          <Car size={26} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Txt w="extrabold" size={17} color="#fff">
            Switch to parking
          </Txt>
          <Txt size={13} color="#C8CCE0" style={{ marginTop: 3 }}>
            Find and book spaces across London.
          </Txt>
        </View>
        <ArrowLeftRight size={22} color="#fff" />
      </Pressable>

      <SectionLabel>Hosting</SectionLabel>
      <ListGroup>
        <ListRow first icon={Plus} title="List a new space" subtitle="Driveway, garage or bay" onPress={() => router.push('/host/new-listing')} />
        <ListRow icon={Landmark} title="Payout method" subtitle="Add a bank account when payments go live" onPress={() => toast('Payouts are in test mode for now')} />
        <ListRow icon={ShieldCheck} title="Host guidelines" subtitle="Insurance, safety and house rules" onPress={() => Linking.openURL('https://curby.app/hosts').catch(() => {})} />
        <ListRow icon={FileText} title="Earnings statements" subtitle="For your Self Assessment tax return" onPress={() => router.push('/host/earnings')} />
      </ListGroup>

      <SectionLabel>Support</SectionLabel>
      <ListGroup>
        <ListRow first icon={CircleQuestionMark} title="Host help" subtitle="help@curby.app" onPress={() => Linking.openURL('mailto:help@curby.app').catch(() => toast('Email help@curby.app'))} />
        <ListRow icon={LogOut} title="Sign out" danger onPress={() => signOut()} />
      </ListGroup>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  ring: { width: 64, height: 64, borderRadius: 32, padding: 3, backgroundColor: colors.primary },
  av: { flex: 1, borderRadius: 29, borderWidth: 2, borderColor: '#fff', backgroundColor: '#E2D9FF', alignItems: 'center', justifyContent: 'center' },
  switch: { marginHorizontal: 16, marginTop: 20, padding: 18, borderRadius: 24, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', gap: 14 },
  switchIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
});
