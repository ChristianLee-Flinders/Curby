export type SpaceType = 'driveway' | 'garage' | 'private_bay' | 'gated';
export type VehicleSize = 'small' | 'medium' | 'large' | 'van';
export type BookingStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled';
export type Availability = 'always' | 'weekdays' | 'evenings_weekends';
export type Feature = 'ev' | 'lit' | 'instant' | 'gated' | 'cctv' | 'covered' | 'step_free';

/** Public listing data, as returned by the search_listings function. */
export type PublicListing = {
  id: string;
  title: string;
  space_type: SpaceType;
  max_vehicle: VehicleSize;
  street: string;
  postcode: string;
  area: string;
  lat: number;
  lng: number;
  price_per_hour: number;
  features: Feature[];
  instant_book: boolean;
  availability: Availability;
  photo_paths: string[];
  placeholder_photo: number;
  rating_avg: number;
  review_count: number;
  host_id: string;
  host_name: string;
  host_since: string;
  distance_km: number;
  is_available: boolean;
};

/** Full listing row: visible to its host and to drivers with a booking. */
export type Listing = {
  id: string;
  host_id: string;
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
  is_active: boolean;
  photo_paths: string[];
  placeholder_photo: number;
  rating_avg: number;
  review_count: number;
  created_at: string;
};

export type Vehicle = {
  id: string;
  owner_id: string;
  registration: string;
  make_model: string;
  colour: string;
};

export type Booking = {
  id: string;
  ref: string;
  listing_id: string;
  driver_id: string;
  vehicle_id: string | null;
  starts_at: string;
  ends_at: string;
  subtotal: number;
  service_fee: number;
  total: number;
  host_payout: number;
  status: BookingStatus;
  access_code: string | null;
  created_at: string;
  cancelled_at: string | null;
};

export type BookingWithListing = Booking & {
  listing: Listing | null;
  vehicle: Vehicle | null;
  /** one review per booking: PostgREST returns an object (or null) for this one-to-one join */
  review: { id: string } | { id: string }[] | null;
};

export type HostBooking = Booking & {
  listing: Pick<Listing, 'id' | 'title' | 'placeholder_photo' | 'photo_paths'> | null;
  vehicle: Pick<Vehicle, 'registration' | 'make_model' | 'colour'> | null;
  driver: { full_name: string } | null;
};

export type Review = {
  id: string;
  listing_id: string;
  author_name: string;
  rating: number;
  body: string;
  created_at: string;
};

export type Message = {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type Quote = { hours: number; subtotal: number; service_fee: number; total: number };
