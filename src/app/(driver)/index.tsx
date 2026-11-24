import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Bell, House, MapPin, Navigation, Search } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSearchListings } from '@/api/queries';
import { DateTimeSheet } from '@/components/date-time-sheet';
import { ListingCard } from '@/components/listing';
import { TAB_BAR_SPACE } from '@/components/tab-bar';
import { Muted, Txt } from '@/components/txt';
import { Button, Card, CircleButton, Empty, Loading, SectionHeader, tap } from '@/components/ui';
import { dayLabel, duration, firstName, greeting, hoursBetween, initials, time } from '@/lib/format';
import { DEFAULT_PLACE, POPULAR_AREAS, housePhoto } from '@/lib/places';
import { colors, shadow } from '@/lib/theme';
import { useAppState } from '@/providers/app-state';
import { useAuth } from '@/providers/auth';
import { useToast } from '@/providers/toast';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { search, setPlace, setTimes, setMode } = useAppState();
  const toast = useToast();
  const [sheet, setSheet] = useState<null | 'arrive' | 'leave'>(null);
  const [locating, setLocating] = useState(false);

  const near = search.place ?? DEFAULT_PLACE;
  const nearby = useSearchListings({ lat: near.lat, lng: near.lng, arrive: search.arrive, leave: search.leave, radiusKm: 5 });

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast('Allow location access in Settings to search near you', 'error');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [addr] = await Location.reverseGeocodeAsync(pos.coords).catch(() => []);
      const label = addr ? [addr.district || addr.subregion || addr.city, addr.postalCode?.split(' ')[0]].filter(Boolean).join(', ') : 'Current location';
      setPlace({ name: label || 'Current location', detail: 'Near you', lat: pos.coords.latitude, lng: pos.coords.longitude, kind: 'area' });
      toast(`Searching near ${label || 'you'}`);
    } catch {
      toast('Couldn’t find your location. Try searching instead.', 'error');
    } finally {
      setLocating(false);
    }
  };

  const find = () => {
    if (!search.place) setPlace(DEFAULT_PLACE);
    router.push('/results');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: TAB_BAR_SPACE + 10 }}
        refreshControl={<RefreshControl refreshing={nearby.isRefetching} onRefresh={() => void nearby.refetch()} tintColor={colors.primary} />}>
        {/* header */}
        <View style={styles.hdr}>
          <Image source={require('@/assets/images/logo.png')} style={{ height: 31, width: 96 }} contentFit="contain" accessibilityLabel="Curby" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <CircleButton icon={Bell} label="Notifications" onPress={() => toast('No new notifications')} />
            <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={() => router.push('/profile')} style={styles.avRing}>
              <View style={styles.av}>
                <Txt w="bold" size={14} color={colors.primaryDark}>
                  {initials(profile?.full_name)}
                </Txt>
              </View>
            </Pressable>
          </View>
        </View>

        {/* hero */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <Muted w="semibold" size={14}>
            {greeting()}
            {firstName(profile?.full_name) ? `, ${firstName(profile?.full_name)}` : ''}
          </Muted>
          <Txt w="extrabold" size={34} lh={40} tracking={-1.1} style={{ marginTop: 2 }} accessibilityRole="header">
            Parking, <Txt w="extrabold" size={34} color={colors.primary} tracking={-1.1}>sorted.</Txt>
          </Txt>
        </View>

        {/* search card */}
        <View style={styles.sbox}>
          <View style={styles.loc}>
            <Pressable accessibilityRole="search" onPress={() => router.push('/search')} style={styles.locBtn}>
              <Search size={22} color={colors.primary} strokeWidth={2.3} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt w="semibold" size={16} tracking={-0.2} numberOfLines={1}>
                  {search.place?.name ?? 'Where are you parking?'}
                </Txt>
                <Txt w="medium" size={12.5} color={colors.grey2}>
                  {search.place ? 'Tap to change' : 'Postcode, street or venue'}
                </Txt>
              </View>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Use my location" onPress={useMyLocation} style={styles.gps} disabled={locating}>
              <Navigation size={20} color={colors.primary} fill={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.dates}>
            <DateBox label="Arrive" icon="in" d={search.arrive} onPress={() => setSheet('arrive')} />
            <DateBox label="Leave" icon="out" d={search.leave} onPress={() => setSheet('leave')} dur={duration(hoursBetween(search.arrive, search.leave))} />
          </View>
          <Button title="Find parking" iconRight={ArrowRight} onPress={find} />
        </View>

        {/* popular */}
        <SectionHeader title="Popular in London" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
          {POPULAR_AREAS.map((a) => (
            <Pressable
              key={a.label}
              accessibilityRole="button"
              accessibilityLabel={`${a.label}, from £${a.from} an hour`}
              onPress={() => {
                tap();
                setPlace(a.place);
                router.push('/results');
              }}
              style={{ width: 132 }}>
              <View style={styles.area}>
                <Image source={housePhoto(a.photo)} style={StyleSheet.absoluteFill} contentFit="cover" />
                <View style={styles.areaShade} />
                <View style={styles.areaPill}>
                  <MapPin size={11} color="#fff" strokeWidth={2.6} />
                  <Txt w="bold" size={11} color="#fff">
                    {a.place.detail.split(' · ')[1] ?? a.place.detail}
                  </Txt>
                </View>
              </View>
              <Txt w="bold" size={14.5} tracking={-0.2} style={{ marginTop: 8 }}>
                {a.label}
              </Txt>
              <Muted size={12}>From £{a.from}/hr</Muted>
            </Pressable>
          ))}
        </ScrollView>

        {/* nearby */}
        <SectionHeader title="Driveways near you" action="Map view" onAction={find} />
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {nearby.isLoading ? (
            <Loading />
          ) : nearby.error ? (
            <Empty icon={MapPin} title="Couldn’t load spaces" body="Check your connection and pull down to try again." />
          ) : (nearby.data ?? []).length === 0 ? (
            <Empty icon={MapPin} title="No spaces nearby yet" body="Try a different area, or be the first to list a driveway here." />
          ) : (
            nearby.data!.slice(0, 4).map((l) => <ListingCard key={l.id} l={l} />)
          )}
        </View>

        {/* host CTA */}
        <Card style={{ marginHorizontal: 16, marginTop: 20, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={styles.ctaIcon}>
            <House size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt w="extrabold" size={15.5}>
              Got a driveway?
            </Txt>
            <Muted size={13}>Earn when you’re not using it.</Muted>
          </View>
          <Button title="Start hosting" variant="dark" small style={{ paddingHorizontal: 14 }} onPress={() => setMode('host')} />
        </Card>
      </ScrollView>

      <DateTimeSheet
        visible={!!sheet}
        initial={sheet ?? 'arrive'}
        arrive={search.arrive}
        leave={search.leave}
        onClose={() => setSheet(null)}
        onDone={(a, b) => {
          setTimes(a, b);
          setSheet(null);
        }}
      />
    </View>
  );
}

function DateBox({ label, icon, d, onPress, dur }: { label: string; icon: 'in' | 'out'; d: Date; onPress: () => void; dur?: string }) {
  const Icon = icon === 'in' ? ArrowRight : ArrowLeft;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} ${dayLabel(d)} ${time(d)}`} onPress={onPress} style={styles.dt}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon size={13} color={colors.primary} strokeWidth={2.6} />
        <Txt w="bold" size={11.5} color={colors.grey2} tracking={0.6}>
          {label.toUpperCase()}
        </Txt>
      </View>
      <Txt w="bold" size={15} tracking={-0.2} style={{ marginTop: 5 }} numberOfLines={1}>
        {dayLabel(d)}{' '}
        <Txt w="medium" size={15} color={colors.grey}>
          · {time(d)}
        </Txt>
      </Txt>
      {dur && (
        <View style={styles.dur}>
          <Txt w="bold" size={11.5} color={colors.primary}>
            {dur}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hdr: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avRing: { width: 44, height: 44, borderRadius: 22, padding: 2, backgroundColor: colors.primary },
  av: { flex: 1, borderRadius: 20, borderWidth: 2, borderColor: '#fff', backgroundColor: '#E2D9FF', alignItems: 'center', justifyContent: 'center' },
  sbox: { marginHorizontal: 16, marginTop: 16, padding: 8, borderRadius: 26, backgroundColor: colors.card, ...shadow.card },
  loc: { height: 58, borderRadius: 18, backgroundColor: colors.soft, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 7 },
  locBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, height: '100%' },
  gps: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  dates: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  dt: { flex: 1, height: 60, borderRadius: 18, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 10 },
  dur: { position: 'absolute', right: 10, top: 9, backgroundColor: colors.lavender, height: 22, paddingHorizontal: 8, borderRadius: 11, justifyContent: 'center' },
  area: { width: 132, height: 80, borderRadius: 18, overflow: 'hidden', backgroundColor: '#cfd6df' },
  areaShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(17,26,53,0.22)' },
  areaPill: { position: 'absolute', left: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ctaIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
});
