import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePublicListings, useSavedIds } from '@/api/queries';
import { ListingCard } from '@/components/listing';
import { TAB_BAR_SPACE } from '@/components/tab-bar';
import { Muted, Title } from '@/components/txt';
import { Empty, Loading } from '@/components/ui';
import { DEFAULT_PLACE } from '@/lib/places';
import { colors } from '@/lib/theme';
import { useAppState } from '@/providers/app-state';

export default function Saved() {
  const insets = useSafeAreaInsets();
  const { search } = useAppState();
  const near = search.place ?? DEFAULT_PLACE;
  const ids = useSavedIds();
  const listings = usePublicListings(ids.data, near, { arrive: search.arrive, leave: search.leave });
  // keep the order people saved them in
  const items = (ids.data ?? []).map((id) => listings.data?.find((l) => l.id === id)).filter((l) => !!l);

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: TAB_BAR_SPACE }}
      refreshControl={<RefreshControl refreshing={ids.isRefetching} onRefresh={() => void ids.refetch()} tintColor={colors.primary} />}>
      <View style={{ paddingHorizontal: 20 }}>
        <Title accessibilityRole="header">Saved</Title>
        <Muted size={14} style={{ marginTop: 4 }}>
          {items.length ? `${items.length} space${items.length > 1 ? 's' : ''} you love` : 'Your shortlist lives here'}
        </Muted>
      </View>
      {ids.isLoading || (listings.isLoading && (ids.data?.length ?? 0) > 0) ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty icon={Heart} title="No saved spaces yet" body="Tap the heart on any driveway to save it for later." action="Find parking" onAction={() => router.push('/')} />
      ) : (
        <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 18 }}>
          {items.map((l) => (
            <ListingCard key={l!.id} l={l!} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
