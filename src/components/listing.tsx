import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Heart, Star, Zap } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useSavedIds, useToggleSaved } from '@/api/queries';
import { Txt } from '@/components/txt';
import { Card, Tag, tap } from '@/components/ui';
import { gbp, miles } from '@/lib/format';
import { housePhoto } from '@/lib/places';
import { photoUrl } from '@/lib/supabase';
import { colors, shadow } from '@/lib/theme';
import type { PublicListing } from '@/lib/types';
import { useToast } from '@/providers/toast';

type Photoish = { photo_paths: string[]; placeholder_photo: number };

export function ListingPhoto({ l, index = 0, style }: { l: Photoish; index?: number; style?: StyleProp<ViewStyle> }) {
  const path = l.photo_paths?.[index];
  const source = path ? { uri: photoUrl(path) } : housePhoto(l.placeholder_photo + index);
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#cfd6df' }, style]}>
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />
    </View>
  );
}

export function HeartButton({ id, size = 32 }: { id: string; size?: number }) {
  const { data: saved = [] } = useSavedIds();
  const toggle = useToggleSaved();
  const toast = useToast();
  const on = saved.includes(id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? 'Remove from saved' : 'Save'}
      hitSlop={8}
      onPress={() => {
        tap();
        toggle.mutate(
          { id, saved: on },
          {
            onSuccess: (now) => toast(now ? 'Saved to your list' : 'Removed from saved'),
            onError: () => toast('Couldn’t update saved spaces', 'error'),
          }
        );
      }}
      style={[styles.heart, { width: size, height: size, borderRadius: size / 2 }]}>
      <Heart size={size * 0.5} color={on ? colors.heart : colors.navy} fill={on ? colors.heart : 'transparent'} strokeWidth={2.2} />
    </Pressable>
  );
}

export const badgeFor = (l: PublicListing) =>
  l.features.includes('covered') ? 'Covered' : l.instant_book ? 'Instant book' : l.rating_avg >= 4.9 ? 'Top rated' : 'Request to book';

export function Rating({ l, size = 13 }: { l: { rating_avg: number; review_count: number }; size?: number }) {
  if (!l.review_count)
    return (
      <Txt w="bold" size={size} color={colors.primary}>
        New
      </Txt>
    );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Star size={size} color={colors.navy} fill={colors.navy} />
      <Txt w="bold" size={size}>
        {Number(l.rating_avg).toFixed(2)}
      </Txt>
      <Txt w="medium" size={size} color={colors.grey}>
        ({l.review_count})
      </Txt>
    </View>
  );
}

/** Horizontal card used on Home and in the results carousel. */
export function ListingCard({ l, style, flat }: { l: PublicListing; style?: StyleProp<ViewStyle>; flat?: boolean }) {
  const body = (
    <View style={styles.row}>
      <View>
        <ListingPhoto l={l} style={styles.thumb} />
        <View style={{ position: 'absolute', top: 7, right: 7 }}>
          <HeartButton id={l.id} size={28} />
        </View>
      </View>
      <View style={styles.body}>
        <Tag label={badgeFor(l)} icon={Zap} />
        <Txt w="bold" size={15.5} tracking={-0.3} numberOfLines={1} style={{ marginTop: 6 }}>
          {l.title}
        </Txt>
        <Txt w="medium" size={12.5} color={colors.grey} numberOfLines={1} style={{ marginTop: 3 }}>
          {miles(l.distance_km)} away · {l.postcode} · {l.street}
        </Txt>
        <View style={styles.bottom}>
          <Txt w="extrabold" size={18} tracking={-0.4}>
            {gbp(l.price_per_hour)}
            <Txt w="medium" size={12.5} color={colors.grey}>
              {' '}
              /hr
            </Txt>
          </Txt>
          <Rating l={l} />
        </View>
        {!l.is_available && <Tag label="Booked at these times" tone="warn" style={{ position: 'absolute', top: 4, right: 0 }} />}
      </View>
    </View>
  );
  const go = () => router.push({ pathname: '/listing/[id]', params: { id: l.id } });
  return flat ? (
    <Pressable onPress={go} accessibilityRole="button" style={style}>
      {body}
    </Pressable>
  ) : (
    <Card onPress={go} style={style}>
      {body}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, padding: 10 },
  thumb: { width: 112, height: 112, borderRadius: 17 },
  body: { flex: 1, minWidth: 0, paddingTop: 4, paddingRight: 4, paddingBottom: 2 },
  bottom: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heart: { backgroundColor: 'rgba(255,255,255,0.93)', alignItems: 'center', justifyContent: 'center', ...shadow.soft },
});
