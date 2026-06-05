import { Platform, TextStyle } from 'react-native'

export const fontFamily = {
  system: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
} as const

export const fontWeight = {
  light: '300' as TextStyle['fontWeight'],
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semiBold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
} as const

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
} as const

export const lineHeight = {
  tight: 1.2,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
} as const

const f = fontFamily.system

// Pre-defined Typography Styles
export const typography = {
  heading: {
    h1: { fontFamily: f, fontSize: fontSize['4xl'], lineHeight: Math.round(fontSize['4xl'] * lineHeight.tight), fontWeight: fontWeight.bold },
    h2: { fontFamily: f, fontSize: fontSize['2xl'], lineHeight: Math.round(fontSize['2xl'] * lineHeight.tight), fontWeight: fontWeight.semiBold },
    h3: { fontFamily: f, fontSize: fontSize.xl, lineHeight: Math.round(fontSize.xl * lineHeight.snug), fontWeight: fontWeight.semiBold },
    h4: { fontFamily: f, fontSize: fontSize.lg, lineHeight: Math.round(fontSize.lg * lineHeight.snug), fontWeight: fontWeight.semiBold },
  },
  body: {
    large: { fontFamily: f, fontSize: fontSize.lg, lineHeight: Math.round(fontSize.lg * lineHeight.normal), fontWeight: fontWeight.regular },
    base: { fontFamily: f, fontSize: fontSize.base, lineHeight: Math.round(fontSize.base * lineHeight.normal), fontWeight: fontWeight.regular },
    small: { fontFamily: f, fontSize: fontSize.md, lineHeight: Math.round(fontSize.md * lineHeight.normal), fontWeight: fontWeight.regular },
  },
  label: {
    base: { fontFamily: f, fontSize: fontSize.md, lineHeight: Math.round(fontSize.md * lineHeight.normal), fontWeight: fontWeight.medium },
    small: { fontFamily: f, fontSize: fontSize.sm, lineHeight: Math.round(fontSize.sm * lineHeight.normal), fontWeight: fontWeight.medium },
  },
  caption: {
    base: { fontFamily: f, fontSize: fontSize.sm, lineHeight: Math.round(fontSize.sm * lineHeight.normal), fontWeight: fontWeight.regular },
  },
  button: {
    base: { fontFamily: f, fontSize: fontSize.base, lineHeight: Math.round(fontSize.base * lineHeight.normal), fontWeight: fontWeight.semiBold },
  },
}

export type Typography = typeof typography
