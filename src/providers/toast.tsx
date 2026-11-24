import { CircleCheck, Info } from 'lucide-react-native';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/txt';
import { colors } from '@/lib/theme';

type Kind = 'ok' | 'error';
const Ctx = createContext<(msg: string, kind?: Kind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<{ text: string; kind: Kind } | null>(null);
  const [y] = useState(() => new Animated.Value(-120));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string, kind: Kind = 'ok') => {
      setMsg({ text, kind });
      if (timer.current) clearTimeout(timer.current);
      Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
      timer.current = setTimeout(() => {
        Animated.timing(y, { toValue: -120, duration: 220, useNativeDriver: true }).start();
      }, kind === 'error' ? 3600 : 2200);
    },
    [y]
  );

  return (
    <Ctx.Provider value={show}>
      {children}
      <Animated.View
        pointerEvents="none"
        accessibilityLiveRegion="polite"
        style={[styles.wrap, { top: insets.top + 8, transform: [{ translateY: y }] }]}>
        {msg && (
          <View style={[styles.toast, msg.kind === 'error' && { backgroundColor: colors.bad }]}>
            {msg.kind === 'error' ? <Info size={18} color="#fff" /> : <CircleCheck size={18} color="#fff" />}
            <Txt w="semibold" size={14} color="#fff" style={{ flexShrink: 1 }}>
              {msg.text}
            </Txt>
          </View>
        )}
      </Animated.View>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.navy,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    maxWidth: '100%',
    shadowColor: '#111A35',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
