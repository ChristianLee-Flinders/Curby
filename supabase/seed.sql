-- Demo data for development. Creates three demo hosts and a spread of London spaces so the
-- app has something to search straight away. Safe to run once on a fresh project
-- (Supabase CLI runs it automatically after migrations with `supabase db reset`).
-- The demo hosts can't sign in: they have no password.

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, raw_app_meta_data, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'priya.demo@curby.example', '{"full_name":"Priya Shah"}', '{"provider":"email","providers":["email"]}', now(), now() - interval '3 years', now()),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'tom.demo@curby.example', '{"full_name":"Tom Bennett"}', '{"provider":"email","providers":["email"]}', now(), now() - interval '2 years', now()),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'grace.demo@curby.example', '{"full_name":"Grace Okafor"}', '{"provider":"email","providers":["email"]}', now(), now() - interval '1 year', now())
on conflict (id) do nothing;

update public.profiles set created_at = u.created_at
from auth.users u where u.id = profiles.id and u.email like '%.demo@curby.example';

insert into public.listings
  (host_id, title, space_type, max_vehicle, address_line, postcode, area, lat, lng, price_per_hour, features,
   access_instructions, instant_book, availability, placeholder_photo, rating_avg, review_count)
values
  ('00000000-0000-4000-a000-000000000001', 'Private driveway, Clapham', 'driveway', 'large', '41 Abbeville Road', 'SW4 9JX', 'Clapham',
   51.4528, -0.1452, 2.50, '{ev,lit,instant}', 'Pull onto the driveway in front of the bay window. The space is on the left, beside the green bin store.', true, 'always', 1, 4.96, 212),
  ('00000000-0000-4000-a000-000000000002', 'Gated off-street space', 'gated', 'large', '7 Bedford Hill', 'SW12 9RG', 'Balham',
   51.4436, -0.1508, 2.20, '{gated,cctv,lit}', 'Use the keypad on the black side gate. Your code is shown in the app an hour before you arrive.', true, 'always', 2, 4.89, 97),
  ('00000000-0000-4000-a000-000000000001', 'Driveway by Clapham Common', 'driveway', 'medium', '12 Narbonne Avenue', 'SW4 9JS', 'Clapham',
   51.4559, -0.1465, 2.80, '{lit,step_free,instant}', 'Reverse onto the driveway and keep to the right so the front door stays clear.', true, 'always', 3, 4.92, 154),
  ('00000000-0000-4000-a000-000000000003', 'Covered garage, Battersea', 'garage', 'large', '88 Lavender Hill', 'SW11 5RL', 'Battersea',
   51.4640, -0.1610, 3.40, '{covered,ev,cctv}', 'The garage door opens with the code in your booking. Close it behind you when you leave.', false, 'always', 4, 4.98, 61),
  ('00000000-0000-4000-a000-000000000003', 'Quiet driveway, Brixton', 'driveway', 'medium', '5 Brixton Water Lane', 'SW2 1PE', 'Brixton',
   51.4545, -0.1110, 1.90, '{lit,step_free,instant}', 'The space is the driveway nearest the lamp post. Please don''t block the neighbour''s dropped kerb.', true, 'always', 5, 4.81, 88),
  ('00000000-0000-4000-a000-000000000002', 'Driveway off Northcote Road', 'driveway', 'large', '23 Salcott Road', 'SW11 6DQ', 'Battersea',
   51.4580, -0.1655, 2.60, '{ev,lit,instant}', 'Park on the left side of the driveway. The EV charger cable is in the box by the door.', true, 'weekdays', 6, 4.90, 130),
  ('00000000-0000-4000-a000-000000000001', 'Space near Stockwell tube', 'private_bay', 'small', '64 Lansdowne Way', 'SW8 2PS', 'Stockwell',
   51.4735, -0.1240, 1.80, '{lit,cctv}', 'Pull into the front garden bay. The gate stays open during your booking.', false, 'always', 7, 4.77, 45),
  ('00000000-0000-4000-a000-000000000002', 'Driveway near Shoreditch High St', 'driveway', 'medium', '19 Quilter Street', 'E2 7BS', 'Shoreditch',
   51.5287, -0.0680, 3.20, '{lit,instant}', 'Park nose-in. The driveway is shared with number 21 but your side is marked.', true, 'evenings_weekends', 8, 4.85, 73),
  ('00000000-0000-4000-a000-000000000003', 'Mews space, Notting Hill', 'private_bay', 'medium', '3 Hippodrome Mews', 'W11 4NN', 'Notting Hill',
   51.5118, -0.2065, 3.60, '{cctv,lit,instant}', 'Bay 3 at the end of the mews, painted with a white number.', true, 'always', 3, 4.94, 118),
  ('00000000-0000-4000-a000-000000000001', 'Driveway, Greenwich', 'driveway', 'large', '27 Crooms Hill', 'SE10 8HB', 'Greenwich',
   51.4790, -0.0050, 1.60, '{lit,ev,instant}', 'Driveway on the right of the house. Ring the bell if a car is blocking you.', true, 'always', 1, 4.88, 66),
  ('00000000-0000-4000-a000-000000000002', 'Event-day driveway, Wembley', 'driveway', 'van', '41 Linden Avenue', 'HA9 8BB', 'Wembley',
   51.5530, -0.2900, 4.50, '{lit,instant}', 'Twelve minutes'' walk to the stadium. Please leave by midnight on event days.', true, 'always', 6, 4.79, 204),
  ('00000000-0000-4000-a000-000000000003', 'Garage near King''s Cross', 'garage', 'medium', '15 Caledonian Road', 'N1 9DX', 'King''s Cross',
   51.5320, -0.1190, 4.20, '{covered,cctv,ev}', 'Roller-shutter garage under the flats. Your code opens the keypad on the right.', false, 'always', 4, 4.91, 39);
