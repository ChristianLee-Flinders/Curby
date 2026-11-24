This is the Curby Expo/React Native app (Expo SDK 58, Expo Router, Supabase).

- Routes live in `src/app/`; non-route code goes in `src/components`, `src/lib`, `src/api`, `src/providers`.
- All database access goes through hooks in `src/api/queries.ts`. Booking writes use the Postgres functions in `supabase/migrations` (never insert into `bookings` directly).
- Colours, fonts and shadows come from `src/lib/theme.ts`; text uses the `Txt` component so the Plus Jakarta Sans font is applied.
- Use `npx expo install <package>` for native packages so versions match the SDK.
- Run `npm run typecheck` and `npx eslint src` before finishing a change.
