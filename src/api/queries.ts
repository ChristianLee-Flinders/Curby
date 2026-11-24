import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { decode } from 'base64-arraybuffer';

import { supabase, LISTING_PHOTO_BUCKET } from '@/lib/supabase';
import type {
  Availability,
  Booking,
  BookingWithListing,
  Feature,
  HostBooking,
  Listing,
  Message,
  PublicListing,
  Quote,
  Review,
  SpaceType,
  Vehicle,
  VehicleSize,
} from '@/lib/types';
import { useUserId } from '@/providers/auth';

const num = <T extends Record<string, unknown>>(row: T, keys: (keyof T)[]) => {
  const r = { ...row };
  keys.forEach((k) => (r[k] = Number(r[k]) as T[keyof T]));
  return r;
};
const fixListing = (l: PublicListing) => num(l, ['price_per_hour', 'rating_avg', 'distance_km', 'lat', 'lng']);
const fixBooking = <B extends Booking>(b: B) => num(b, ['subtotal', 'service_fee', 'total', 'host_payout']);

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data as T;
}

// ------------------------------------------------------------------ listings (public)
export type SearchArgs = { lat: number; lng: number; arrive?: Date; leave?: Date; radiusKm?: number };

export function useSearchListings(a: SearchArgs | null) {
  return useQuery({
    queryKey: ['search', a?.lat, a?.lng, a?.arrive?.toISOString(), a?.leave?.toISOString(), a?.radiusKm],
    enabled: !!a,
    queryFn: async () => {
      const rows = await unwrap<PublicListing[]>(
        supabase.rpc('search_listings', {
          p_lat: a!.lat,
          p_lng: a!.lng,
          p_starts: a!.arrive?.toISOString() ?? null,
          p_ends: a!.leave?.toISOString() ?? null,
          p_radius_km: a!.radiusKm ?? 8,
        })
      );
      return rows.map(fixListing);
    },
  });
}

export function usePublicListings(ids: string[] | undefined, near: { lat: number; lng: number }, times?: { arrive: Date; leave: Date }) {
  return useQuery({
    queryKey: ['listings-by-id', ids?.slice().sort().join(','), near.lat, near.lng, times?.arrive.toISOString(), times?.leave.toISOString()],
    enabled: !!ids && ids.length > 0,
    queryFn: async () => {
      const rows = await unwrap<PublicListing[]>(
        supabase.rpc('search_listings', {
          p_lat: near.lat,
          p_lng: near.lng,
          p_starts: times?.arrive.toISOString() ?? null,
          p_ends: times?.leave.toISOString() ?? null,
          p_ids: ids,
        })
      );
      return rows.map(fixListing);
    },
  });
}

export function usePublicListing(id: string, near: { lat: number; lng: number }, times?: { arrive: Date; leave: Date }) {
  const q = usePublicListings([id], near, times);
  return { ...q, data: q.data?.[0] };
}

export function useReviews(listingId: string) {
  return useQuery({
    queryKey: ['reviews', listingId],
    queryFn: () =>
      unwrap<Review[]>(
        supabase.from('reviews').select('*').eq('listing_id', listingId).order('created_at', { ascending: false }).limit(10)
      ),
  });
}

export function useQuote(listingId: string, arrive: Date, leave: Date) {
  return useQuery({
    queryKey: ['quote', listingId, arrive.toISOString(), leave.toISOString()],
    enabled: leave > arrive,
    queryFn: async () => {
      const rows = await unwrap<Quote[]>(
        supabase.rpc('quote_booking', { p_listing: listingId, p_starts: arrive.toISOString(), p_ends: leave.toISOString() })
      );
      const q = rows[0];
      return q ? (num(q, ['hours', 'subtotal', 'service_fee', 'total']) as Quote) : null;
    },
  });
}

// ------------------------------------------------------------------ saved
export function useSavedIds() {
  const uid = useUserId();
  return useQuery({
    queryKey: ['saved', uid],
    enabled: !!uid,
    queryFn: async () => {
      const rows = await unwrap<{ listing_id: string }[]>(
        supabase.from('saved_listings').select('listing_id').order('created_at', { ascending: false })
      );
      return rows.map((r) => r.listing_id);
    },
  });
}

export function useToggleSaved() {
  const qc = useQueryClient();
  const uid = useUserId();
  return useMutation({
    mutationFn: async ({ id, saved }: { id: string; saved: boolean }) => {
      if (saved) await unwrap(supabase.from('saved_listings').delete().eq('listing_id', id));
      else await unwrap(supabase.from('saved_listings').insert({ listing_id: id }));
      return !saved;
    },
    onMutate: async ({ id, saved }) => {
      await qc.cancelQueries({ queryKey: ['saved', uid] });
      const prev = qc.getQueryData<string[]>(['saved', uid]);
      qc.setQueryData<string[]>(['saved', uid], (old = []) => (saved ? old.filter((x) => x !== id) : [id, ...old]));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['saved', uid], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['saved', uid] }),
  });
}

// ------------------------------------------------------------------ vehicles
export function useVehicles() {
  const uid = useUserId();
  return useQuery({
    queryKey: ['vehicles', uid],
    enabled: !!uid,
    queryFn: () =>
      unwrap<Vehicle[]>(supabase.from('vehicles').select('*').eq('owner_id', uid!).order('created_at', { ascending: true })),
  });
}

export function useAddVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { registration: string; make_model: string; colour: string }) =>
      unwrap<Vehicle>(supabase.from('vehicles').insert(v).select().single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(supabase.from('vehicles').delete().eq('id', id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

// ------------------------------------------------------------------ bookings (driver)
const BOOKING_SELECT = '*, listing:listings(*), vehicle:vehicles(*), review:reviews(id)';

export function useMyBookings() {
  const uid = useUserId();
  return useQuery({
    queryKey: ['my-bookings', uid],
    enabled: !!uid,
    queryFn: async () => {
      const rows = await unwrap<BookingWithListing[]>(
        supabase.from('bookings').select(BOOKING_SELECT).eq('driver_id', uid!).order('starts_at', { ascending: true })
      );
      return rows.map(fixBooking);
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => fixBooking(await unwrap<BookingWithListing>(supabase.from('bookings').select(BOOKING_SELECT).eq('id', id).single())),
  });
}

function useInvalidateBookings() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['my-bookings'] });
    qc.invalidateQueries({ queryKey: ['booking'] });
    qc.invalidateQueries({ queryKey: ['host-bookings'] });
    qc.invalidateQueries({ queryKey: ['search'] });
    qc.invalidateQueries({ queryKey: ['listings-by-id'] });
  };
}

export function useCreateBooking() {
  const inv = useInvalidateBookings();
  return useMutation({
    mutationFn: (a: { listingId: string; vehicleId: string | null; arrive: Date; leave: Date }) =>
      unwrap<Booking>(
        supabase.rpc('create_booking', {
          p_listing: a.listingId,
          p_vehicle: a.vehicleId,
          p_starts: a.arrive.toISOString(),
          p_ends: a.leave.toISOString(),
        })
      ),
    onSuccess: inv,
  });
}

export function useCancelBooking() {
  const inv = useInvalidateBookings();
  return useMutation({
    mutationFn: (id: string) => unwrap<Booking>(supabase.rpc('cancel_booking', { p_booking: id })),
    onSuccess: inv,
  });
}

export function useExtendBooking() {
  const inv = useInvalidateBookings();
  return useMutation({
    mutationFn: (a: { id: string; minutes: number }) =>
      unwrap<Booking>(supabase.rpc('extend_booking', { p_booking: a.id, p_minutes: a.minutes })),
    onSuccess: inv,
  });
}

export function useAddReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (r: { booking_id: string; listing_id: string; rating: number; body: string }) =>
      unwrap(supabase.from('reviews').insert(r)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      qc.invalidateQueries({ queryKey: ['booking'] });
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

// ------------------------------------------------------------------ messages
export function useMessages(bookingId: string) {
  return useQuery({
    queryKey: ['messages', bookingId],
    queryFn: () =>
      unwrap<Message[]>(supabase.from('messages').select('*').eq('booking_id', bookingId).order('created_at', { ascending: true })),
  });
}

export function useSendMessage(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => unwrap<Message>(supabase.from('messages').insert({ booking_id: bookingId, body }).select().single()),
    onSuccess: (m) =>
      qc.setQueryData<Message[]>(['messages', bookingId], (old = []) => (old.some((x) => x.id === m.id) ? old : [...old, m])),
  });
}

// ------------------------------------------------------------------ host
export function useHostListings() {
  const uid = useUserId();
  return useQuery({
    queryKey: ['host-listings', uid],
    enabled: !!uid,
    queryFn: async () => {
      const rows = await unwrap<Listing[]>(
        supabase.from('listings').select('*').eq('host_id', uid!).order('created_at', { ascending: false })
      );
      return rows.map((l) => num(l, ['price_per_hour', 'rating_avg', 'lat', 'lng']));
    },
  });
}

export function useHostBookings() {
  const uid = useUserId();
  return useQuery({
    queryKey: ['host-bookings', uid],
    enabled: !!uid,
    queryFn: async () => {
      const rows = await unwrap<HostBooking[]>(
        supabase
          .from('bookings')
          .select('*, listing:listings!inner(id, title, placeholder_photo, photo_paths, host_id), vehicle:vehicles(registration, make_model, colour), driver:profiles(full_name)')
          .eq('listing.host_id', uid!)
          .order('starts_at', { ascending: true })
      );
      return rows.map(fixBooking);
    },
  });
}

export function useRespondToBooking() {
  const inv = useInvalidateBookings();
  return useMutation({
    mutationFn: (a: { id: string; accept: boolean }) =>
      unwrap<Booking>(supabase.rpc('respond_to_booking', { p_booking: a.id, p_accept: a.accept })),
    onSuccess: inv,
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();
  const uid = useUserId();
  return useMutation({
    mutationFn: (a: { id: string; patch: Partial<Pick<Listing, 'price_per_hour' | 'is_active' | 'instant_book'>> }) =>
      unwrap(supabase.from('listings').update(a.patch).eq('id', a.id)),
    onMutate: async ({ id, patch }) => {
      const key = ['host-listings', uid];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Listing[]>(key);
      qc.setQueryData<Listing[]>(key, (old = []) => old.map((l) => (l.id === id ? { ...l, ...patch } : l)));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['host-listings', uid], ctx?.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['host-listings'] });
      qc.invalidateQueries({ queryKey: ['search'] });
    },
  });
}

export type NewListing = {
  title: string;
  space_type: SpaceType;
  max_vehicle: VehicleSize;
  address_line: string;
  postcode: string;
  area: string;
  lat: number;
  lng: number;
  price_per_hour: number;
  features: Feature[];
  access_instructions: string;
  instant_book: boolean;
  availability: Availability;
  photos: { base64: string; mimeType: string }[];
};

export function useCreateListing() {
  const qc = useQueryClient();
  const uid = useUserId();
  return useMutation({
    mutationFn: async ({ photos, ...l }: NewListing) => {
      const paths: string[] = [];
      for (const [i, p] of photos.entries()) {
        const ext = p.mimeType.includes('png') ? 'png' : 'jpg';
        const path = `${uid}/${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage.from(LISTING_PHOTO_BUCKET).upload(path, decode(p.base64), { contentType: p.mimeType });
        if (error) throw error;
        paths.push(path);
      }
      return unwrap<Listing>(
        supabase
          .from('listings')
          .insert({ ...l, photo_paths: paths, placeholder_photo: 1 + Math.floor(Math.random() * 8) })
          .select()
          .single()
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['host-listings'] });
      qc.invalidateQueries({ queryKey: ['search'] });
    },
  });
}
