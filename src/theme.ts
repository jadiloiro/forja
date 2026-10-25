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

// Barlow Condensed nos títulos e números de destaque. Uma família por peso:
// no Android, fontWeight com fonte customizada cai na fonte do sistema.
export const family = {
  display: 'BarlowCondensed_800ExtraBold',
  bold: 'BarlowCondensed_700Bold',
  semi: 'BarlowCondensed_600SemiBold',
};

export const font = {
  display: { fontSize: 36, fontFamily: family.display, letterSpacing: 0.2, color: colors.text },
  h1: { fontSize: 28, fontFamily: family.display, letterSpacing: 0.2, color: colors.text },
  h2: { fontSize: 21, fontFamily: family.bold, letterSpacing: 0.2, color: colors.text },
  h3: { fontSize: 15, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.textDim },
  tiny: { fontSize: 11, color: colors.textMute, letterSpacing: 0.6, textTransform: 'uppercase' as const, fontWeight: '700' as const },
  num: { fontVariant: ['tabular-nums' as const] },
};
