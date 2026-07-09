/**
 * UriTech Design Tokens - Inspirado no Gojek Asphalt Design System
 * Cores, tipografia e espaçamentos do super app
 */

export const colors = {
  // Brand
  primary: '#00AA13',
  primaryDark: '#008A0F',
  primaryLight: '#E8F9EA',
  secondary: '#F06400',
  secondaryDark: '#D45600',
  secondaryLight: '#FFF3E8',

  // Semantic
  success: '#00AA13',
  warning: '#F5A623',
  error: '#EE2737',
  info: '#1A73E8',

  // Neutral
  black: '#1C1C1C',
  gray900: '#2D2D2D',
  gray700: '#4A4A4A',
  gray500: '#737373',
  gray300: '#B3B3B3',
  gray100: '#E8E8E8',
  gray50: '#F7F7F7',
  white: '#FFFFFF',

  // Service colors (Gojek-style)
  ride: '#00AA13',
  food: '#EE2737',
  mart: '#7B2D8E',
  send: '#1A73E8',
  pay: '#F06400',
  pulsa: '#00B4D8',
  bills: '#6C63FF',
  health: '#FF6B6B',
} as const;

export const typography = {
  fontFamily: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'Inter, sans-serif',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.07)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} as const;

export type Theme = typeof theme;
