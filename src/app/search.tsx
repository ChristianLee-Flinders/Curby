import * as Location from 'expo-location';
import { router } from 'expo-router';
import { MapPin, Navigation, Search as SearchIcon, Ticket, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Muted, Txt } from '@/components/txt';
import { NavBar, SectionLabel, tap } from '@/components/ui';
import { PLACES, type Place } from '@/lib/places';
import { colors, fonts, shadow } from '@/lib/theme';
import { useAppState } from '@/providers/app-state';
import { useToast } from '@/providers/toast';

export default function SearchScreen() {
  const { search, setPlace } = useAppState();
  const toast = useToast();
  const [q, setQ] = useState(search.place?.name ?? '');
  const [busy, setBusy] = useState(false);

  const matches = useMemo(() => {
    const v = q.trim().toLowerCase();
    if (!v) return PLACES.slice(0, 8);
    return PLACES.filter((p) => p.name.toLowerCase().includes(v) || p.detail.toLowerCase().includes(v));
  }, [q]);

  const pick = (p: Place) => {
    tap();
    setPlace(p);
    router.back();
  };

  /** Anything not in our list (a full postcode, a street) goes to the device geocoder. */
  const geocode = async () => {
    const v = q.trim();
    if (!v) return;
    setBusy(true);
    try {
      const res = await Location.geocodeAsync(/london|[A-Z]{1,2}\d/i.test(v) ? v : `${v}, London, UK`);
      if (!res.length) {
        toast(`We couldn’t find “${v}”. Try a postcode like SW4 9JX.`, 'error');
        return;
      }
      pick({ name: v.length > 28 ? v.slice(0, 28) + '…' : v, detail: 'Searched address', lat: res[0].latitude, lng: res[0].longitude, kind: 'area' });
    } catch {
      toast('Search isn’t available right now. Pick a place from the list.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const here = async () => {
    setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return toast('Allow location access in Settings to search near you', 'error');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      pick({ name: 'Current location', detail: 'Near you', lat: pos.coords.latitude, lng: pos.coords.longitude, kind: 'area' });
    } catch {
      toast('Couldn’t find your location', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <NavBar title="Where to?" />
      <View style={styles.input}>
        <SearchIcon size={20} color={colors.primary} strokeWidth={2.3} />
        <TextInput
          autoFocus
          value={q}
          onChangeText={setQ}
          placeholder="Postcode, street or venue"
          placeholderTextColor={colors.grey2}
          returnKeyType="search"
          onSubmitEditing={() => (matches[0] && q.trim() ? pick(matches[0]) : geocode())}
          style={styles.text}
          accessibilityLabel="Search for a place"
          autoCorrect={false}
        />
        {busy ? (
          <ActivityIndicator color={colors.primary} />
        ) : q ? (
          <Pressable onPress={() => setQ('')} accessibilityLabel="Clear search" hitSlop={10}>
            <X size={18} color={colors.grey2} strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <Row icon={<Navigation size={20} color="#fff" fill="#fff" />} iconBg={colors.primary} title="Use my current location" sub="Find spaces near you" onPress={here} accent />
        <SectionLabel>{q.trim() ? `${matches.length} match${matches.length === 1 ? '' : 'es'}` : 'Popular places'}</SectionLabel>
        {matches.map((p) => (
          <Row
            key={p.name}
            icon={p.kind === 'venue' ? <Ticket size={20} color={colors.primary} /> : <MapPin size={20} color={colors.primary} />}
            title={p.name}
            sub={p.detail}
            onPress={() => pick(p)}
          />
        ))}
        {q.trim().length > 2 && (
          <Row icon={<SearchIcon size={20} color={colors.primary} />} title={`Search for “${q.trim()}”`} sub="Look up this address or postcode" onPress={geocode} />
        )}
      </ScrollView>
    </View>
  );
}

function Row({ icon, iconBg = colors.card, title, sub, onPress, accent }: { icon: React.ReactNode; iconBg?: string; title: string; sub: string; onPress: () => void; accent?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.soft }]}>
      <View style={[styles.icon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Txt w="semibold" size={15} color={accent ? colors.primary : colors.navy}>
          {title}
        </Txt>
        <Muted size={12.5}>{sub}</Muted>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  input: {
    marginHorizontal: 16,
    marginBottom: 10,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  text: { flex: 1, fontSize: 16, fontFamily: fonts.medium, color: colors.navy, height: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 11 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
});
