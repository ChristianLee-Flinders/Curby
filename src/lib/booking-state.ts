import type { Booking } from '@/lib/types';

/** How a booking should be described to the driver right now. */
export function bookingState(b: Pick<Booking, 'status' | 'starts_at' | 'ends_at'>, now = new Date()) {
  const s = new Date(b.starts_at);
  const e = new Date(b.ends_at);
  if (b.status === 'cancelled') return { label: 'Cancelled', tone: 'bad' as const, upcoming: false };
  if (b.status === 'declined') return { label: 'Declined', tone: 'bad' as const, upcoming: false };
  if (e < now) return { label: 'Completed', tone: 'grey' as const, upcoming: false };
  if (b.status === 'pending') return { label: 'Awaiting host', tone: 'warn' as const, upcoming: true };
  if (s <= now) return { label: 'Happening now', tone: 'ok' as const, upcoming: true };
  return { label: 'Confirmed', tone: 'ok' as const, upcoming: true };
}

/** True once the driver has reviewed this booking. */
export const hasReview = (r: { id: string } | { id: string }[] | null | undefined) => (Array.isArray(r) ? r.length > 0 : !!r);
