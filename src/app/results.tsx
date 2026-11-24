import { router } from 'expo-router';
import { ChevronLeft, List, Map as MapIcon, Plug, RefreshCw, House, Wallet, Zap, MapPin } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSearchListings } from '@/api/queries';
import { DateTimeSheet } from '@/components/date-time-sheet';
import { HeartButton, ListingCard, ListingPhoto, Rating, badgeFor } from '@/components/listing';
import { PriceMarker } from '@/components/price-marker';
import { Muted, Txt } from '@/components/txt';
import { Card, Chip, CircleButton, Empty, Loading, Tag } from '@/components/ui';
import { dayLabel, duration, estimate, gbp, hoursBetween, miles, sameDay, time, walkMins } from '@/lib/format';
import { DEFAULT_PLACE, distanceKm } from '@/lib/places';
import { colors, shadow } from '@/lib/theme';
import type { PublicListing } from '@/lib/types';
import { useAppState } from '@/providers/app-state';

type FilterKey = 'instant' | 'ev' | 'covered' | 'cheap';
const FILTERS: { key: FilterKey; label: string; icon: typeof Zap }[] = [
  { key: 'instant', label: 'Instant book', icon: Zap },
  { key: 'ev', label: 'EV charging', icon: Plug },
  { key: 'covered', label: 'Covered', icon: House },
  { key: 'cheap', label: 'Under £2.50', icon: Wallet },
];

export default function Results() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { search, setTimes } = useAppState();
  const place = search.place ?? DEFAULT_PLACE;
  const [center, setCenter] = useState({ lat: place.lat, lng: place.lng });
  const [pendingRegion, setPendingRegion] = useState<Region | null>(null);
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [listView, setListView] = useState(false);
  const [sheet, setSheet] = useState(false);
  const mapRef = useRef<MapView>(null);
  const carRef = useRef<FlatList<PublicListing>>(null);

  const q = useSearchListings({ lat: center.lat, lng: center.lng, arrive: search.arrive, leave: search.leave, radiusKm: 6 });
  const h = hoursBetween(search.arrive, search.leave);

  const items = useMemo(() => {
    const ls = (q.data ?? []).filter(
      (l) =>
        (!filters.has('instant') || l.instant_book) &&
        (!filters.has('ev') || l.features.includes('ev')) &&
        (!filters.has('covered') || l.features.includes('covered') || l.space_type === 'garage') &&
        (!filters.has('cheap') || l.price_per_hour < 2.5)
    );
    // available first, then nearest
    return ls.sort((a, b) => Number(b.is_available) - Number(a.is_available) || (filters.has('cheap') ? a.price_per_hour - b.price_per_hour : a.distance_km - b.distance_km));
  }, [q.data, filters]);

  const sel = items.find((l) => l.id === selected) ?? items[0];
  const cardW = Math.min(width - 56, 340);

  const focus = (l: PublicListing, scroll = true) => {
    setSelected(l.id);
    mapRef.current?.animateCamera({ center: { latitude: l.lat, longitude: l.lng } }, { duration: 350 });
    if (scroll) {
      const i = items.findIndex((x) => x.id === l.id);
      if (i >= 0) carRef.current?.scrollToIndex({ index: i, animated: true, viewPosition: 0.5 });
    }
  };

  const toggle = (k: FilterKey) =>
    setFilters((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  const timeLabel = `${dayLabel(search.arrive)} ${time(search.arrive)} – ${sameDay(search.arrive, search.leave) ? '' : dayLabel(search.leave) + ' '}${time(search.leave)} · ${duration(h)}`;

  return (
    <View style={{ flex: 1, backgroundColor: '#ECEEF3' }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={{ latitude: place.lat, longitude: place.lng, latitudeDelta: 0.045, longitudeDelta: 0.045 }}
        showsUserLocation
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        mapPadding={{ top: insets.top + 110, bottom: 170, left: 0, right: 0 }}
        onRegionChangeComplete={(r) => {
          if (distanceKm(r.latitude, r.longitude, center.lat, center.lng) > 1.2) setPendingRegion(r);
        }}>
        {items.map((l) => {
          const on = sel?.id === l.id;
          return (
            <Marker
              key={`${l.id}-${on ? 1 : 0}`}
              coordinate={{ latitude: l.lat, longitude: l.lng }}
              onPress={() => focus(l)}
              tracksViewChanges={Platform.OS === 'android'}
              zIndex={on ? 10 : 1}
              anchor={{ x: 0.5, y: 1 }}
              accessibilityLabel={`${l.title}, ${gbp(l.price_per_hour)} an hour`}>
              <PriceMarker price={l.price_per_hour} selected={on} unavailable={!l.is_available} />
            </Marker>
          );
        })}
      </MapView>

      {/* top: search summary + filters */}
      <View style={[styles.top, { top: insets.top + 6 }]}>
        <View style={styles.search}>
          <CircleButton icon={ChevronLeft} label="Back" variant="plain" onPress={() => router.back()} />
          <Pressable style={{ flex: 1, minWidth: 0 }} onPress={() => router.push('/search')} accessibilityRole="button" accessibilityLabel="Change location">
            <Txt w="bold" size={15} numberOfLines={1}>
              {place.name}
            </Txt>
            <Pressable onPress={() => setSheet(true)} hitSlop={6} accessibilityRole="button" accessibilityLabel="Change times">
              <Muted size={12} numberOfLines={1}>
                {timeLabel}
              </Muted>
            </Pressable>
          </Pressable>
          <CircleButton icon={listView ? MapIcon : List} label={listView ? 'Show map' : 'Show list'} variant="soft" onPress={() => setListView((v) => !v)} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 10, paddingHorizontal: 2 }}>
          {FILTERS.map((f) => (
            <View key={f.key} style={shadow.soft}>
              <Chip label={f.label} icon={f.icon} on={filters.has(f.key)} onPress={() => toggle(f.key)} />
            </View>
          ))}
        </ScrollView>
        {pendingRegion && !listView && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setCenter({ lat: pendingRegion.latitude, lng: pendingRegion.longitude });
              setPendingRegion(null);
            }}
            style={styles.searchArea}>
            <RefreshCw size={15} color={colors.navy} strokeWidth={2.4} />
            <Txt w="bold" size={13.5}>
              Search this area
            </Txt>
          </Pressable>
        )}
      </View>

      {/* list view */}
      {listView && (
        <FlatList
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]}
          contentContainerStyle={{ paddingTop: insets.top + 130, paddingBottom: insets.bottom + 30, gap: 16 }}
          data={items}
          keyExtractor={(l) => l.id}
          ListHeaderComponent={
            <Muted w="semibold" style={{ paddingHorizontal: 20 }}>
              {items.length} spaces · prices for {duration(h)}
            </Muted>
          }
          ListEmptyComponent={q.isLoading ? <Loading /> : <NoResults onClear={() => setFilters(new Set())} hasFilters={filters.size > 0} />}
          renderItem={({ item: l }) => <BigCard l={l} hours={h} />}
        />
      )}

      {/* map carousel */}
      {!listView && (
        <View style={[styles.carousel, { bottom: insets.bottom + 14 }]}>
          {q.isLoading ? (
            <Card style={{ marginHorizontal: 20 }}>
              <Loading />
            </Card>
          ) : items.length === 0 ? (
            <Card style={{ marginHorizontal: 20 }}>
              <NoResults onClear={() => setFilters(new Set())} hasFilters={filters.size > 0} compact />
            </Card>
          ) : (
            <FlatList
              ref={carRef}
              horizontal
              data={items}
              keyExtractor={(l) => l.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardW + 12}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              getItemLayout={(_, i) => ({ length: cardW + 12, offset: 20 + i * (cardW + 12), index: i })}
              onMomentumScrollEnd={(e) => {
                const i = Math.round(e.nativeEvent.contentOffset.x / (cardW + 12));
                const l = items[Math.max(0, Math.min(items.length - 1, i))];
                if (l && l.id !== sel?.id) focus(l, false);
              }}
              renderItem={({ item }) => <ListingCard l={item} style={{ width: cardW }} />}
            />
          )}
        </View>
      )}

      <DateTimeSheet
        visible={sheet}
        arrive={search.arrive}
        leave={search.leave}
        onClose={() => setSheet(false)}
        onDone={(a, b) => {
          setTimes(a, b);
          setSheet(false);
        }}
      />
    </View>
  );
}

function BigCard({ l, hours }: { l: PublicListing; hours: number }) {
  const { total } = estimate(l.price_per_hour, hours);
  return (
    <Card onPress={() => router.push({ pathname: '/listing/[id]', params: { id: l.id } })} style={{ marginHorizontal: 16, overflow: 'hidden' }}>
      <View>
        <ListingPhoto l={l} style={{ height: 190, borderTopLeftRadius: 22, borderTopRightRadius: 22 }} />
        <View style={{ position: 'absolute', top: 12, right: 12 }}>
          <HeartButton id={l.id} />
        </View>
        <Tag label={badgeFor(l)} icon={Zap} style={{ position: 'absolute', top: 12, left: 12, height: 26, backgroundColor: 'rgba(255,255,255,0.95)' }} />
      </View>
      <View style={{ padding: 16, paddingTop: 13 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Txt w="bold" size={16} tracking={-0.3} style={{ flex: 1 }} numberOfLines={1}>
            {l.title}
          </Txt>
          <Rating l={l} />
        </View>
        <Muted size={12.5} style={{ marginTop: 3 }} numberOfLines={1}>
          {miles(l.distance_km)} · {walkMins(l.distance_km)} min walk · {l.postcode} · {l.street}
        </Muted>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
          <Txt w="extrabold" size={18} tracking={-0.4}>
            {gbp(l.price_per_hour)}
            <Txt w="medium" size={12.5} color={colors.grey}>
              {' '}
              /hr
            </Txt>
          </Txt>
          {l.is_available ? (
            <Muted w="semibold">{gbp(total)} total</Muted>
          ) : (
            <Tag label="Booked at these times" tone="warn" />
          )}
        </View>
      </View>
    </Card>
  );
}

function NoResults({ onClear, hasFilters, compact }: { onClear: () => void; hasFilters: boolean; compact?: boolean }) {
  if (compact)
    return (
      <Pressable onPress={hasFilters ? onClear : undefined} style={{ padding: 18, alignItems: 'center' }}>
        <Txt w="bold">No spaces here yet</Txt>
        <Muted size={13} style={{ marginTop: 4, textAlign: 'center' }}>
          {hasFilters ? 'Tap to clear filters, or move the map.' : 'Move the map and tap “Search this area”.'}
        </Muted>
      </Pressable>
    );
  return (
    <Empty
      icon={MapPin}
      title="No spaces match"
      body={hasFilters ? 'Turn off a filter to see more driveways.' : 'Try another area of London.'}
      action={hasFilters ? 'Clear filters' : undefined}
      onAction={onClear}
    />
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 12, right: 12 },
  search: { height: 56, borderRadius: 28, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6, ...shadow.card },
  searchArea: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.card,
    ...shadow.card,
  },
  carousel: { position: 'absolute', left: 0, right: 0 },
});
