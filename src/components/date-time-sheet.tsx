import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Sheet } from '@/components/sheet';
import { Muted, Txt } from '@/components/txt';
import { Button, tap } from '@/components/ui';
import { addDays, dayLabel, duration, hoursBetween, sameDay, shortDow, startOfDay, time } from '@/lib/format';
import { colors } from '@/lib/theme';

type Which = 'arrive' | 'leave';

type Props = {
  visible: boolean;
  onClose: () => void;
  arrive: Date;
  leave: Date;
  initial?: Which;
  onDone: (arrive: Date, leave: Date) => void;
};

export function DateTimeSheet(p: Props) {
  return (
    <Sheet visible={p.visible} onClose={p.onClose} title="When do you need it?">
      {/* mounted only while open, so each opening starts from the current search */}
      {p.visible && <Picker {...p} />}
    </Sheet>
  );
}

function Picker({ arrive: a0, leave: b0, initial = 'arrive', onDone }: Props) {
  const [w, setW] = useState<Which>(initial);
  const [a, setA] = useState(a0);
  const [b, setB] = useState(b0);
  const [now] = useState(() => new Date());
  const days = useMemo(() => Array.from({ length: 21 }, (_, i) => addDays(startOfDay(new Date()), i)), []);
  const slots = useMemo(() => Array.from({ length: 48 }, (_, i) => i * 30), []);
  const cur = w === 'arrive' ? a : b;

  const setDay = (d: Date) => {
    const n = new Date(d);
    n.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
    if (w === 'arrive') {
      const len = Math.max(b.getTime() - a.getTime(), 36e5);
      setA(n);
      if (b <= n) setB(new Date(n.getTime() + len));
    } else setB(n);
  };
  const setSlot = (mins: number) => {
    const n = new Date(cur);
    n.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    if (w === 'arrive') {
      const len = Math.max(b.getTime() - a.getTime(), 36e5);
      setA(n);
      if (b <= n) setB(new Date(n.getTime() + len));
      setW('leave');
    } else setB(n);
  };

  const valid = b > a && a.getTime() > now.getTime() - 15 * 6e4;

  return (
    <>
      <View style={styles.seg}>
        {(['arrive', 'leave'] as const).map((k) => (
          <Pressable
            key={k}
            accessibilityRole="tab"
            accessibilityState={{ selected: w === k }}
            onPress={() => setW(k)}
            style={[styles.segBtn, w === k && styles.segOn]}>
            <Txt w="semibold" size={13.5} color={w === k ? colors.navy : colors.grey} numberOfLines={1}>
              {k === 'arrive' ? 'Arrive' : 'Leave'} · {dayLabel(k === 'arrive' ? a : b)} {time(k === 'arrive' ? a : b)}
            </Txt>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {days.map((d, i) => {
          const disabled = w === 'leave' && d < startOfDay(a);
          const on = sameDay(d, cur);
          return (
            <Pressable
              key={i}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={dayLabel(d)}
              accessibilityState={{ selected: on, disabled }}
              onPress={() => {
                tap();
                setDay(d);
              }}
              style={[styles.day, on && styles.dayOn, disabled && { opacity: 0.35 }]}>
              <Txt w="bold" size={11} color={on ? '#DCD3FF' : colors.grey2} style={{ textTransform: 'uppercase' }}>
                {i === 0 ? 'Today' : shortDow(d)}
              </Txt>
              <Txt w="extrabold" size={19} color={on ? '#fff' : colors.navy}>
                {d.getDate()}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>

      <Txt w="bold" size={12} color={colors.grey2} tracking={0.8} style={styles.label}>
        {w === 'arrive' ? 'ARRIVAL TIME' : 'DEPARTURE TIME'}
      </Txt>
      <ScrollView style={{ maxHeight: 216 }} contentContainerStyle={styles.times} showsVerticalScrollIndicator={false}>
        {slots.map((m) => {
          const t = new Date(cur);
          t.setHours(Math.floor(m / 60), m % 60, 0, 0);
          const disabled = w === 'arrive' ? t.getTime() < now.getTime() - 15 * 6e4 : t <= a;
          const on = t.getHours() === cur.getHours() && t.getMinutes() === cur.getMinutes();
          return (
            <Pressable
              key={m}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: on, disabled }}
              onPress={() => {
                tap();
                setSlot(m);
              }}
              style={[styles.tm, on && styles.tmOn, disabled && { opacity: 0.3 }]}>
              <Txt w="bold" size={14.5} color={on ? '#fff' : colors.navy}>
                {time(t)}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Muted w="semibold">Total time</Muted>
          <Txt w="bold">{b > a ? duration(hoursBetween(a, b)) : '—'}</Txt>
        </View>
        <Button title="Done" disabled={!valid} onPress={() => onDone(a, b)} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', backgroundColor: '#ECEDF3', borderRadius: 12, padding: 3, marginHorizontal: 20, marginBottom: 16 },
  segBtn: { flex: 1, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segOn: { backgroundColor: colors.card, shadowColor: '#111A35', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  day: {
    width: 58,
    height: 70,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { paddingHorizontal: 20, marginTop: 18, marginBottom: 8 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  tm: {
    width: '23%',
    flexGrow: 1,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tmOn: { backgroundColor: colors.navy, borderColor: colors.navy },
});
