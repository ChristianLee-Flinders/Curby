// Curby design tokens (matches the approved mockup)
export const colors = {
  primary: '#6035F5',
  primaryDark: '#4B22DA',
  primaryLight: '#8B6CFF',
  navy: '#111A35',
  navySoft: '#1B2550',
  bg: '#F8F9FC',
  card: '#FFFFFF',
  grey: '#6B7187',
  grey2: '#9AA0B3',
  line: '#ECEEF4',
  soft: '#F4F5FA',
  lavender: '#F1EDFF',
  ok: '#14804A',
  okBg: '#E8F7EF',
  warn: '#B25E09',
  warnBg: '#FFF3E0',
  bad: '#D93848',
  badBg: '#FDECEE',
  heart: '#FF3B5C',
  white: '#FFFFFF',
  black: '#000000',
  plate: '#FFD43B',
} as const;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const radius = { sm: 10, md: 16, lg: 22, xl: 26, pill: 999 } as const;

export const shadow = {
  card: {
    shadowColor: '#111A35',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  soft: {
    shadowColor: '#111A35',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  button: {
    shadowColor: '#6035F5',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;
