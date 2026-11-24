-- Curby: initial schema
-- Drivers book private driveways from hosts. Exact addresses and access details are only
-- visible to the host and to drivers with an active booking, so public listing data is served
-- through the security-definer functions at the bottom of this file.

create extension if not exists btree_gist;

-- ---------------------------------------------------------------- types
create type public.space_type as enum ('driveway', 'garage', 'private_bay', 'gated');
create type public.vehicle_size as enum ('small', 'medium', 'large', 'van');
create type public.booking_status as enum ('pending', 'confirmed', 'declined', 'cancelled');
create type public.availability as enum ('always', 'weekdays', 'evenings_weekends');

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- vehicles
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  registration text not null check (char_length(registration) between 2 and 10),
  make_model text not null default '',
  colour text not null default '',
  created_at timestamptz not null default now()
);
create index vehicles_owner_idx on public.vehicles (owner_id);

-- ---------------------------------------------------------------- listings
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  space_type public.space_type not null default 'driveway',
  max_vehicle public.vehicle_size not null default 'medium',
  address_line text not null,
  postcode text not null,
  area text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  price_per_hour numeric(6, 2) not null check (price_per_hour between 0.5 and 50),
  features text[] not null default '{}',
  access_instructions text not null default '',
  instant_book boolean not null default true,
  availability public.availability not null default 'always',
  is_active boolean not null default true,
  photo_paths text[] not null default '{}',
  placeholder_photo smallint not null default 1 check (placeholder_photo between 1 and 8),
  rating_avg numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index listings_host_idx on public.listings (host_id);
create index listings_geo_idx on public.listings (lat, lng) where is_active;

-- ---------------------------------------------------------------- bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('CUR-' || upper(substr(md5(gen_random_uuid()::text), 1, 5))),
  listing_id uuid not null references public.listings (id) on delete restrict,
  driver_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  subtotal numeric(8, 2) not null,
  service_fee numeric(8, 2) not null,
  total numeric(8, 2) not null,
  host_payout numeric(8, 2) not null,
  status public.booking_status not null,
  access_code text,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint bookings_time_order check (ends_at > starts_at),
  -- a space can't be double-booked
  constraint bookings_no_overlap exclude using gist (
    listing_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);
create index bookings_driver_idx on public.bookings (driver_id, starts_at desc);
create index bookings_listing_idx on public.bookings (listing_id, starts_at);

-- ---------------------------------------------------------------- saved listings
create table public.saved_listings (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ---------------------------------------------------------------- reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  author_name text not null default '',
  rating smallint not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 1000),
  created_at timestamptz not null default now()
);
create index reviews_listing_idx on public.reviews (listing_id, created_at desc);

-- ---------------------------------------------------------------- messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_booking_idx on public.messages (booking_id, created_at);

-- ---------------------------------------------------------------- helpers
create or replace function public.is_listing_host(p_listing uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.listings l where l.id = p_listing and l.host_id = auth.uid());
$$;

create or replace function public.is_booking_participant(p_booking uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bookings b join public.listings l on l.id = b.listing_id
    where b.id = p_booking and (b.driver_id = auth.uid() or l.host_id = auth.uid())
  );
$$;

-- ---------------------------------------------------------------- row level security
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.listings enable row level security;
alter table public.bookings enable row level security;
alter table public.saved_listings enable row level security;
alter table public.reviews enable row level security;
alter table public.messages enable row level security;

-- profiles: yourself, plus the other party of any booking you're part of
create policy "profiles: read own or booking counterpart" on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.bookings b join public.listings l on l.id = b.listing_id
      where (b.driver_id = profiles.id and l.host_id = auth.uid())
         or (l.host_id = profiles.id and b.driver_id = auth.uid())
    )
  );
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- vehicles: owner manages; hosts can see the vehicle booked into their space
create policy "vehicles: owner read" on public.vehicles for select to authenticated
  using (
    owner_id = auth.uid()
    or exists (select 1 from public.bookings b where b.vehicle_id = vehicles.id and public.is_listing_host(b.listing_id))
  );
create policy "vehicles: owner insert" on public.vehicles for insert to authenticated with check (owner_id = auth.uid());
create policy "vehicles: owner update" on public.vehicles for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "vehicles: owner delete" on public.vehicles for delete to authenticated using (owner_id = auth.uid());

-- listings: full rows only for the host and for drivers who have booked the space
-- (kept after a booking ends so past bookings still show what was booked)
create policy "listings: host or booked driver read" on public.listings for select to authenticated
  using (
    host_id = auth.uid()
    or exists (select 1 from public.bookings b where b.listing_id = listings.id and b.driver_id = auth.uid())
  );
create policy "listings: host insert" on public.listings for insert to authenticated with check (host_id = auth.uid());
create policy "listings: host update" on public.listings for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy "listings: host delete" on public.listings for delete to authenticated using (host_id = auth.uid());

-- bookings: read by driver or host; all writes go through the functions below
create policy "bookings: participants read" on public.bookings for select to authenticated
  using (driver_id = auth.uid() or public.is_listing_host(listing_id));

-- saved
create policy "saved: own read" on public.saved_listings for select to authenticated using (user_id = auth.uid());
create policy "saved: own insert" on public.saved_listings for insert to authenticated with check (user_id = auth.uid());
create policy "saved: own delete" on public.saved_listings for delete to authenticated using (user_id = auth.uid());

-- reviews: public; written once per finished booking by its driver
create policy "reviews: anyone read" on public.reviews for select to anon, authenticated using (true);
create policy "reviews: driver writes after stay" on public.reviews for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = reviews.booking_id and b.listing_id = reviews.listing_id
        and b.driver_id = auth.uid() and b.status = 'confirmed' and b.ends_at < now()
    )
  );

-- messages: booking participants only
create policy "messages: participants read" on public.messages for select to authenticated
  using (public.is_booking_participant(booking_id));
create policy "messages: participants send" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_booking_participant(booking_id));

-- ---------------------------------------------------------------- triggers
create or replace function public.reviews_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select split_part(coalesce(nullif(p.full_name, ''), 'Curby driver'), ' ', 1) into new.author_name
  from public.profiles p where p.id = new.author_id;
  return new;
end;
$$;
create trigger reviews_set_author before insert on public.reviews
  for each row execute function public.reviews_before_insert();

create or replace function public.reviews_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.listings
  set rating_avg = round(((rating_avg * review_count) + new.rating) / (review_count + 1), 2),
      review_count = review_count + 1
  where id = new.listing_id;
  return new;
end;
$$;
create trigger reviews_update_listing after insert on public.reviews
  for each row execute function public.reviews_after_insert();

-- ---------------------------------------------------------------- public listing data
-- Everything a driver needs to choose a space, without the exact address or access notes.
create or replace function public.search_listings(
  p_lat double precision,
  p_lng double precision,
  p_starts timestamptz default null,
  p_ends timestamptz default null,
  p_radius_km double precision default 10,
  p_ids uuid[] default null
)
returns table (
  id uuid, title text, space_type public.space_type, max_vehicle public.vehicle_size,
  street text, postcode text, area text, lat double precision, lng double precision,
  price_per_hour numeric, features text[], instant_book boolean, availability public.availability,
  photo_paths text[], placeholder_photo smallint, rating_avg numeric, review_count integer,
  host_id uuid, host_name text, host_since timestamptz, distance_km double precision, is_available boolean
)
language sql stable security definer set search_path = '' as $$
  select
    l.id, l.title, l.space_type, l.max_vehicle,
    -- street name only: drop a leading house number ("41 Abbeville Road" -> "Abbeville Road")
    regexp_replace(l.address_line, '^[0-9]+[A-Za-z]?\s+', ''),
    -- outward code only ("SW4 9JX" -> "SW4")
    split_part(l.postcode, ' ', 1),
    l.area,
    -- jitter-free but rounded coordinates (~100m) so the pin doesn't reveal the exact house
    round(l.lat::numeric, 3)::double precision, round(l.lng::numeric, 3)::double precision,
    l.price_per_hour, l.features, l.instant_book, l.availability,
    l.photo_paths, l.placeholder_photo, l.rating_avg, l.review_count,
    l.host_id, split_part(coalesce(nullif(p.full_name, ''), 'Curby host'), ' ', 1), p.created_at,
    6371 * 2 * asin(sqrt(
      power(sin(radians(l.lat - p_lat) / 2), 2)
      + cos(radians(p_lat)) * cos(radians(l.lat)) * power(sin(radians(l.lng - p_lng) / 2), 2)
    )) as distance_km,
    (p_starts is null or p_ends is null or not exists (
      select 1 from public.bookings b
      where b.listing_id = l.id and b.status in ('pending', 'confirmed')
        and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(p_starts, p_ends, '[)')
    )) as is_available
  from public.listings l
  join public.profiles p on p.id = l.host_id
  where l.is_active
    and (
      (p_ids is not null and l.id = any (p_ids))
      or (p_ids is null
          and l.lat between p_lat - p_radius_km / 111.0 and p_lat + p_radius_km / 111.0
          and l.lng between p_lng - p_radius_km / (111.0 * cos(radians(p_lat)))
                        and p_lng + p_radius_km / (111.0 * cos(radians(p_lat))))
    )
  order by distance_km asc
  limit 100;
$$;

-- ---------------------------------------------------------------- booking actions
create or replace function public.quote_booking(p_listing uuid, p_starts timestamptz, p_ends timestamptz)
returns table (hours numeric, subtotal numeric, service_fee numeric, total numeric)
language sql stable security definer set search_path = '' as $$
  with q as (
    select round(extract(epoch from (p_ends - p_starts)) / 3600.0, 2) as h, l.price_per_hour as p
    from public.listings l where l.id = p_listing and l.is_active
  ), s as (
    select h, round(p * h, 2) as sub from q
  )
  select h, sub, greatest(0.50, round(sub * 0.08, 2)), sub + greatest(0.50, round(sub * 0.08, 2)) from s;
$$;

create or replace function public.create_booking(
  p_listing uuid, p_vehicle uuid, p_starts timestamptz, p_ends timestamptz
)
returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_listing public.listings;
  v_q record;
  v_row public.bookings;
begin
  if v_uid is null then raise exception 'Please sign in to book' using errcode = '28000'; end if;
  if p_ends <= p_starts then raise exception 'Leave time must be after arrival'; end if;
  if p_starts < now() - interval '15 minutes' then raise exception 'Arrival time is in the past'; end if;
  if p_ends - p_starts > interval '30 days' then raise exception 'Bookings can be up to 30 days long'; end if;

  select * into v_listing from public.listings where id = p_listing and is_active;
  if not found then raise exception 'This space is no longer available'; end if;
  if v_listing.host_id = v_uid then raise exception 'You can''t book your own space'; end if;
  if p_vehicle is not null and not exists (select 1 from public.vehicles where id = p_vehicle and owner_id = v_uid) then
    raise exception 'Choose one of your vehicles';
  end if;

  select * into v_q from public.quote_booking(p_listing, p_starts, p_ends);

  begin
    insert into public.bookings (listing_id, driver_id, vehicle_id, starts_at, ends_at, subtotal, service_fee, total,
                                 host_payout, status, access_code)
    values (p_listing, v_uid, p_vehicle, p_starts, p_ends, v_q.subtotal, v_q.service_fee, v_q.total,
            round(v_q.subtotal * 0.85, 2),
            case when v_listing.instant_book then 'confirmed' else 'pending' end::public.booking_status,
            case when 'gated' = any (v_listing.features) or v_listing.space_type in ('gated', 'garage')
                 then lpad((floor(random() * 10000))::int::text, 4, '0') end)
    returning * into v_row;
  exception when exclusion_violation then
    raise exception 'Someone has just booked this space for those times. Try different times.';
  end;
  return v_row;
end;
$$;

create or replace function public.cancel_booking(p_booking uuid)
returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare v_row public.bookings;
begin
  update public.bookings set status = 'cancelled', cancelled_at = now()
  where id = p_booking and driver_id = auth.uid() and status in ('pending', 'confirmed') and ends_at > now()
  returning * into v_row;
  if not found then raise exception 'This booking can''t be cancelled'; end if;
  return v_row;
end;
$$;

create or replace function public.respond_to_booking(p_booking uuid, p_accept boolean)
returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare v_row public.bookings;
begin
  update public.bookings b set status = case when p_accept then 'confirmed' else 'declined' end::public.booking_status
  where b.id = p_booking and b.status = 'pending' and public.is_listing_host(b.listing_id)
  returning * into v_row;
  if not found then raise exception 'This request has already been handled'; end if;
  return v_row;
end;
$$;

create or replace function public.extend_booking(p_booking uuid, p_minutes integer)
returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare v_row public.bookings; v_q record;
begin
  if p_minutes not between 15 and 1440 then raise exception 'Extend by between 15 minutes and 24 hours'; end if;
  select * into v_row from public.bookings
  where id = p_booking and driver_id = auth.uid() and status = 'confirmed' and ends_at > now() for update;
  if not found then raise exception 'This booking can''t be extended'; end if;
  select * into v_q from public.quote_booking(v_row.listing_id, v_row.starts_at, v_row.ends_at + make_interval(mins => p_minutes));
  begin
    update public.bookings set ends_at = ends_at + make_interval(mins => p_minutes),
      subtotal = v_q.subtotal, service_fee = v_q.service_fee, total = v_q.total, host_payout = round(v_q.subtotal * 0.85, 2)
    where id = p_booking returning * into v_row;
  exception when exclusion_violation then
    raise exception 'The space is booked straight after you, so it can''t be extended';
  end;
  return v_row;
end;
$$;

-- ---------------------------------------------------------------- grants
revoke all on function public.create_booking(uuid, uuid, timestamptz, timestamptz) from public, anon;
revoke all on function public.cancel_booking(uuid) from public, anon;
revoke all on function public.respond_to_booking(uuid, boolean) from public, anon;
revoke all on function public.extend_booking(uuid, integer) from public, anon;
grant execute on function public.create_booking(uuid, uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.respond_to_booking(uuid, boolean) to authenticated;
grant execute on function public.extend_booking(uuid, integer) to authenticated;
grant execute on function public.search_listings(double precision, double precision, timestamptz, timestamptz, double precision, uuid[]) to anon, authenticated;
grant execute on function public.quote_booking(uuid, timestamptz, timestamptz) to anon, authenticated;

-- ---------------------------------------------------------------- realtime chat
alter publication supabase_realtime add table public.messages;

-- ---------------------------------------------------------------- storage: listing photos
insert into storage.buckets (id, name, public) values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "listing photos: host uploads to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "listing photos: host updates own" on storage.objects for update to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "listing photos: host deletes own" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
