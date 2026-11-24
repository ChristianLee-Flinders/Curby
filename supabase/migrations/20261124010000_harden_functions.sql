-- Tighten function access flagged by the Supabase security advisor.

-- Move btree_gist (used by the double-booking guard) out of the exposed public schema.
create schema if not exists extensions;
alter extension btree_gist set schema extensions;

-- Trigger functions only ever run from their triggers; nobody needs to call them over the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.reviews_before_insert() from public, anon, authenticated;
revoke execute on function public.reviews_after_insert() from public, anon, authenticated;

-- RLS helpers: signed-in users need them (policies run with the caller's rights), signed-out visitors don't.
revoke execute on function public.is_listing_host(uuid) from public, anon;
revoke execute on function public.is_booking_participant(uuid) from public, anon;
grant execute on function public.is_listing_host(uuid) to authenticated;
grant execute on function public.is_booking_participant(uuid) to authenticated;

-- search_listings and quote_booking stay public on purpose (browsing before signing in);
-- create/cancel/extend/respond stay signed-in only (granted in the init migration).
