import { router, useLocalSearchParams } from 'expo-router';
import { Clock, Key, MapPin, MessageCircle, Navigation, Plus, Star } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

import { useAddReview, useBooking, useCancelBooking, useExtendBooking } from '@/api/queries';
import { Sheet } from '@/components/sheet';
import { Muted, Txt } from '@/components/txt';
import { Button, Card, Empty, Loading, NavBar, Plate, Tag, tap } from '@/components/ui';
import { bookingState, hasReview } from '@/lib/booking-state';
import { openDirections } from '@/lib/directions';
import { dayLabel, duration, gbp, longDay, time } from '@/lib/format';
import { errorMessage } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { useToast } from '@/providers/toast';

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { data: b, isLoading } = useBooking(id);
  const cancel = useCancelBooking();
  const extend = useExtendBooking();
  const review = useAddReview();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [stars, setStars] = useState(0);
  const [body, setBody] = useState('');
  const [now] = useState(() => Date.now());

  if (isLoading) return <Loading />;
  if (!b) return <Empty icon={Clock} title="Booking not found" body="It may have been removed." action="Back" onAction={() => router.back()} />;

  const l = b.listing;
  const st = bookingState(b);
  const s = new Date(b.starts_at);
  const e = new Date(b.ends_at);
  const msToStart = s.getTime() - now;
  const startsIn = msToStart > 864e5 ? `Starts ${longDay(s)}` : msToStart > 0 ? `Starts in ${duration(msToStart / 36e5)}` : 'Happening now';
  const live = st.upcoming && b.status === 'confirmed';
  const canReview = st.label === 'Completed' && b.status === 'confirmed' && !hasReview(b.review);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <NavBar title="Booking" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {l && (
          <View style={styles.map}>
            <MapView
              style={StyleSheet.absoluteFill}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
              initialRegion={{ latitude: l.lat, longitude: l.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
              scrollEnabled={false}
              zoomEnabled={false}
              toolbarEnabled={false}>
              <Marker coordinate={{ latitude: l.lat, longitude: l.lng }} pinColor={colors.primary} />
            </MapView>
          </View>
        )}

        <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Tag label={st.label} tone={st.tone} />
            {st.upcoming && <Tag label={startsIn} icon={Clock} />}
          </View>
          <Txt w="extrabold" size={24} tracking={-0.8} style={{ marginTop: 10 }}>
            {l?.title ?? 'Parking space'}
          </Txt>
          {l && (
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 6 }}>
              <MapPin size={15} color={colors.grey} />
              <Muted size={14} style={{ flex: 1 }}>
                {l.address_line}, {l.postcode}
              </Muted>
            </View>
          )}
        </View>

        <Card style={[styles.block, { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 10 }]}>
          <Cell k="Arrive" v={`${dayLabel(s)}, ${time(s)}`} />
          <Cell k="Leave" v={`${dayLabel(e)}, ${time(e)}`} />
          <View style={{ width: '50%', paddingVertical: 6 }}>
            <Txt w="bold" size={11} color={colors.grey2} tracking={0.7}>
              VEHICLE
            </Txt>
            <View style={{ marginTop: 4 }}>{b.vehicle ? <Plate reg={b.vehicle.registration} small /> : <Txt w="bold">—</Txt>}</View>
          </View>
          <Cell k={b.status === 'cancelled' ? 'Refunded' : 'Total'} v={gbp(b.total)} />
        </Card>

        {live && b.access_code && (
          <Card style={[styles.block, { alignItems: 'center' }]}>
            <View style={{ flexDirection: 'row', alignSelf: 'flex-start', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <Key size={16} color={colors.primary} />
              <Txt w="extrabold" size={15}>
                Access code
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }} accessibilityLabel={`Access code ${b.access_code.split('').join(' ')}`}>
              {b.access_code.split('').map((c, i) => (
                <View key={i} style={styles.digit}>
                  <Txt w="extrabold" size={26}>
                    {c}
                  </Txt>
                </View>
              ))}
            </View>
            <Muted size={12.5} style={{ marginTop: 10 }}>
              Works from 15 minutes before your arrival
            </Muted>
          </Card>
        )}

        {st.upcoming && l?.access_instructions ? (
          <Card style={styles.block}>
            <Txt w="extrabold" size={15} style={{ marginBottom: 8 }}>
              Access instructions
            </Txt>
            <Txt size={14.5} color="#3A4058" lh={22}>
              {l.access_instructions}
            </Txt>
          </Card>
        ) : null}

        {b.status === 'pending' && st.upcoming && (
          <Card style={styles.block}>
            <Txt w="bold" size={14.5}>
              Waiting for the host
            </Txt>
            <Muted size={13} style={{ marginTop: 4 }}>
              You’ll get the access details as soon as they accept. You won’t be charged if they decline.
            </Muted>
          </Card>
        )}

        {st.upcoming && l && (
          <View style={styles.actions}>
            <Button title="Directions" icon={Navigation} variant="outline" style={styles.half} onPress={() => openDirections(l.lat, l.lng, l.address_line)} />
            <Button title="Message host" icon={MessageCircle} variant="outline" style={styles.half} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: b.id } })} />
            {live && (
              <Button
                title="Extend 1 hour"
                icon={Plus}
                variant="secondary"
                style={styles.half}
                loading={extend.isPending}
                onPress={() =>
                  extend.mutate(
                    { id: b.id, minutes: 60 },
                    { onSuccess: (nb) => toast(`Extended to ${time(new Date(nb.ends_at))}`), onError: (er) => toast(errorMessage(er), 'error') }
                  )
                }
              />
            )}
            <Button title="Cancel booking" variant="danger" style={styles.half} onPress={() => setConfirmCancel(true)} />
          </View>
        )}

        {canReview && (
          <Card style={styles.block}>
            <Txt w="extrabold" size={15}>
              How was it?
            </Txt>
            <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginVertical: 14 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
                  onPress={() => {
                    tap();
                    setStars(n);
                  }}>
                  <Star size={34} color={n <= stars ? '#FFB020' : '#D5D8E1'} fill={n <= stars ? '#FFB020' : '#D5D8E1'} />
                </Pressable>
              ))}
            </View>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Tell other drivers what it was like (optional)"
              placeholderTextColor={colors.grey2}
              multiline
              maxLength={1000}
              style={styles.review}
              accessibilityLabel="Review"
            />
            <Button
              title="Post review"
              disabled={!stars}
              loading={review.isPending}
              style={{ marginTop: 12 }}
              onPress={() =>
                review.mutate(
                  { booking_id: b.id, listing_id: b.listing_id, rating: stars, body: body.trim() },
                  { onSuccess: () => toast('Thanks for your review'), onError: (er) => toast(errorMessage(er), 'error') }
                )
              }
            />
          </Card>
        )}

        {!st.upcoming && l && (
          <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
            <Button title="Book again" onPress={() => router.push({ pathname: '/listing/[id]', params: { id: l.id } })} />
          </View>
        )}
        <Muted size={12} style={{ textAlign: 'center', marginTop: 18 }}>
          Booking ref {b.ref}
        </Muted>
      </ScrollView>

      <Sheet visible={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel this booking?">
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          <Txt size={14.5} color="#3A4058" lh={22} style={{ marginBottom: 8 }}>
            You’ll get a full refund of <Txt w="bold">{gbp(b.total)}</Txt> to your original payment method within 3–5 working days.
          </Txt>
          <Button
            title="Cancel booking"
            variant="danger"
            loading={cancel.isPending}
            onPress={() =>
              cancel.mutate(b.id, {
                onSuccess: () => {
                  setConfirmCancel(false);
                  toast('Booking cancelled · refund on its way');
                },
                onError: (er) => toast(errorMessage(er), 'error'),
              })
            }
          />
          <Button title="Keep booking" variant="outline" onPress={() => setConfirmCancel(false)} />
        </View>
      </Sheet>
    </View>
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
  map: { marginHorizontal: 16, height: 190, borderRadius: 20, overflow: 'hidden', backgroundColor: '#ECEEF3' },
  block: { marginHorizontal: 16, marginTop: 14, padding: 16 },
  digit: { width: 48, height: 58, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: 14 },
  half: { flexBasis: '47%', flexGrow: 1 },
  review: {
    minHeight: 90,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: 12,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.navy,
    textAlignVertical: 'top',
    backgroundColor: colors.card,
  },
});
