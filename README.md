# Curby

Peer-to-peer parking for London. Drivers find and book private driveways; homeowners list theirs and earn.

Built with Expo (SDK 58, Expo Router) for iOS and Android, with Supabase for the database, auth, storage and realtime chat.

## What's in the app

**Driver**
- Explore: search box, arrive/leave picker, popular areas, nearby driveways
- Search: places list plus any address or postcode (device geocoder)
- Results: real map (Apple Maps on iOS, Google Maps on Android) with price pins, swipeable cards, list view, filters, "Search this area"
- Listing details: photos, host, features, approximate location, reviews
- Checkout: times, vehicle, price breakdown from the server, simulated payment
- Bookings: upcoming and past, exact address and access code after booking, directions, extend, cancel, chat with host, reviews
- Saved spaces, vehicles, profile

**Host** (Profile → Switch to hosting)
- Today: earnings this month, booking requests to accept/decline, today's and upcoming guests
- Listings: pause/resume, change price, toggle instant book
- Earnings: 6-month chart, next payout, recent stays
- List your space: 6-step flow with address lookup, photo upload to Supabase Storage, publish

Payments are simulated: bookings are created and priced for real, but no money moves. See "Adding payments" below.

## Project layout

```
src/app/            screens (Expo Router: every file is a route)
  (auth)/           welcome + email sign-in
  (driver)/         driver tabs: index (Explore), saved, bookings, profile
  host/(tabs)/      host tabs: today, listings, earnings, menu
  host/new-listing  list-your-space flow
  search, results, listing/[id], checkout/[id], confirmed/[id], booking/[id], chat/[id], vehicles
src/api/queries.ts  all Supabase reads/writes (TanStack Query hooks)
src/components/     shared UI (buttons, cards, tab bar, date/time sheet, listing card…)
src/lib/            theme tokens, formatting, places, Supabase client, social sign-in
supabase/           migration (schema, security rules, booking functions) and demo seed data
```

## 1. Supabase (done)

The app is connected to the Curby project (`tsfddlawqdqdnxzcooof`, eu-west-1). Its URL and publishable key are in
`src/lib/supabase.ts`, so no `.env` is needed. The schema, security rules, booking functions and 12 demo London spaces are
already loaded. To rebuild it elsewhere, run the files in `supabase/migrations/` in order, then `supabase/seed.sql`.

What the database enforces (so the app can't be tricked):
- Exact addresses and access instructions are only readable by the host and by drivers who have booked.
- Bookings are created only through `create_booking()`, which prices them on the server and refuses double-bookings.
- Cancel, extend, accept/decline are server functions that check who's asking.
- Chat messages are only visible to the driver and host of that booking.
- Hosts can only upload photos into their own storage folder.

## 2. Turn on sign-in methods

In **Authentication → URL Configuration**, add this redirect URL: `curby://auth/callback`

- **Email + password**: on by default. Turn "Confirm email" on or off under Authentication → Providers → Email.
- **Google**: Authentication → Providers → Google. Create OAuth credentials in Google Cloud (type "Web application"), add the callback URL Supabase shows you, and paste the client ID and secret into Supabase.
- **Apple** (iOS): Authentication → Providers → Apple. Add your app's bundle ID (`app.curby.ios`) to "Client IDs". Apple sign-in needs a development or App Store build; it won't work in Expo Go with this bundle ID.

## 3. Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go for quick UI work. For Apple sign-in, maps with Google on Android, and anything production-like, use a development build:

```bash
npx eas-cli@latest build --profile development --platform ios   # or android
```

Android maps: create a "Maps SDK for Android" key in Google Cloud and set `GOOGLE_MAPS_ANDROID_API_KEY` in `.env` (or as an EAS secret) before building.

## Checks

```bash
npm run typecheck
npx eslint src
```

## Adding payments later

Checkout already separates "pay" from "create booking". To go live with Stripe:
1. Add a Supabase Edge Function that creates a PaymentIntent for the amount from `quote_booking()`.
2. Use `@stripe/stripe-react-native` PaymentSheet (Apple Pay / Google Pay) in `src/app/checkout/[id].tsx` before calling `create_booking`.
3. Confirm the booking from a Stripe webhook, and use Stripe Connect for host payouts (the `host_payout` column is already calculated at 85%).
