export type ColorPalette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentDim: string;
  onAccent: string;
  warning: string;
  danger: string;
  rest: string;
};

export const darkColors: ColorPalette = {
  bg: '#0f1419',
  surface: '#1a222d',
  surfaceAlt: '#243040',
  border: '#2d3a4d',
  text: '#f0f4f8',
  textMuted: '#8b9cb3',
  accent: '#3dd68c',
  accentDim: '#2a9d63',
  onAccent: '#0f1419',
  warning: '#f5a623',
  danger: '#ef5b5b',
  rest: '#5b8def',
};

export const lightColors: ColorPalette = {
  bg: '#f4f6f9',
  surface: '#ffffff',
  surfaceAlt: '#eef2f7',
  border: '#d8e0ea',
  text: '#1a2332',
  textMuted: '#64748b',
  accent: '#16a34a',
  accentDim: '#15803d',
  onAccent: '#ffffff',
  warning: '#d97706',
  danger: '#dc2626',
  rest: '#2563eb',
};

/** @deprecated Use useTheme().colors instead */
export const colors = darkColors;

export type ThemeMode = 'light' | 'dark';

export function getColors(mode: ThemeMode): ColorPalette {
  return mode === 'light' ? lightColors : darkColors;
}
