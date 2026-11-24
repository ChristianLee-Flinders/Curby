import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { CalendarCheck, Compass, Heart, User } from 'lucide-react-native';

import { useMyBookings } from '@/api/queries';
import { FloatingTabBar } from '@/components/tab-bar';
import { useAppState } from '@/providers/app-state';

export default function DriverTabs() {
  const { mode } = useAppState();
  const { data: bookings = [] } = useMyBookings();
  if (mode === 'host') return <Redirect href="/host/today" />;

  const upcoming = bookings.filter((b) => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.ends_at) > new Date()).length;
  const meta = {
    index: { label: 'Explore', icon: Compass },
    saved: { label: 'Saved', icon: Heart },
    bookings: { label: 'Bookings', icon: CalendarCheck, badge: upcoming },
    profile: { label: 'Profile', icon: User },
  };
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(p) => <FloatingTabBar {...p} meta={meta} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
