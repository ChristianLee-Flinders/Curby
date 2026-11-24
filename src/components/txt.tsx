import { Text, type TextProps } from 'react-native';

import { colors, fonts } from '@/lib/theme';

type W = keyof typeof fonts;

export function Txt({
  w = 'regular',
  size = 15,
  color = colors.navy,
  style,
  tracking,
  lh,
  center,
  ...rest
}: TextProps & { w?: W; size?: number; color?: string; tracking?: number; lh?: number; center?: boolean }) {
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={1.4}
      style={[
        { fontFamily: fonts[w], fontSize: size, color, letterSpacing: tracking, lineHeight: lh, textAlign: center ? 'center' : undefined },
        style,
      ]}
    />
  );
}

/** Big screen title, e.g. "Bookings" */
export const Title = (p: TextProps & { size?: number }) => <Txt w="extrabold" size={p.size ?? 32} tracking={-1} {...p} />;
export const Muted = (p: TextProps & { size?: number; w?: W }) => <Txt color={colors.grey} size={p.size ?? 13.5} w={p.w ?? 'medium'} {...p} />;
