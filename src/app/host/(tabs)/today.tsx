import { router } from 'expo-router';
import { Check, ChevronRight, MessageCircle, Plus, Star } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHostBookings, useHostListings, useRespondToBooking } from '@/api/queries';
import { HostHeader } from '@/components/host-header';
import { TAB_BAR_SPACE } from '@/components/tab-bar';
import { Muted, Txt } from '@/components/txt';
import { Avatar, Button, Card, CircleButton, Empty, IconTile, Loading, SectionHeader, Tag, tintFor } from '@/components/ui';
import { dayLabel, firstName, gbp, initials, longDay, monthName, sameDay, time } from '@/lib/format';
import { errorMessage } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import type { HostBooking } from '@/lib/types';
import { useToast } from '@/providers/toast';

export default function HostToday() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const bookings = useHostBookings();
  const listings = useHostListings();
  const respond = useRespondToBooking();
  const now = new Date();
  const all = bookings.data ?? [];

  const live = all.filter((b) => b.status === 'confirmed');
  const thisMonth = live.filter((b) => new Date(b.starts_at).getMonth() === now.getMonth() && new Date(b.starts_at).getFullYear() === now.getFullYear());
  const earned = thisMonth.reduce((s, b) => s + b.host_payout, 0);
  const requests = all.filter((b) => b.status === 'pending' && new Date(b.ends_at) > now);
  const today = live.filter((b) => sameDay(new Date(b.starts_at), now) || (new Date(b.starts_at) <= now && new Date(b.ends_at) >= now));
  const upcoming = live.filter((b) => new Date(b.starts_at) > now && !today.includes(b)).slice(0, 5);
  const ls = listings.data ?? [];
  const rated = ls.filter((l) => l.review_count > 0);
  const avg = rated.length ? rated.reduce((s, l) => s + Number(l.rating_avg), 0) / rated.length : 0;

  const answer = (b: HostBooking, accept: boolean) =>
    respond.mutate(
      { id: b.id, accept },
      {
        onSuccess: () => toast(accept ? `Accepted · ${firstName(b.driver?.full_name) || 'The driver'} has been told` : 'Request declined'),
        onError: (e) => toast(errorMessage(e), 'error'),
      }
    );

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: TAB_BAR_SPACE }}
      refreshControl={
        <RefreshControl
          refreshing={bookings.isRefetching}
          onRefresh={() => {
            bookings.refetch();
            listings.refetch();
          }}
          tintColor={colors.primary}
        />
      }>
      <HostHeader title={ls.length ? 'Your driveway' : 'Start hosting'} sub={longDay(now)} />

      {listings.isLoading ? (
        <Loading />
      ) : ls.length === 0 ? (
        <Card style={{ margin: 16, marginTop: 18 }}>
          <Empty icon={Plus} title="List your first space" body="Tell us about your driveway, set a price and start earning. It takes about five minutes." action="List your space" onAction={() => router.push('/host/new-listing')} />
        </Card>
      ) : (
        <>
          <Pressable accessibilityRole="button" onPress={() => router.push('/host/earnings')} style={styles.earn}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt w="semibold" size={13} color="#DCD3FF">
                Earned in {monthName(now.getMonth())}
              </Txt>
              <View style={styles.pill}>
                <Txt w="bold" size={12} color="#fff">
                  {thisMonth.length} booking{thisMonth.length === 1 ? '' : 's'}
                </Txt>
              </View>
            </View>
            <Txt w="extrabold" size={36} color="#fff" tracking={-1.2} style={{ marginTop: 2, fontVariant: ['tabular-nums'] }}>
              {gbp(earned)}
            </Txt>
            <Txt w="semibold" size={13} color="#DCD3FF">
              After Curby’s 15% fee · paid weekly
            </Txt>
          </Pressable>

          <View style={styles.stats}>
            <StatCard v={String(ls.filter((l) => l.is_active).length)} k={`Live space${ls.filter((l) => l.is_active).length === 1 ? '' : 's'}`} />
            <StatCard v={avg ? avg.toFixed(2) : 'New'} k="Rating" icon={!!avg} />
            <StatCard v={String(today.length)} k="Guests today" />
          </View>

          <SectionHeader title="Requests" />
          {requests.length === 0 ? (
            <Card style={{ marginHorizontal: 16, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <IconTile icon={Check} tone="ok" size={40} />
              <View>
                <Txt w="bold" size={14.5}>
                  You’re all caught up
                </Txt>
                <Muted size={12.5}>Requests for spaces without instant book show here.</Muted>
              </View>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {requests.map((b) => (
                <Card key={b.id} style={{ marginHorizontal: 16, padding: 14 }}>
                  <GuestRow b={b} />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <Button title="Decline" variant="outline" small style={{ flex: 1 }} onPress={() => answer(b, false)} disabled={respond.isPending} />
                    <Button title="Accept" small style={{ flex: 1 }} onPress={() => answer(b, true)} disabled={respond.isPending} />
                  </View>
                </Card>
              ))}
            </View>
          )}

          <SectionHeader title="Today" />
          {bookings.isLoading ? (
            <Loading />
          ) : today.length === 0 ? (
            <Muted style={{ paddingHorizontal: 20 }}>No guests today.</Muted>
          ) : (
            <View style={{ gap: 10 }}>
              {today.map((b) => (
                <Card key={b.id} style={{ marginHorizontal: 16, padding: 14 }}>
                  <GuestRow b={b} />
                </Card>
              ))}
            </View>
          )}

          {upcoming.length > 0 && (
            <>
              <SectionHeader title="Coming up" />
              <View style={{ gap: 10 }}>
                {upcoming.map((b) => (
                  <Card key={b.id} style={{ marginHorizontal: 16, padding: 14 }}>
                    <GuestRow b={b} />
                  </Card>
                ))}
              </View>
            </>
          )}

          <Card onPress={() => router.push('/host/new-listing')} style={{ marginHorizontal: 16, marginTop: 18, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <IconTile icon={Plus} />
            <View style={{ flex: 1 }}>
              <Txt w="bold" size={15}>
                List another space
              </Txt>
              <Muted size={12.5}>Garage, bay or second driveway</Muted>
            </View>
            <ChevronRight size={18} color={colors.grey2} />
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function GuestRow({ b }: { b: HostBooking }) {
  const name = b.driver?.full_name || 'Curby driver';
  const [bg, ink] = tintFor(name);
  const s = new Date(b.starts_at);
  const e = new Date(b.ends_at);
  const now = new Date();
  const state = b.status === 'pending' ? null : s <= now && e >= now ? 'Parked now' : e < now ? 'Left' : 'Upcoming';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar name={initials(name)} size={44} tint={bg} ink={ink} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt w="bold" size={15} numberOfLines={1}>
          {name.split(' ')[0]} {name.split(' ')[1]?.[0] ? `${name.split(' ')[1][0]}.` : ''}
        </Txt>
        <Muted size={12.5} numberOfLines={1}>
          {dayLabel(s)} · {time(s)}–{time(e)}
        </Muted>
        <Muted size={12.5} numberOfLines={1}>
          {[b.vehicle?.registration, b.vehicle?.make_model].filter(Boolean).join(' · ') || b.listing?.title}
        </Muted>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Txt w="extrabold" size={15.5} style={{ fontVariant: ['tabular-nums'] }}>
          {gbp(b.host_payout)}
        </Txt>
        {state ? <Tag label={state} tone={state === 'Parked now' ? 'ok' : 'purple'} /> : <Muted size={11}>you earn</Muted>}
      </View>
      <CircleButton icon={MessageCircle} label="Message driver" variant="soft" size={36} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: b.id } })} />
    </View>
  );
}

function StatCard({ v, k, icon }: { v: string; k: string; icon?: boolean }) {
  return (
    <Card style={{ flex: 1, padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        {icon && <Star size={15} color={colors.navy} fill={colors.navy} />}
        <Txt w="extrabold" size={19} tracking={-0.4}>
          {v}
        </Txt>
      </View>
      <Muted size={11.5} w="semibold">
        {k}
      </Muted>
    </Card>
  );
}

const styles = StyleSheet.create({
  earn: { marginHorizontal: 16, marginTop: 18, padding: 18, borderRadius: 24, backgroundColor: colors.primary },
  pill: { height: 24, paddingHorizontal: 9, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 12 },
});
