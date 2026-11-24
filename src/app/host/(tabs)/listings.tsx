import { router } from 'expo-router';
import { Minus, Plus, SquareParking } from 'lucide-react-native';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHostBookings, useHostListings, useUpdateListing } from '@/api/queries';
import { ListingPhoto, Rating } from '@/components/listing';
import { TAB_BAR_SPACE } from '@/components/tab-bar';
import { Muted, Title, Txt } from '@/components/txt';
import { Card, CircleButton, Empty, Loading, Tag, Toggle } from '@/components/ui';
import { gbp } from '@/lib/format';
import { AVAILABILITY, SPACE_TYPES } from '@/lib/places';
import { errorMessage } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import type { Listing } from '@/lib/types';
import { useToast } from '@/providers/toast';

export default function HostListings() {
  const insets = useSafeAreaInsets();
  const listings = useHostListings();
  const bookings = useHostBookings();

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: TAB_BAR_SPACE }}
      refreshControl={<RefreshControl refreshing={listings.isRefetching} onRefresh={() => void listings.refetch()} tintColor={colors.primary} />}>
      <View style={{ paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title accessibilityRole="header">Listings</Title>
        <CircleButton icon={Plus} label="Add a space" color={colors.primary} onPress={() => router.push('/host/new-listing')} />
      </View>
      {listings.isLoading ? (
        <Loading />
      ) : !listings.data?.length ? (
        <Empty icon={SquareParking} title="No spaces yet" body="List your driveway, garage or bay to start earning." action="List your space" onAction={() => router.push('/host/new-listing')} />
      ) : (
        <View style={{ gap: 14, paddingHorizontal: 16, paddingTop: 18 }}>
          {listings.data.map((l) => (
            <ListingAdmin key={l.id} l={l} bookings={(bookings.data ?? []).filter((b) => b.listing_id === l.id && b.status === 'confirmed').length} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function ListingAdmin({ l, bookings }: { l: Listing; bookings: number }) {
  const update = useUpdateListing();
  const toast = useToast();
  const setPrice = (d: number) => {
    const p = Math.min(50, Math.max(0.5, Math.round((Number(l.price_per_hour) + d) * 10) / 10));
    update.mutate({ id: l.id, patch: { price_per_hour: p } }, { onError: (e) => toast(errorMessage(e), 'error') });
  };
  return (
    <Card style={{ overflow: 'hidden' }}>
      <View>
        <ListingPhoto l={l} style={{ height: 160, borderTopLeftRadius: 22, borderTopRightRadius: 22 }} />
        <Tag
          label={l.is_active ? '● Live' : 'Paused'}
          tone={l.is_active ? 'ok' : 'grey'}
          style={{ position: 'absolute', left: 12, top: 12, height: 26, backgroundColor: l.is_active ? colors.okBg : '#fff' }}
        />
      </View>
      <View style={{ padding: 16, paddingTop: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Txt w="bold" size={16} tracking={-0.3} style={{ flex: 1 }} numberOfLines={1}>
            {l.title}
          </Txt>
          <Rating l={l} />
        </View>
        <Muted size={12.5} style={{ marginTop: 3 }}>
          {SPACE_TYPES[l.space_type].label} · {l.postcode.split(' ')[0]} · {bookings} booking{bookings === 1 ? '' : 's'} · {AVAILABILITY[l.availability].label}
        </Muted>
        <View style={styles.row}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <CircleButton icon={Minus} label="Lower price" size={36} onPress={() => setPrice(-0.1)} />
            <Txt w="extrabold" size={18} style={{ minWidth: 80, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
              {gbp(l.price_per_hour)}
              <Txt w="medium" size={12.5} color={colors.grey}>
                /hr
              </Txt>
            </Txt>
            <CircleButton icon={Plus} label="Raise price" size={36} onPress={() => setPrice(0.1)} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Muted w="semibold" size={12.5}>
              {l.is_active ? 'Accepting' : 'Paused'}
            </Muted>
            <Toggle
              label="Accept bookings"
              value={l.is_active}
              onChange={(v) =>
                update.mutate(
                  { id: l.id, patch: { is_active: v } },
                  { onSuccess: () => toast(v ? 'Listing is live again' : 'Listing paused · no new bookings'), onError: (e) => toast(errorMessage(e), 'error') }
                )
              }
            />
          </View>
        </View>
        <View style={[styles.row, { marginTop: 10 }]}>
          <Muted size={12.5} w="semibold">
            Instant book
          </Muted>
          <Toggle
            label="Instant book"
            value={l.instant_book}
            onChange={(v) => update.mutate({ id: l.id, patch: { instant_book: v } }, { onError: (e) => toast(errorMessage(e), 'error') })}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
});
