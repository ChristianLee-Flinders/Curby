import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// Curby's Supabase project. The publishable key is designed to be shipped inside the app:
// what each person can read or change is enforced by row-level security in the database.
// Set the EXPO_PUBLIC_ variables in .env to point the app at a different project (e.g. local dev).
const DEFAULT_URL = 'https://tsfddlawqdqdnxzcooof.supabase.co';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_-TZHK39Bq5pfFFYtcP6GIA_IWqMqPJW';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url ?? 'https://placeholder.supabase.co', anonKey ?? 'placeholder-anon-key', {
  auth: {
    // AsyncStorage isn't available during web static rendering
    storage: Platform.OS === 'web' && typeof window === 'undefined' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// Only refresh tokens while the app is in the foreground
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const LISTING_PHOTO_BUCKET = 'listing-photos';

export function photoUrl(path: string) {
  return supabase.storage.from(LISTING_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Turn a Supabase/Postgres error into something we can show a person. */
export function errorMessage(e: unknown): string {
  if (!e) return 'Something went wrong';
  if (typeof e === 'string') return e;
  const m = (e as { message?: string }).message;
  if (m?.includes('Network request failed') || m?.includes('Failed to fetch')) return 'You seem to be offline. Check your connection and try again.';
  return m || 'Something went wrong';
}
