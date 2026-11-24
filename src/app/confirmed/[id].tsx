import { router, useLocalSearchParams } from 'expo-router';
import { Check, Clock, MapPin, Navigation } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBooking } from '@/api/queries';
import { ListingPhoto } from '@/components/listing';
import { Muted, Title, Txt } from '@/components/txt';
import { Button, Card, Loading } from '@/components/ui';
import { openDirections } from '@/lib/directions';
import { dayLabel, gbp, time } from '@/lib/format';
import { colors } from '@/lib/theme';

export default function Confirmed() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: b } = useBooking(id);
  const [pop] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  }, [pop]);

  if (!b?.listing) return <Loading />;
  const l = b.listing;
  const pending = b.status === 'pending';

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 24, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30, alignItems: 'stretch' }}>
      <Animated.View style={[styles.ok, pending && { backgroundColor: colors.warn }, { transform: [{ scale: pop }] }]}>
        {pending ? <Clock size={46} color="#fff" strokeWidth={2.6} /> : <Check size={48} color="#fff" strokeWidth={3} />}
      </Animated.View>
      <Title style={{ textAlign: 'center', marginTop: 28 }}>{pending ? 'Request sent' : 'You’re booked!'}</Title>
      <Muted size={15} style={{ textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
        {pending ? 'The host usually replies within a few hours. We’ll let you know as soon as they do.' : 'Your host has been told you’re coming. Directions and access details are in Bookings.'}
      </Muted>

      <Card style={{ marginTop: 28, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', gap: 12, padding: 14, alignItems: 'center' }}>
          <ListingPhoto l={l} style={{ width: 64, height: 64, borderRadius: 14 }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt w="bold" size={15} numberOfLines={1}>
              {l.title}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginTop: 3 }}>
              <MapPin size={13} color={colors.grey} />
              <Muted size={12.5} numberOfLines={1} style={{ flex: 1 }}>
                {l.address_line}, {l.postcode}
              </Muted>
            </View>
          </View>
        </View>
        <View style={styles.grid}>
          <Cell k="Arrive" v={`${dayLabel(new Date(b.starts_at))}, ${time(new Date(b.starts_at))}`} />
          <Cell k="Leave" v={`${dayLabel(new Date(b.ends_at))}, ${time(new Date(b.ends_at))}`} />
          <Cell k="Booking ref" v={b.ref} />
          <Cell k={pending ? 'Total if accepted' : 'Total'} v={gbp(b.total)} />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Button title="Directions" icon={Navigation} variant="outline" style={{ flex: 1 }} onPress={() => openDirections(l.lat, l.lng, l.address_line)} />
        <Button title="View booking" style={{ flex: 1 }} onPress={() => router.replace({ pathname: '/booking/[id]', params: { id: b.id } })} />
      </View>
      <Button title="Back to Explore" variant="ghost" style={{ marginTop: 8 }} onPress={() => router.replace('/')} />
    </ScrollView>
  );
}

const Cell = ({ k, v }: { k: string; v: string }) => (
  <View style={{ width: '50%', paddingVertical: 6 }}>
    <Txt w="bold" size={11} color={colors.grey2} tracking={0.7}>
      {k.toUpperCase()}
    </Txt>
    <Txt w="bold" size={14.5} style={{ marginTop: 3 }}>
      {v}
    </Txt>
  </View>
);

const styles = StyleSheet.create({
  ok: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1.5, borderTopColor: colors.line, borderStyle: 'dashed' },
});
