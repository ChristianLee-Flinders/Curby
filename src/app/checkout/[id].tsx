import { router, useLocalSearchParams } from 'expo-router';
import { Car, ChevronRight, CreditCard, Info, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateBooking, usePublicListing, useQuote, useVehicles } from '@/api/queries';
import { DateTimeSheet } from '@/components/date-time-sheet';
import { ListingPhoto, Rating } from '@/components/listing';
import { Muted, Txt } from '@/components/txt';
import { Button, Card, Loading, NavBar, Option, Plate, Tag } from '@/components/ui';
import { duration, gbp, hoursBetween, longDay, time } from '@/lib/format';
import { DEFAULT_PLACE } from '@/lib/places';
import { errorMessage } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { useAppState } from '@/providers/app-state';
import { useToast } from '@/providers/toast';

type Pay = 'apple' | 'card';

export default function Checkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { search, setTimes } = useAppState();
  const near = search.place ?? DEFAULT_PLACE;
  const { data: l } = usePublicListing(id, near, { arrive: search.arrive, leave: search.leave });
  const quote = useQuote(id, search.arrive, search.leave);
  const vehicles = useVehicles();
  const create = useCreateBooking();
  const [chosenVehicle, setVehicleId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const [pay, setPay] = useState<Pay>('apple');
  const [sheet, setSheet] = useState<null | 'arrive' | 'leave'>(null);

  // default to the first saved vehicle until the driver picks one
  const vehicleId = chosenVehicle ?? vehicles.data?.[0]?.id ?? null;

  if (!l) return <Loading />;
  const h = hoursBetween(search.arrive, search.leave);
  const vehicle = vehicles.data?.find((v) => v.id === vehicleId);
  const q = quote.data;
  const invalid = h <= 0 || search.arrive.getTime() < now - 15 * 6e4;

  const confirm = () => {
    if (!vehicle) {
      toast('Add your vehicle so the host knows what to expect', 'error');
      router.push('/vehicles');
      return;
    }
    // Payments are simulated in this version: the booking is created straight away.
    create.mutate(
      { listingId: l.id, vehicleId: vehicle.id, arrive: search.arrive, leave: search.leave },
      {
        onSuccess: (b) => router.replace({ pathname: '/confirmed/[id]', params: { id: b.id } }),
        onError: (e) => toast(errorMessage(e), 'error'),
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <NavBar title={l.instant_book ? 'Confirm and pay' : 'Request to book'} />
      <ScrollView contentContainerStyle={{ paddingBottom: 150, gap: 14, paddingTop: 6 }}>
        <Card style={[styles.block, { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12 }]}>
          <ListingPhoto l={l} style={{ width: 84, height: 72, borderRadius: 14 }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt w="bold" size={15} numberOfLines={1}>
              {l.title}
            </Txt>
            <Muted size={12.5}>
              {l.street}, {l.postcode}
            </Muted>
            <View style={{ marginTop: 4 }}>
              <Rating l={l} size={12} />
            </View>
          </View>
        </Card>

        <Card style={styles.block}>
          <H>Your booking</H>
          <TimeRow label="Arrive" d={search.arrive} onPress={() => setSheet('arrive')} right={<Txt w="semibold" size={14} color={colors.primary}>Edit</Txt>} />
          <TimeRow label="Leave" d={search.leave} onPress={() => setSheet('leave')} right={<Tag label={duration(h)} />} />
        </Card>

        <Card style={styles.block}>
          <H>Vehicle</H>
          {vehicles.isLoading ? (
            <Loading />
          ) : vehicle ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/vehicles')} style={styles.row}>
              <Plate reg={vehicle.registration} />
              <View style={{ flex: 1 }}>
                <Txt w="bold" size={14.5}>
                  {vehicle.make_model || 'Your vehicle'}
                </Txt>
                <Muted size={12.5}>
                  {[vehicle.colour, `${vehicles.data!.length} saved`].filter(Boolean).join(' · ')}
                </Muted>
              </View>
              <ChevronRight size={18} color={colors.grey2} />
            </Pressable>
          ) : (
            <Button title="Add a vehicle" icon={Car} variant="secondary" small onPress={() => router.push('/vehicles')} />
          )}
          {(vehicles.data?.length ?? 0) > 1 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {vehicles.data!.map((v) => (
                <Pressable key={v.id} onPress={() => setVehicleId(v.id)} accessibilityRole="radio" accessibilityState={{ checked: v.id === vehicleId }}
                  style={[styles.vchip, v.id === vehicleId && { borderColor: colors.primary, backgroundColor: '#FBFAFF' }]}>
                  <Txt w="bold" size={13}>
                    {v.registration}
                  </Txt>
                </Pressable>
              ))}
            </View>
          )}
        </Card>

        <Card style={styles.block}>
          <H>Pay with</H>
          <View style={{ gap: 8 }}>
            <Option on={pay === 'apple'} onPress={() => setPay('apple')}>
              <View style={[styles.payMark, { backgroundColor: '#000' }]}>
                <Txt w="bold" size={12} color="#fff">
                  Pay
                </Txt>
              </View>
              <Txt w="bold" size={14.5} style={{ flex: 1 }}>
                Apple Pay / Google Pay
              </Txt>
            </Option>
            <Option on={pay === 'card'} onPress={() => setPay('card')}>
              <View style={[styles.payMark, { backgroundColor: '#1A1F71' }]}>
                <CreditCard size={16} color="#fff" />
              </View>
              <Txt w="bold" size={14.5} style={{ flex: 1 }}>
                Debit or credit card
              </Txt>
            </Option>
          </View>
          <View style={[styles.row, { marginTop: 12, gap: 8 }]}>
            <Info size={14} color={colors.warn} />
            <Muted size={12} style={{ flex: 1 }}>
              Test mode: no payment is taken yet. Your booking is still created and the host is notified.
            </Muted>
          </View>
        </Card>

        <Card style={styles.block}>
          <H>Price details</H>
          {quote.isLoading ? (
            <Loading />
          ) : q ? (
            <>
              <KV k={`${gbp(l.price_per_hour)} × ${duration(q.hours)}`} v={gbp(q.subtotal)} />
              <KV k="Service fee" v={gbp(q.service_fee)} />
              <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 8 }} />
              <KV k="Total (GBP)" v={gbp(q.total)} bold />
            </>
          ) : (
            <Muted>Choose a leave time after your arrival to see the price.</Muted>
          )}
        </Card>

        <View style={[styles.row, { paddingHorizontal: 24, gap: 8, alignItems: 'flex-start' }]}>
          <ShieldCheck size={14} color={colors.grey} style={{ marginTop: 2 }} />
          <Muted size={12} style={{ flex: 1, lineHeight: 18 }}>
            {l.instant_book
              ? 'Your space is confirmed as soon as you book. Free cancellation until your booking ends.'
              : `${l.host_name} will accept or decline within a few hours. You won’t be charged if they decline.`}
          </Muted>
        </View>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        {invalid && <Tag label={h <= 0 ? 'Leave time must be after arrival' : 'Arrival time is in the past'} tone="bad" style={{ alignSelf: 'center', marginBottom: 10 }} />}
        <Button
          title={q ? `${l.instant_book ? 'Confirm and pay' : 'Send request'} · ${gbp(q.total)}` : 'Confirm and pay'}
          variant={pay === 'apple' ? 'dark' : 'primary'}
          loading={create.isPending}
          disabled={invalid || !q}
          onPress={confirm}
        />
      </View>

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

const H = ({ children }: { children: string }) => (
  <Txt w="extrabold" size={15} tracking={-0.2} style={{ marginBottom: 12 }}>
    {children}
  </Txt>
);

function TimeRow({ label, d, onPress, right }: { label: string; d: Date; onPress: () => void; right: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Change ${label.toLowerCase()} time`} onPress={onPress} style={[styles.row, { justifyContent: 'space-between', paddingVertical: 6 }]}>
      <View>
        <Muted size={12.5} w="semibold">
          {label}
        </Muted>
        <Txt w="bold" size={15}>
          {longDay(d)} · {time(d)}
        </Txt>
      </View>
      {right}
    </Pressable>
  );
}

const KV = ({ k, v, bold }: { k: string; v: string; bold?: boolean }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
    <Txt size={bold ? 16 : 14.5} w={bold ? 'extrabold' : 'regular'} color={bold ? colors.navy : '#3A4058'}>
      {k}
    </Txt>
    <Txt size={bold ? 16 : 14.5} w={bold ? 'extrabold' : 'semibold'} style={{ fontVariant: ['tabular-nums'] }}>
      {v}
    </Txt>
  </View>
);

const styles = StyleSheet.create({
  block: { marginHorizontal: 16, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vchip: { height: 34, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1.5, borderColor: colors.line, justifyContent: 'center' },
  payMark: { width: 40, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 14, paddingHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.97)', borderTopWidth: 1, borderTopColor: colors.line },
});
