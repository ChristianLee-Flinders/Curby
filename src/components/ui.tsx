import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ChevronLeft, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Muted, Txt } from '@/components/txt';
import { colors, fonts, radius, shadow } from '@/lib/theme';

export const tap = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

// ------------------------------------------------------------------ Button
type BtnVariant = 'primary' | 'secondary' | 'outline' | 'dark' | 'danger' | 'ghost';
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon: Icon,
  iconRight: IconRight,
  loading,
  disabled,
  style,
  height = 54,
  small,
}: {
  title: string;
  onPress?: () => void;
  variant?: BtnVariant;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  height?: number;
  small?: boolean;
}) {
  const v = {
    primary: { bg: colors.primary, fg: colors.white, border: undefined },
    secondary: { bg: colors.lavender, fg: colors.primaryDark, border: undefined },
    outline: { bg: colors.card, fg: colors.navy, border: colors.line },
    dark: { bg: colors.black, fg: colors.white, border: undefined },
    danger: { bg: colors.badBg, fg: colors.bad, border: undefined },
    ghost: { bg: 'transparent', fg: colors.primary, border: undefined },
  }[variant];
  const h = small ? 44 : height;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.btn,
        { height: h, backgroundColor: v.bg, borderColor: v.border, borderWidth: v.border ? 1 : 0, borderRadius: small ? 14 : 18 },
        variant === 'primary' && shadow.button,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.985 }], opacity: 0.92 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {Icon && <Icon size={18} color={v.fg} strokeWidth={2.3} />}
          <Txt w="bold" size={small ? 14.5 : 16.5} color={v.fg} tracking={-0.2}>
            {title}
          </Txt>
          {IconRight && <IconRight size={18} color={v.fg} strokeWidth={2.5} />}
        </>
      )}
    </Pressable>
  );
}

// ------------------------------------------------------------------ Card / Row
export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress)
    return (
      <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.94 }]}>
        {children}
      </Pressable>
    );
  return <View style={[styles.card, style]}>{children}</View>;
}

export const Row = ({ children, style, gap = 12 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>
);

// ------------------------------------------------------------------ Circle icon button
export function CircleButton({
  icon: Icon,
  onPress,
  label,
  variant = 'white',
  size = 44,
  color = colors.navy,
  children,
}: {
  icon?: LucideIcon;
  onPress?: () => void;
  label: string;
  variant?: 'white' | 'glass' | 'soft' | 'primary' | 'plain';
  size?: number;
  color?: string;
  children?: ReactNode;
}) {
  const bg = { white: colors.card, glass: 'rgba(255,255,255,0.92)', soft: colors.soft, primary: colors.primary, plain: 'transparent' }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        (variant === 'white' || variant === 'glass') && shadow.soft,
        pressed && { opacity: 0.7 },
      ]}>
      {Icon && <Icon size={size * 0.45} color={variant === 'primary' ? colors.white : color} strokeWidth={2.2} />}
      {children}
    </Pressable>
  );
}

export function BackButton({ variant = 'white' }: { variant?: 'white' | 'glass' }) {
  return (
    <CircleButton
      icon={ChevronLeft}
      label="Back"
      variant={variant}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
    />
  );
}

/** Simple top bar: back button, centred title, optional right element. */
export function NavBar({ title, right, back = true }: { title?: string; right?: ReactNode; back?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
      <View style={{ width: 44 }}>{back && <BackButton />}</View>
      <Txt w="bold" size={17} tracking={-0.3} style={{ flex: 1, textAlign: 'center' }} numberOfLines={1}>
        {title}
      </Txt>
      <View style={{ width: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

// ------------------------------------------------------------------ Chips / tags
export function Chip({
  label,
  icon: Icon,
  on,
  onPress,
  large,
}: {
  label: string;
  icon?: LucideIcon;
  on?: boolean;
  onPress?: () => void;
  large?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[styles.chip, large && { height: 44, paddingHorizontal: 16 }, on && { backgroundColor: colors.navy, borderColor: colors.navy }]}>
      {Icon && <Icon size={15} color={on ? colors.white : colors.navy} strokeWidth={2.2} />}
      <Txt w="semibold" size={large ? 14.5 : 13.5} color={on ? colors.white : colors.navy}>
        {label}
      </Txt>
    </Pressable>
  );
}

type TagTone = 'purple' | 'ok' | 'warn' | 'bad' | 'grey';
export function Tag({ label, icon: Icon, tone = 'purple', style }: { label: string; icon?: LucideIcon; tone?: TagTone; style?: StyleProp<ViewStyle> }) {
  const t = {
    purple: [colors.lavender, colors.primaryDark],
    ok: [colors.okBg, colors.ok],
    warn: [colors.warnBg, colors.warn],
    bad: [colors.badBg, colors.bad],
    grey: [colors.soft, colors.grey],
  }[tone];
  return (
    <View style={[styles.tag, { backgroundColor: t[0] }, style]}>
      {Icon && <Icon size={11} color={t[1]} strokeWidth={2.6} />}
      <Txt w="bold" size={11} color={t[1]}>
        {label}
      </Txt>
    </View>
  );
}

// ------------------------------------------------------------------ misc
export function Avatar({ name, size = 40, tint = colors.lavender, ink = colors.primaryDark }: { name: string; size?: number; tint?: string; ink?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
      <Txt w="bold" size={size * 0.36} color={ink}>
        {name}
      </Txt>
    </View>
  );
}

const TINTS: [string, string][] = [
  ['#FFE3D6', '#B4441C'],
  ['#DDF1E5', '#1E6B43'],
  ['#E2E8FF', '#2D3F9E'],
  ['#FFF0C9', '#8A5A00'],
  ['#FCE4F1', '#9A2463'],
  ['#E0F3F6', '#14707E'],
];
export const tintFor = (s: string) => TINTS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];

export function Plate({ reg, small }: { reg: string; small?: boolean }) {
  return (
    <View style={[styles.plate, small && { height: 24, paddingHorizontal: 7 }]}>
      <Txt w="extrabold" size={small ? 12.5 : 15} color="#111" tracking={1}>
        {reg}
      </Txt>
    </View>
  );
}

export function IconTile({ icon: Icon, tone = 'purple', size = 44 }: { icon: LucideIcon; tone?: 'purple' | 'ok' | 'bad'; size?: number }) {
  const [bg, fg] = { purple: [colors.lavender, colors.primary], ok: [colors.okBg, colors.ok], bad: [colors.badBg, colors.bad] }[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={size * 0.48} color={fg} strokeWidth={2} />
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  danger,
  first,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
  first?: boolean;
}) {
  const inner = (
    <>
      {icon && <IconTile icon={icon} size={36} tone={danger ? 'bad' : 'purple'} />}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt w="semibold" size={15} color={danger ? colors.bad : colors.navy}>
          {title}
        </Txt>
        {subtitle ? <Muted size={12.5}>{subtitle}</Muted> : null}
      </View>
      {right}
    </>
  );
  const style = [styles.li, !first && { borderTopWidth: 1, borderTopColor: colors.line }];
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [style, pressed && { backgroundColor: colors.soft }]}>
      {inner}
    </Pressable>
  ) : (
    <View style={style}>{inner}</View>
  );
}

export const ListGroup = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.list, style]}>{children}</View>
);

export const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
  <Switch
    accessibilityLabel={label}
    value={value}
    onValueChange={(v) => {
      tap();
      onChange(v);
    }}
    trackColor={{ true: '#34C759', false: '#E1E3EA' }}
    thumbColor={colors.white}
    ios_backgroundColor="#E1E3EA"
  />
);

export const SectionLabel = ({ children }: { children: string }) => (
  <Txt w="bold" size={12} color={colors.grey2} tracking={0.8} style={{ textTransform: 'uppercase', marginTop: 24, marginBottom: 8, paddingHorizontal: 20 }}>
    {children}
  </Txt>
);

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 26, marginBottom: 12 }}>
      <Txt w="extrabold" size={20} tracking={-0.5}>
        {title}
      </Txt>
      {action && (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Txt w="semibold" size={14} color={colors.primary}>
            {action}
          </Txt>
        </Pressable>
      )}
    </View>
  );
}

export function Field({ label, style, ...p }: TextInputProps & { label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Txt w="bold" size={12.5} color={colors.grey}>
        {label}
      </Txt>
      <TextInput placeholderTextColor={colors.grey2} style={styles.input} accessibilityLabel={label} {...p} />
    </View>
  );
}

export function Empty({ icon: Icon, title, body, action, onAction }: { icon: LucideIcon; title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 36, paddingVertical: 56 }}>
      <View style={{ width: 76, height: 76, borderRadius: 24, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <Icon size={34} color={colors.primary} strokeWidth={2} />
      </View>
      <Txt w="extrabold" size={18} tracking={-0.3} center>
        {title}
      </Txt>
      <Muted size={14} style={{ textAlign: 'center', marginTop: 6, lineHeight: 21 }}>
        {body}
      </Muted>
      {action && <Button title={action} onPress={onAction} style={{ marginTop: 20, alignSelf: 'stretch' }} />}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function Radio({ on }: { on: boolean }) {
  return (
    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? colors.primary : '#CFD2DC', alignItems: 'center', justifyContent: 'center' }}>
      {on && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }} />}
    </View>
  );
}

export function Option({ on, onPress, children }: { on: boolean; onPress: () => void; children: ReactNode } & Omit<PressableProps, 'children'>) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.opt, on && { borderColor: colors.primary, backgroundColor: '#FBFAFF' }]}>
      <Radio on={on} />
      {children}
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, ...shadow.card },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, backgroundColor: colors.bg },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tag: { height: 22, paddingHorizontal: 8, borderRadius: 7, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  plate: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.plate,
    borderWidth: 1.5,
    borderColor: '#222',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  li: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13, minHeight: 58 },
  list: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', marginHorizontal: 16, ...shadow.soft },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.navy,
  },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
});
