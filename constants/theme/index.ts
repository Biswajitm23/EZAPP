/**
 * Employee Zone App Theme System
 *
 * Usage:
 *   import { useTheme, ThemeProvider, spacing, typography } from '@/constants/theme'
 */

export { ThemeProvider, useTheme, useColors } from './ThemeProvider'
export type { ThemeMode } from './ThemeProvider'

export { colors, lightColors, darkColors, pastels, pastelAt, BRAND_GREEN, BRAND_GREEN_DARK } from './colors'
export type { ThemeColors, Pastel } from './colors'

export { typography, fontFamily, fontWeight, fontSize, lineHeight } from './typography'
export type { Typography } from './typography'

export { spacing, borderRadius, layout } from './spacing'
export type { Spacing, BorderRadius, Layout } from './spacing'

export { lightShadows, darkShadows } from './shadows'
export type { Shadows } from './shadows'
