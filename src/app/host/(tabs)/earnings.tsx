import { CircleCheck, Landmark } from 'lucide-react-native';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { useHostBookings } from '@/api/queries';
import { TAB_BAR_SPACE } from '@/components/tab-bar';
import { Muted, Title, Txt } from '@/components/txt';
import { Card, IconTile, ListGroup, ListRow, Loading, SectionLabel } from '@/components/ui';
import { addDays, gbp, longDay, monthName } from '@/lib/format';
import { colors, fonts } from '@/lib/theme';

/** Next Friday (payout day) */
function nextFriday(d = new Date()) {
  const n = (5 - d.getDay() + 7) % 7 || 7;
  return addDays(d, n);
}

export default function Earnings() {
  const insets = useSafeAreaInsets();
  const q = useHostBookings();
  const now = new Date();
  const done = (q.data ?? []).filter((b) => b.status === 'confirmed');

  // last 6 months, oldest first
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const total = done
      .filter((b) => {
        const s = new Date(b.starts_at);
        return s.getMonth() === d.getMonth() && s.getFullYear() === d.getFullYear();
      })
      .reduce((s, b) => s + b.host_payout, 0);
    return { label: monthName(d.getMonth()), total };
  });
  const sixMonth = months.reduce((s, m) => s + m.total, 0);
  const max = Math.max(50, ...months.map((m) => m.total));
  const top = Math.ceil((max * 1.15) / 50) * 50;

  // Payout = finished stays since the last Friday
  const lastFri = addDays(nextFriday(now), -7);
  const due = done.filter((b) => new Date(b.ends_at) < now && new Date(b.ends_at) >= lastFri).reduce((s, b) => s + b.host_payout, 0);
  const recent = done
    .filter((b) => new Date(b.ends_at) < now)
    .sort((a, b) => +new Date(b.ends_at) - +new Date(a.ends_at))
    .slice(0, 8);

  const W = 340;
  const bw = 34;
  const gap = (W - bw * 6) / 5;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: TAB_BAR_SPACE }}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.primary} />}>
      <View style={{ paddingHorizontal: 20 }}>
        <Title accessibilityRole="header">Earnings</Title>
        <Muted size={14} style={{ marginTop: 4 }}>
          {gbp(sixMonth)} over the last 6 months
        </Muted>
      </View>
      {q.isLoading ? (
        <Loading />
      ) : (
        <>
          <Card style={{ marginHorizontal: 16, marginTop: 18, padding: 16 }}>
            <Txt w="bold" size={15} style={{ marginBottom: 8 }}>
              Monthly earnings
            </Txt>
            <Svg width="100%" height={180} viewBox={`0 0 ${W} 170`} accessibilityLabel="Bar chart of monthly earnings">
              {[0.25, 0.5, 0.75, 1].map((g) => (
                <Line key={g} x1={0} x2={W} y1={145 - g * 120} y2={145 - g * 120} stroke={colors.line} />
              ))}
              {months.map((m, i) => {
                const h = Math.max(3, Math.round((m.total / top) * 120));
                const x = i * (bw + gap);
                const last = i === months.length - 1;
                return (
                  <G key={m.label + i}>
                    <Rect x={x} y={145 - h} width={bw} height={h} rx={9} fill={last ? colors.primary : '#DCD3FF'} />
                    <SvgText x={x + bw / 2} y={164} textAnchor="middle" fontSize={11} fontFamily={fonts.semibold} fill={colors.grey}>
                      {m.label}
                    </SvgText>
                    {last && (
                      <SvgText x={x + bw / 2} y={137 - h} textAnchor="middle" fontSize={11.5} fontFamily={fonts.extrabold} fill={colors.navy}>
                        £{Math.round(m.total)}
                      </SvgText>
                    )}
                  </G>
                );
              })}
            </Svg>
          </Card>

          <Card style={{ marginHorizontal: 16, marginTop: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <IconTile icon={Landmark} tone="ok" />
            <View style={{ flex: 1 }}>
              <Muted size={12.5} w="semibold">
                Next payout · {longDay(nextFriday(now))}
              </Muted>
              <Txt w="extrabold" size={20} style={{ fontVariant: ['tabular-nums'] }}>
                {gbp(due)}
              </Txt>
            </View>
          </Card>

          <SectionLabel>Recent stays</SectionLabel>
          {recent.length ? (
            <ListGroup>
              {recent.map((b, i) => (
                <ListRow
                  key={b.id}
                  first={i === 0}
                  icon={CircleCheck}
                  title={`${longDay(new Date(b.starts_at))} · ${b.driver?.full_name?.split(' ')[0] ?? 'Driver'}`}
                  subtitle={b.listing?.title}
                  right={
                    <Txt w="bold" size={15} style={{ fontVariant: ['tabular-nums'] }}>
                      {gbp(b.host_payout)}
                    </Txt>
                  }
                />
              ))}
            </ListGroup>
          ) : (
            <Muted style={{ paddingHorizontal: 20 }}>Finished stays and what you earned will appear here.</Muted>
          )}
          <Muted size={12} style={{ paddingHorizontal: 20, marginTop: 14, lineHeight: 18 }}>
            Amounts are after Curby’s 15% fee. Payments are in test mode, so payouts aren’t sent yet.
          </Muted>
        </>
      )}
    </ScrollView>
  );
}
