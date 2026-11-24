import { router, useLocalSearchParams } from 'expo-router';
import { Accessibility, Car, Cctv, Check, Clock, House, Lock, MapPin, Plug, Share2, Star, Sun, Zap, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Platform, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import MapView, { Circle, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePublicListing, useReviews } from '@/api/queries';
import { DateTimeSheet } from '@/components/date-time-sheet';
import { HeartButton, ListingPhoto, badgeFor } from '@/components/listing';
import { Muted, Txt } from '@/components/txt';
import { Avatar, BackButton, Button, Card, CircleButton, Empty, Loading, Tag, tintFor } from '@/components/ui';
import { dayLabel, estimate, gbp, hoursBetween, miles, monthName, time, walkMins } from '@/lib/format';
import { DEFAULT_PLACE, FEATURES, SPACE_TYPES, VEHICLE_SIZES } from '@/lib/places';
import { colors, shadow } from '@/lib/theme';
import { useAppState } from '@/providers/app-state';
import { useUserId } from '@/providers/auth';

const iconMap: Record<string, LucideIcon> = {
  plug: Plug,
  sun: Sun,
  zap: Zap,
  lock: Lock,
  cctv: Cctv,
  home: House,
  accessibility: Accessibility,
};

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const uid = useUserId();
  const { search, setTimes } = useAppState();
  const near = search.place ?? DEFAULT_PLACE;
  const { data: l, isLoading, error } = usePublicListing(id, near, { arrive: search.arrive, leave: search.leave });
  const reviews = useReviews(id);
  const [page, setPage] = useState(0);
  const [sheet, setSheet] = useState(false);

  if (isLoading)
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 60 }}>
        <Loading />
      </View>
    );
  if (!l || error)
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 10, paddingHorizontal: 12 }}>
        <BackButton />
        <Empty icon={MapPin} title="This space isn’t available" body="The host may have paused it. Try another driveway nearby." action="Back to search" onAction={() => router.back()} />
      </View>
    );

  const h = hoursBetween(search.arrive, search.leave);
  const { subtotal } = estimate(l.price_per_hour, h);
  const photos = Math.max(1, l.photo_paths.length || 3);
  const own = l.host_id === uid;
  const hostYears = Math.max(1, new Date().getFullYear() - new Date(l.host_since).getFullYear());

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        {/* gallery */}
        <View style={{ height: 330 }}>
          <FlatList
            horizontal
            pagingEnabled
            data={Array.from({ length: photos }, (_, i) => i)}
            keyExtractor={(i) => String(i)}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => <ListingPhoto l={l} index={item} style={{ width, height: 330 }} />}
          />
          <View style={styles.count}>
            <Txt w="bold" size={12} color="#fff">
              {page + 1} / {photos}
            </Txt>
          </View>
        </View>

        <View style={styles.body}>
          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <Tag label={badgeFor(l)} icon={Zap} />
              {l.features.includes('ev') && <Tag label="EV charger" icon={Plug} tone="ok" />}
              {!l.is_available && <Tag label="Booked at your times" tone="warn" />}
            </View>
            <Txt w="extrabold" size={26} tracking={-0.9} lh={32} style={{ marginTop: 10 }} accessibilityRole="header">
              {l.title}
            </Txt>
            <View style={styles.metaRow}>
              <MapPin size={15} color={colors.grey} />
              <Muted size={14}>
                {l.street}, {l.postcode} · {miles(l.distance_km)} away
              </Muted>
            </View>
            <View style={[styles.metaRow, { marginTop: 12, gap: 16 }]}>
              <View style={styles.metaRow}>
                <Star size={16} color={colors.navy} fill={colors.navy} />
                <Txt w="bold" size={15}>
                  {l.review_count ? Number(l.rating_avg).toFixed(2) : 'New'}
                </Txt>
                {!!l.review_count && <Muted size={14}>{l.review_count} reviews</Muted>}
              </View>
              <View style={styles.metaRow}>
                <Clock size={14} color={colors.grey} />
                <Muted w="semibold">{walkMins(l.distance_km)} min walk</Muted>
              </View>
            </View>
          </View>

          <Divider />
          <View style={[styles.metaRow, { paddingHorizontal: 20, gap: 12 }]}>
            <Avatar name={l.host_name[0] ?? 'C'} size={48} tint={tintFor(l.host_name)[0]} ink={tintFor(l.host_name)[1]} />
            <View style={{ flex: 1 }}>
              <Txt w="bold" size={15.5}>
                Hosted by {l.host_name}
              </Txt>
              <Muted size={13}>
                {hostYears} {hostYears > 1 ? 'years' : 'year'} hosting · {SPACE_TYPES[l.space_type].label}
              </Muted>
            </View>
          </View>

          <Divider />
          <H>What this space offers</H>
          <View style={styles.feat}>
            {[...l.features.filter((f) => FEATURES[f]), ...(l.instant_book && !l.features.includes('instant') ? (['instant'] as const) : [])].map((f) => {
              const F = FEATURES[f];
              const I = iconMap[F.icon] ?? Check;
              return (
                <View key={f} style={styles.featItem}>
                  <I size={22} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Txt w="bold" size={13.5}>
                      {F.label}
                    </Txt>
                    <Muted size={11.5}>{F.detail}</Muted>
                  </View>
                </View>
              );
            })}
            <View style={styles.featItem}>
              <Car size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Txt w="bold" size={13.5}>
                  Fits {VEHICLE_SIZES[l.max_vehicle].toLowerCase()}
                </Txt>
                <Muted size={11.5}>Largest vehicle</Muted>
              </View>
            </View>
          </View>

          <Divider />
          <H>Where you’ll park</H>
          <View style={styles.mini}>
            <MapView
              style={StyleSheet.absoluteFill}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
              initialRegion={{ latitude: l.lat, longitude: l.lng, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              toolbarEnabled={false}>
              <Circle center={{ latitude: l.lat, longitude: l.lng }} radius={180} fillColor="rgba(96,53,245,0.16)" strokeColor="rgba(96,53,245,0.5)" strokeWidth={1.5} />
            </MapView>
          </View>
          <View style={[styles.metaRow, { paddingHorizontal: 20, marginTop: 10 }]}>
            <Lock size={13} color={colors.grey} />
            <Muted size={12.5}>Exact address and access instructions are shared after you book.</Muted>
          </View>

          <Divider />
          <H>{l.review_count ? `★ ${Number(l.rating_avg).toFixed(2)} · ${l.review_count} reviews` : 'Reviews'}</H>
          {reviews.data?.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {reviews.data.map((r) => {
                const d = new Date(r.created_at);
                const [bg, ink] = tintFor(r.author_name);
                return (
                  <Card key={r.id} style={{ width: 270, padding: 16 }}>
                    <View style={[styles.metaRow, { gap: 10 }]}>
                      <Avatar name={r.author_name[0] ?? '?'} size={36} tint={bg} ink={ink} />
                      <View>
                        <Txt w="bold" size={14}>
                          {r.author_name}
                        </Txt>
                        <Muted size={12}>
                          {monthName(d.getMonth())} {d.getFullYear()} · {'★'.repeat(r.rating)}
                        </Muted>
                      </View>
                    </View>
                    {!!r.body && (
                      <Txt size={13.5} color="#3A4058" lh={20} style={{ marginTop: 10 }} numberOfLines={5}>
                        {r.body}
                      </Txt>
                    )}
                  </Card>
                );
              })}
            </ScrollView>
          ) : (
            <Muted style={{ paddingHorizontal: 20 }}>
              {l.review_count ? 'Written reviews will appear here.' : 'No reviews yet. Be the first to park here.'}
            </Muted>
          )}

          <Divider />
          <H>Cancellation</H>
          <Txt size={14.5} color="#3A4058" lh={22} style={{ paddingHorizontal: 20 }}>
            Free cancellation any time before your booking ends. You’re refunded in full to your original payment method.
          </Txt>
        </View>
      </ScrollView>

      {/* floating top buttons */}
      <View style={[styles.top, { top: insets.top + 6 }]}>
        <BackButton variant="glass" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <CircleButton
            icon={Share2}
            label="Share"
            variant="glass"
            onPress={() => Share.share({ message: `${l.title} on Curby — ${gbp(l.price_per_hour)}/hr in ${l.area}` }).catch(() => {})}
          />
          <HeartButton id={l.id} size={44} />
        </View>
      </View>

      {/* bottom bar */}
      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <Txt w="extrabold" size={18} tracking={-0.4}>
            {gbp(l.price_per_hour)}
            <Txt w="medium" size={12.5} color={colors.grey}>
              {' '}
              /hr
            </Txt>
          </Txt>
          <Txt w="semibold" size={13} style={{ textDecorationLine: 'underline' }} onPress={() => setSheet(true)} accessibilityRole="button">
            {dayLabel(search.arrive)} {time(search.arrive)}–{time(search.leave)} · {gbp(subtotal)}
          </Txt>
        </View>
        <Button
          title={own ? 'Your space' : l.is_available ? (l.instant_book ? 'Reserve' : 'Request') : 'Change times'}
          disabled={own}
          style={{ width: 150 }}
          onPress={() => (l.is_available ? router.push({ pathname: '/checkout/[id]', params: { id: l.id } }) : setSheet(true))}
        />
      </View>

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

const Divider = () => <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 22, marginHorizontal: 20 }} />;
const H = ({ children }: { children: string }) => (
  <Txt w="extrabold" size={18} tracking={-0.4} style={{ paddingHorizontal: 20, marginBottom: 12 }}>
    {children}
  </Txt>
);

const styles = StyleSheet.create({
  count: { position: 'absolute', right: 16, bottom: 34, height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: 'rgba(17,26,53,0.6)', justifyContent: 'center' },
  body: { marginTop: -22, backgroundColor: colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  feat: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  featItem: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 16, padding: 12, ...shadow.soft },
  mini: { marginHorizontal: 20, height: 170, borderRadius: 20, overflow: 'hidden', backgroundColor: '#ECEEF3' },
  top: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
