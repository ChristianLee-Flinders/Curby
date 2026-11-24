import type { Feature, SpaceType, VehicleSize, Availability } from './types';

export type Place = { name: string; detail: string; lat: number; lng: number; kind: 'area' | 'venue' };

export const PLACES: Place[] = [
  { name: 'Clapham, SW4', detail: 'Neighbourhood · Lambeth', lat: 51.4618, lng: -0.1384, kind: 'area' },
  { name: 'Clapham Common Station', detail: 'Northern line · SW4', lat: 51.4618, lng: -0.1384, kind: 'venue' },
  { name: 'Battersea Power Station', detail: 'Shopping & dining · SW11', lat: 51.4817, lng: -0.1446, kind: 'venue' },
  { name: 'Balham, SW12', detail: 'Neighbourhood · Wandsworth', lat: 51.4431, lng: -0.1525, kind: 'area' },
  { name: 'Brixton, SW2', detail: 'Neighbourhood · Lambeth', lat: 51.4613, lng: -0.1156, kind: 'area' },
  { name: 'Shoreditch, E1', detail: 'Neighbourhood · Hackney', lat: 51.5255, lng: -0.0754, kind: 'area' },
  { name: 'Notting Hill, W11', detail: 'Neighbourhood · Kensington', lat: 51.5094, lng: -0.1964, kind: 'area' },
  { name: 'Greenwich, SE10', detail: 'Neighbourhood · Greenwich', lat: 51.4826, lng: -0.0077, kind: 'area' },
  { name: 'Wembley Stadium, HA9', detail: 'Stadium · Brent', lat: 51.556, lng: -0.2796, kind: 'venue' },
  { name: 'The O2, Greenwich', detail: 'Arena · SE10', lat: 51.503, lng: 0.0032, kind: 'venue' },
  { name: 'King’s Cross St Pancras', detail: 'Station · N1C', lat: 51.5308, lng: -0.1238, kind: 'venue' },
  { name: 'Brixton Academy, SW9', detail: 'Venue · Lambeth', lat: 51.4652, lng: -0.1149, kind: 'venue' },
  { name: 'St Thomas’ Hospital, SE1', detail: 'Hospital · Lambeth', lat: 51.4984, lng: -0.1188, kind: 'venue' },
  { name: 'Heathrow Terminal 5', detail: 'Airport · TW6', lat: 51.4723, lng: -0.4887, kind: 'venue' },
];

export const DEFAULT_PLACE = PLACES[0];

export const POPULAR_AREAS: { place: Place; label: string; from: string; photo: number }[] = [
  { place: PLACES[0], label: 'Clapham', from: '1.80', photo: 1 },
  { place: PLACES[5], label: 'Shoreditch', from: '3.20', photo: 2 },
  { place: PLACES[6], label: 'Notting Hill', from: '3.60', photo: 3 },
  { place: PLACES[7], label: 'Greenwich', from: '1.60', photo: 4 },
  { place: PLACES[8], label: 'Wembley', from: '4.50', photo: 6 },
];

const HOUSES: number[] = [
  require('@/assets/images/houses/house-1.jpg'),
  require('@/assets/images/houses/house-2.jpg'),
  require('@/assets/images/houses/house-3.jpg'),
  require('@/assets/images/houses/house-4.jpg'),
  require('@/assets/images/houses/house-5.jpg'),
  require('@/assets/images/houses/house-6.jpg'),
  require('@/assets/images/houses/house-7.jpg'),
  require('@/assets/images/houses/house-8.jpg'),
];
export const housePhoto = (n: number): number => HOUSES[(((n - 1) % 8) + 8) % 8];

export const FEATURES: Record<Feature, { label: string; detail: string; icon: string }> = {
  ev: { label: 'EV charger', detail: '7kW Type 2', icon: 'plug' },
  lit: { label: 'Well lit', detail: 'Street lighting', icon: 'sun' },
  instant: { label: 'Instant book', detail: 'No waiting', icon: 'zap' },
  gated: { label: 'Gated', detail: 'Keypad entry', icon: 'lock' },
  cctv: { label: 'CCTV', detail: 'Monitored 24/7', icon: 'cctv' },
  covered: { label: 'Covered', detail: 'Weather-proof', icon: 'home' },
  step_free: { label: 'Step-free', detail: 'Easy access', icon: 'accessibility' },
};

export const SPACE_TYPES: Record<SpaceType, { label: string; detail: string }> = {
  driveway: { label: 'Driveway', detail: 'In front of your home' },
  garage: { label: 'Garage', detail: 'Lockable & covered' },
  private_bay: { label: 'Private bay', detail: 'Allocated space' },
  gated: { label: 'Gated space', detail: 'Behind a gate' },
};

export const VEHICLE_SIZES: Record<VehicleSize, string> = {
  small: 'Small car',
  medium: 'Medium car',
  large: 'Large SUV',
  van: 'Van',
};

export const AVAILABILITY: Record<Availability, { label: string; detail: string; monthlyHours: number }> = {
  always: { label: 'Any time', detail: '24/7, every day', monthlyHours: 190 },
  weekdays: { label: 'Weekdays, 8am – 6pm', detail: 'Great for commuters', monthlyHours: 150 },
  evenings_weekends: { label: 'Evenings & weekends', detail: 'Great for events and visitors', monthlyHours: 110 },
};

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(bLat - aLat);
  const dLng = r(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
