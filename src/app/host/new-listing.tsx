import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Accessibility, Camera, Cctv, ChartColumn, ChevronLeft, CircleCheck, House, Lock, MapPin, Minus, Plug, Plus, SquareParking, Sun, Warehouse, X, Zap, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateListing } from '@/api/queries';
import { Muted, Title, Txt } from '@/components/txt';
import { Button, Card, Chip, CircleButton, Field, Option, Tag, tap } from '@/components/ui';
import { gbp } from '@/lib/format';
import { AVAILABILITY, FEATURES, SPACE_TYPES, VEHICLE_SIZES } from '@/lib/places';
import { errorMessage } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import type { Availability, Feature, SpaceType, VehicleSize } from '@/lib/types';
import { useToast } from '@/providers/toast';

const STEPS = 6;
const POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;
const typeIcon: Record<SpaceType, LucideIcon> = { driveway: House, garage: Warehouse, private_bay: SquareParking, gated: Lock };
const featIcon: Record<string, LucideIcon> = {
  plug: Plug, sun: Sun, zap: Zap, lock: Lock, cctv: Cctv, home: House, accessibility: Accessibility,
};

type Photo = { uri: string; base64: string; mimeType: string };

export default function NewListing() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const create = useCreateListing();
  const [step, setStep] = useState(1);

  const [address, setAddress] = useState('');
  const [geo, setGeo] = useState<{ lat: number; lng: number; area: string; postcode: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [type, setType] = useState<SpaceType>('driveway');
  const [size, setSize] = useState<VehicleSize>('medium');
  const [features, setFeatures] = useState<Set<Feature>>(new Set(['lit']));
  const [availability, setAvailability] = useState<Availability>('always');
  const [access, setAccess] = useState('');
  const [instant, setInstant] = useState(true);
  const [price, setPrice] = useState(2.4);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [title, setTitle] = useState('');

  const pc = address.match(POSTCODE);
  const firstLine = address.split(',')[0].trim();

  const lookUp = async () => {
    if (!pc) return toast('Include the full postcode, e.g. 18 Elms Road, SW4 9ER', 'error');
    setLocating(true);
    try {
      const res = await Location.geocodeAsync(`${address}, UK`);
      if (!res.length) throw new Error('not found');
      const [rev] = await Location.reverseGeocodeAsync(res[0]).catch(() => []);
      const postcode = `${pc[1].toUpperCase()} ${pc[2].toUpperCase()}`;
      setGeo({ lat: res[0].latitude, lng: res[0].longitude, postcode, area: rev?.district || rev?.subregion || rev?.city || postcode.split(' ')[0] });
      if (!title) setTitle(`${SPACE_TYPES[type].label} in ${rev?.district || rev?.city || postcode.split(' ')[0]}`);
      setStep(2);
    } catch {
      toast('We couldn’t find that address. Check the spelling and postcode.', 'error');
    } finally {
      setLocating(false);
    }
  };

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 6 - photos.length, quality: 0.6, base64: true });
    if (res.canceled) return;
    const next = res.assets.filter((a) => a.base64).map((a) => ({ uri: a.uri, base64: a.base64!, mimeType: a.mimeType ?? 'image/jpeg' }));
    setPhotos((p) => [...p, ...next].slice(0, 6));
  };

  const publish = () => {
    if (!geo) return setStep(1);
    create.mutate(
      {
        title: title.trim() || `${SPACE_TYPES[type].label} in ${geo.area}`,
        space_type: type,
        max_vehicle: size,
        address_line: firstLine,
        postcode: geo.postcode,
        area: geo.area,
        lat: geo.lat,
        lng: geo.lng,
        price_per_hour: price,
        features: [...features],
        access_instructions: access.trim(),
        instant_book: instant,
        availability,
        photos: photos.map(({ base64, mimeType }) => ({ base64, mimeType })),
      },
      {
        onSuccess: () => setStep(STEPS + 1),
        onError: (e) => toast(errorMessage(e), 'error'),
      }
    );
  };

  const canNext =
    (step === 1 && !!pc && firstLine.length > 3) ||
    step === 2 ||
    step === 3 ||
    (step === 4 && access.trim().length >= 10) ||
    step === 5 ||
    step === 6;

  if (step > STEPS)
    return (
      <View style={{ flex: 1, padding: 24, paddingTop: insets.top + 60, alignItems: 'stretch', backgroundColor: colors.bg }}>
        <View style={styles.done}>
          <House size={46} color="#fff" />
        </View>
        <Title style={{ textAlign: 'center', marginTop: 28 }}>Your space is live</Title>
        <Muted size={15} style={{ textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
          Drivers nearby can now find and book it. You’ll see new bookings on your Today tab.
        </Muted>
        <Button title="View my listings" style={{ marginTop: 28 }} onPress={() => router.replace('/host/listings')} />
      </View>
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.top, { paddingTop: Platform.OS === 'ios' ? 14 : insets.top + 8 }]}>
        <CircleButton icon={step > 1 ? ChevronLeft : X} label={step > 1 ? 'Back' : 'Close'} onPress={() => (step > 1 ? setStep(step - 1) : router.back())} />
        <Txt w="bold" size={17} style={{ flex: 1, textAlign: 'center' }}>
          List your space
        </Txt>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.steps} accessibilityLabel={`Step ${step} of ${STEPS}`}>
        {Array.from({ length: STEPS }, (_, i) => (
          <View key={i} style={[styles.stepBar, i < step && { backgroundColor: colors.primary }]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Txt w="bold" size={12.5} color={colors.grey} tracking={0.6}>
          STEP {step} OF {STEPS}
        </Txt>

        {step === 1 && (
          <>
            <Title size={28}>Where is your space?</Title>
            <Muted size={14.5}>Drivers only see the street and postcode district until they book.</Muted>
            <Field label="Full address with postcode" value={address} onChangeText={(t) => (setAddress(t), setGeo(null))} placeholder="18 Elms Road, SW4 9ER" autoComplete="street-address" textContentType="fullStreetAddress" />
            {address.length > 6 && !pc && <Tag label="Add the full postcode, e.g. SW4 9ER" tone="warn" />}
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Lock size={13} color={colors.grey} />
              <Muted size={12.5}>Your exact address is only shared after a booking.</Muted>
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Title size={28}>What kind of space is it?</Title>
            <View style={styles.grid}>
              {(Object.keys(SPACE_TYPES) as SpaceType[]).map((k) => {
                const I = typeIcon[k];
                const on = type === k;
                return (
                  <Pressable key={k} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => (tap(), setType(k))} style={[styles.tile, on && styles.tileOn]}>
                    <I size={26} color={on ? colors.primary : colors.navy} />
                    <Txt w="bold" size={14.5}>
                      {SPACE_TYPES[k].label}
                    </Txt>
                    <Muted size={12}>{SPACE_TYPES[k].detail}</Muted>
                  </Pressable>
                );
              })}
            </View>
            <Txt w="bold" size={12} color={colors.grey2} tracking={0.8} style={{ marginTop: 10 }}>
              LARGEST VEHICLE IT FITS
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(Object.keys(VEHICLE_SIZES) as VehicleSize[]).map((k) => (
                <Chip key={k} large label={VEHICLE_SIZES[k]} on={size === k} onPress={() => setSize(k)} />
              ))}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Title size={28}>What does it offer?</Title>
            <Muted size={14.5}>Spaces with EV charging tend to be booked more often.</Muted>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {(Object.keys(FEATURES) as Feature[])
                .filter((f) => f !== 'instant')
                .map((f) => (
                  <Chip
                    key={f}
                    large
                    label={FEATURES[f].label}
                    icon={featIcon[FEATURES[f].icon]}
                    on={features.has(f)}
                    onPress={() =>
                      setFeatures((s) => {
                        const n = new Set(s);
                        if (n.has(f)) n.delete(f);
                        else n.add(f);
                        return n;
                      })
                    }
                  />
                ))}
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <Title size={28}>When and how?</Title>
            <View style={{ gap: 8 }}>
              {(Object.keys(AVAILABILITY) as Availability[]).map((k) => (
                <Option key={k} on={availability === k} onPress={() => setAvailability(k)}>
                  <View>
                    <Txt w="bold" size={15}>
                      {AVAILABILITY[k].label}
                    </Txt>
                    <Muted size={12.5}>{AVAILABILITY[k].detail}</Muted>
                  </View>
                </Option>
              ))}
            </View>
            <Txt w="bold" size={12.5} color={colors.grey} style={{ marginTop: 8 }}>
              Access instructions for drivers
            </Txt>
            <TextInput
              value={access}
              onChangeText={setAccess}
              multiline
              maxLength={600}
              placeholder="e.g. Pull onto the driveway on the left of the house. Please don’t block the side gate."
              placeholderTextColor={colors.grey2}
              style={styles.area}
              accessibilityLabel="Access instructions"
            />
            <Option on={instant} onPress={() => setInstant(!instant)}>
              <View style={{ flex: 1 }}>
                <Txt w="bold" size={15}>
                  Instant book
                </Txt>
                <Muted size={12.5}>Drivers book without waiting for you to accept</Muted>
              </View>
            </Option>
          </>
        )}

        {step === 5 && (
          <>
            <Title size={28}>Set your price</Title>
            <Muted size={14.5}>Driveways in south London usually go for £1.80 – £3.40 an hour.</Muted>
            <Card style={{ padding: 22, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                <CircleButton icon={Minus} label="Lower price" variant="soft" onPress={() => setPrice((p) => Math.max(0.5, Math.round((p - 0.1) * 10) / 10))} />
                <Txt w="extrabold" size={52} tracking={-2} style={{ fontVariant: ['tabular-nums'] }}>
                  {gbp(price)}
                </Txt>
                <CircleButton icon={Plus} label="Raise price" variant="soft" onPress={() => setPrice((p) => Math.min(50, Math.round((p + 0.1) * 10) / 10))} />
              </View>
              <Muted w="semibold">per hour</Muted>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[1.8, 2.2, 2.5, 3.0, 3.5].map((p) => (
                  <Chip key={p} label={gbp(p)} on={price === p} onPress={() => setPrice(p)} />
                ))}
              </View>
            </Card>
            <Card style={{ padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <ChartColumn size={24} color={colors.ok} />
              <View>
                <Muted size={12.5} w="semibold">
                  Estimated earnings after fees
                </Muted>
                <Txt w="extrabold" size={19}>
                  Up to £{Math.round(price * AVAILABILITY[availability].monthlyHours * 0.85 * 0.6)} a month
                </Txt>
              </View>
            </Card>
          </>
        )}

        {step === 6 && (
          <>
            <Title size={28}>Photos and title</Title>
            <Muted size={14.5}>Show the space, the entrance and the street. Daylight works best.</Muted>
            <Pressable accessibilityRole="button" onPress={pick} style={styles.upload} disabled={photos.length >= 6}>
              <Camera size={30} color={colors.primary} />
              <Txt w="bold" size={14.5} color={colors.primaryDark}>
                {photos.length ? 'Add more photos' : 'Upload photos'}
              </Txt>
              <Muted size={12}>Up to 6 from your library</Muted>
            </Pressable>
            {!!photos.length && (
              <View style={styles.thumbs}>
                {photos.map((p, i) => (
                  <View key={p.uri} style={styles.thumb}>
                    <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <Pressable accessibilityLabel="Remove photo" onPress={() => setPhotos((ps) => ps.filter((_, j) => j !== i))} style={styles.remove}>
                      <X size={14} color="#fff" strokeWidth={3} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            <Field label="Listing title" value={title} onChangeText={setTitle} placeholder="Private driveway, Clapham" maxLength={80} />
            <Card style={{ padding: 16, gap: 6 }}>
              <Row k="Address" v={`${firstLine}, ${geo?.postcode ?? ''}`} />
              <Row k="Type" v={`${SPACE_TYPES[type].label} · fits ${VEHICLE_SIZES[size].toLowerCase()}`} />
              <Row k="Price" v={`${gbp(price)} / hour`} />
              <Row k="Booking" v={instant ? 'Instant book' : 'Request to book'} />
              <Row k="Curby fee" v="15% of each booking" />
            </Card>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
              <MapPin size={13} color={colors.grey} style={{ marginTop: 2 }} />
              <Muted size={12} style={{ flex: 1, lineHeight: 18 }}>
                Check your home insurance and any lease or council rules before you list.
              </Muted>
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          title={step === 1 ? 'Find address' : step === STEPS ? 'Publish listing' : 'Continue'}
          icon={step === STEPS ? CircleCheck : undefined}
          disabled={!canNext || (step === STEPS && title.trim().length < 3)}
          loading={locating || create.isPending}
          onPress={() => (step === 1 ? lookUp() : step === STEPS ? publish() : setStep(step + 1))}
        />
        {step === 4 && access.trim().length < 10 && (
          <Muted size={12} style={{ textAlign: 'center', marginTop: 8 }}>
            Add a short note on how drivers get into the space
          </Muted>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
    <Muted size={14}>{k}</Muted>
    <Txt w="bold" size={14} style={{ flexShrink: 1, textAlign: 'right' }}>
      {v}
    </Txt>
  </View>
);

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8 },
  steps: { flexDirection: 'row', gap: 5, paddingHorizontal: 20, marginTop: 4 },
  stepBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E1E3EA' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '47%', flexGrow: 1, minHeight: 104, padding: 14, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, gap: 6 },
  tileOn: { borderColor: colors.primary, backgroundColor: '#FBFAFF' },
  area: {
    minHeight: 100,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 14,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.navy,
    textAlignVertical: 'top',
  },
  upload: { height: 150, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: '#D6D1F5', backgroundColor: '#FBFAFF', alignItems: 'center', justifyContent: 'center', gap: 6 },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: '31%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: '#ddd' },
  remove: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(17,26,53,0.7)', alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 14, paddingHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.97)', borderTopWidth: 1, borderTopColor: colors.line },
  done: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
