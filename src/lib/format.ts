const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "Today", "Tomorrow" or "Wed 25 Nov" */
export function dayLabel(d: Date, now = new Date()) {
  if (sameDay(d, now)) return 'Today';
  if (sameDay(d, addDays(now, 1))) return 'Tomorrow';
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
export const longDay = (d: Date) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const shortDow = (d: Date) => DAYS[d.getDay()];
export const monthName = (m: number) => MONTHS[((m % 12) + 12) % 12];

const p2 = (n: number) => String(n).padStart(2, '0');
export const time = (d: Date) => `${p2(d.getHours())}:${p2(d.getMinutes())}`;

export const hoursBetween = (a: Date, b: Date) => Math.max(0, (b.getTime() - a.getTime()) / 36e5);

export function duration(h: number) {
  if (h >= 48) {
    const d = Math.floor(h / 24);
    const rest = Math.round(h - d * 24);
    return rest ? `${d}d ${rest}h` : `${d} days`;
  }
  const H = Math.floor(h);
  const M = Math.round((h - H) * 60);
  if (!H) return `${M}m`;
  return M ? `${H}h ${M}m` : `${H}h`;
}

export const gbp = (n: number | string) => '£' + Number(n).toFixed(2);

export function miles(km: number) {
  const mi = km * 0.621371;
  return mi < 0.1 ? '<0.1 mi' : `${mi.toFixed(1)} mi`;
}
/** Walking minutes at ~4.8km/h */
export const walkMins = (km: number) => Math.max(1, Math.round((km / 4.8) * 60));

/** Service fee shown before the server confirms the quote. Mirrors public.quote_booking. */
export function estimate(pricePerHour: number, h: number) {
  const subtotal = Math.round(pricePerHour * h * 100) / 100;
  const fee = Math.max(0.5, Math.round(subtotal * 0.08 * 100) / 100);
  return { subtotal, fee, total: Math.round((subtotal + fee) * 100) / 100 };
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export const firstName = (full?: string | null) => (full || '').trim().split(/\s+/)[0] || '';
export const initials = (full?: string | null) =>
  (full || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || 'C';

/** Next half-hour slot from now */
export function nextSlot(now = new Date()) {
  const d = new Date(now);
  d.setSeconds(0, 0);
  const m = d.getMinutes();
  d.setMinutes(m < 30 ? 30 : 60);
  return d;
}

/** Normalise a UK registration: upper-case, single space before the last three characters. */
export function formatReg(v: string) {
  const s = v.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length > 4 ? `${s.slice(0, s.length - 3)} ${s.slice(-3)}` : s;
}
