import { Tabs } from 'expo-router/js-tabs';
import { ChartColumn, House, Menu, SquareParking } from 'lucide-react-native';

import { useHostBookings } from '@/api/queries';
import { FloatingTabBar } from '@/components/tab-bar';

export default function HostTabs() {
  const { data = [] } = useHostBookings();
  const pending = data.filter((b) => b.status === 'pending' && new Date(b.ends_at) > new Date()).length;
  const meta = {
    today: { label: 'Today', icon: House, badge: pending },
    listings: { label: 'Listings', icon: SquareParking },
    earnings: { label: 'Earnings', icon: ChartColumn },
    menu: { label: 'Menu', icon: Menu },
  };
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(p) => <FloatingTabBar {...p} meta={meta} />}>
      <Tabs.Screen name="today" />
      <Tabs.Screen name="listings" />
      <Tabs.Screen name="earnings" />
      <Tabs.Screen name="menu" />
    </Tabs>
  );
}
