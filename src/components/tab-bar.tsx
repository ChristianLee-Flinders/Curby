import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/txt';
import { tap } from '@/components/ui';
import { colors } from '@/lib/theme';

export type TabMeta = Record<string, { label: string; icon: LucideIcon; badge?: number }>;

/** Floating, frosted capsule tab bar (iOS 26 style) used for both driver and host modes. */
export function FloatingTabBar({ state, navigateToTab, meta }: BottomTabBarProps & { meta: TabMeta }) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom - 8, 12);
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <View style={styles.shadow}>
        <View style={styles.bar}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.97)' }]} />
          )}
          {state.routes.map((route, i) => {
            const m = meta[route.name];
            if (!m) return null;
            const on = state.index === i;
            const Icon = m.icon;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={m.badge ? `${m.label}, ${m.badge} new` : m.label}
                onPress={() => {
                  if (!on) {
                    tap();
                    navigateToTab(route.key);
                  }
                }}
                style={[styles.tab, on && styles.tabOn]}>
                <Icon size={24} color={on ? colors.primary : '#5E6478'} strokeWidth={on ? 2.3 : 1.9} />
                <Txt w="semibold" size={10.5} color={on ? colors.primary : '#5E6478'}>
                  {m.label}
                </Txt>
                {!!m.badge && (
                  <View style={styles.badge}>
                    <Txt w="bold" size={10} color="#fff">
                      {m.badge}
                    </Txt>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** Space to leave at the bottom of scrolling content so it clears the floating bar. */
export const TAB_BAR_SPACE = 120;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 18, right: 18 },
  shadow: {
    borderRadius: 32,
    shadowColor: '#111A35',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    backgroundColor: 'transparent',
  },
  bar: {
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17,26,53,0.08)',
  },
  tab: { flex: 1, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabOn: { backgroundColor: 'rgba(96,53,245,0.10)' },
  badge: {
    position: 'absolute',
    top: 5,
    left: '55%',
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.bad,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
