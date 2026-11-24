import { router } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMyBookings } from '@/api/queries';
import { ListingPhoto } from '@/components/listing';
import { TAB_BAR_SPACE } from '@/components/tab-bar';
import { Muted, Title, Txt } from '@/components/txt';
import { Card, Empty, Loading, Tag } from '@/components/ui';
import { dayLabel, gbp, time } from '@/lib/format';
import { colors } from '@/lib/theme';
import { bookingState, hasReview } from '@/lib/booking-state';
import type { BookingWithListing } from '@/lib/types';

export default function Bookings() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const q = useMyBookings();
  const all = q.data ?? [];
  const upcoming = all.filter((b) => bookingState(b).upcoming);
  const past = all.filter((b) => !bookingState(b).upcoming).reverse();
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: TAB_BAR_SPACE }}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.primary} />}>
      <Title style={{ paddingHorizontal: 20 }} accessibilityRole="header">
        Bookings
      </Title>
      <View style={styles.seg} accessibilityRole="tablist">
        {(['upcoming', 'past'] as const).map((k) => (
          <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} onPress={() => setTab(k)} style={[styles.segBtn, tab === k && styles.segOn]}>
            <Txt w="semibold" size={14} color={tab === k ? colors.navy : colors.grey}>
              {k === 'upcoming' ? `Upcoming (${upcoming.length})` : 'Past'}
            </Txt>
          </Pressable>
        ))}
      </View>
      {q.isLoading ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty
          icon={Calendar}
          title={tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings yet'}
          body={tab === 'upcoming' ? 'When you book a space it’ll appear here with directions and access details.' : 'Your finished and cancelled bookings will show here.'}
          action={tab === 'upcoming' ? 'Find parking' : undefined}
          onAction={() => router.push('/')}
        />
      ) : (
        <View style={{ gap: 14, paddingHorizontal: 16 }}>
          {list.map((b) => (
            <BookingCard key={b.id} b={b} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function BookingCard({ b }: { b: BookingWithListing }) {
  const st = bookingState(b);
  const s = new Date(b.starts_at);
  const e = new Date(b.ends_at);
  const canReview = st.label === 'Completed' && b.status === 'confirmed' && !hasReview(b.review);
  return (
    <Card onPress={() => router.push({ pathname: '/booking/[id]', params: { id: b.id } })} style={{ overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', gap: 12, padding: 12, alignItems: 'center' }}>
        {b.listing && <ListingPhoto l={b.listing} style={{ width: 64, height: 64, borderRadius: 14 }} />}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tag label={st.label} tone={st.tone} />
            <Muted size={12} w="semibold">
              {b.ref}
            </Muted>
          </View>
          <Txt w="bold" size={15} numberOfLines={1} style={{ marginTop: 6 }}>
            {b.listing?.title ?? 'Parking space'}
          </Txt>
          <Muted size={12.5} numberOfLines={1}>
            {b.listing ? `${b.listing.area}, ${b.listing.postcode.split(' ')[0]}` : ''}
          </Muted>
        </View>
      </View>
      <View style={styles.bottom}>
        <View style={styles.cell}>
          <Txt w="bold" size={11} color={colors.grey2} tracking={0.6}>
            {dayLabel(s).toUpperCase()}
          </Txt>
          <Txt w="bold" size={14}>
            {time(s)} – {dayLabel(e) === dayLabel(s) ? '' : `${dayLabel(e)} `}
            {time(e)}
          </Txt>
        </View>
        <View style={[styles.cell, { borderLeftWidth: 1, borderLeftColor: colors.line }]}>
          <Txt w="bold" size={11} color={colors.grey2} tracking={0.6}>
            {canReview ? 'YOUR REVIEW' : 'TOTAL'}
          </Txt>
          <Txt w="bold" size={14} color={canReview ? colors.primary : colors.navy}>
            {canReview ? 'Rate your stay' : gbp(b.total)}
          </Txt>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', backgroundColor: '#ECEDF3', borderRadius: 12, padding: 3, marginHorizontal: 20, marginTop: 16, marginBottom: 18 },
  segBtn: { flex: 1, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.card, shadowColor: '#111A35', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  bottom: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line },
  cell: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
});
