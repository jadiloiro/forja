export const colors = {
  bg: '#0C0D0F',
  surface: '#15171B',
  surface2: '#1D2025',
  surface3: '#262A30',
  border: '#2B2F36',
  text: '#F4F1EA',
  textDim: '#A3A8B0',
  textMute: '#6E747D',
  accent: '#FF6A2B',
  accentSoft: 'rgba(255,106,43,0.14)',
  accentText: '#1A0E07',
  success: '#3DD68C',
  successSoft: 'rgba(61,214,140,0.14)',
  warn: '#F5B83D',
  danger: '#FF5A52',
  dangerSoft: 'rgba(255,90,82,0.14)',
  protein: '#6AB0FF',
  carb: '#F5B83D',
  fat: '#E77BD6',
  water: '#4FC3F7',
};

export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const font = {
  display: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.6, color: colors.text },
  h1: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.4, color: colors.text },
  h2: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2, color: colors.text },
  h3: { fontSize: 15, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.textDim },
  tiny: { fontSize: 11, color: colors.textMute, letterSpacing: 0.6, textTransform: 'uppercase' as const, fontWeight: '700' as const },
  num: { fontVariant: ['tabular-nums' as const] },
};
