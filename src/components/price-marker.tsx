import { StyleSheet, View } from 'react-native';

import { Txt } from '@/components/txt';
import { colors } from '@/lib/theme';

export function PriceMarker({ price, selected, unavailable }: { price: number; selected?: boolean; unavailable?: boolean }) {
  const bg = selected ? colors.primary : unavailable ? '#E6E8EF' : colors.card;
  const fg = selected ? colors.white : unavailable ? colors.grey : colors.navy;
  return (
    <View style={{ alignItems: 'center' }} collapsable={false}>
      <View style={[styles.pill, { backgroundColor: bg }]}>
        <Txt w="extrabold" size={12.5} color={fg}>
          £{price.toFixed(2)}
        </Txt>
      </View>
      <View style={[styles.tip, { borderTopColor: bg }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    justifyContent: 'center',
    shadowColor: '#111A35',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
