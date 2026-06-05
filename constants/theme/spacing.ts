/**
 * Spacing System — based on a 4px base unit.
 */

const BASE = 4

export const spacing = {
  none: 0,
  xs: BASE, // 4
  sm: BASE * 2, // 8
  md: BASE * 3, // 12
  base: BASE * 4, // 16
  lg: BASE * 5, // 20
  xl: BASE * 6, // 24
  '2xl': BASE * 8, // 32
  '3xl': BASE * 10, // 40
  '4xl': BASE * 12, // 48
} as const

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  full: 9999,
} as const

export const layout = {
  screenPaddingHorizontal: spacing.base,
  screenPaddingVertical: spacing.lg,
  cardPadding: spacing.lg,
  inputHeight: 48,
  buttonHeight: 48,
  iconSizeBase: 20,
  iconSizeMedium: 24,
  avatarSizeBase: 40,
  avatarSizeLarge: 64,
  avatarSize2XL: 120,
  tabBarHeight: 64,
  headerHeight: 56,
} as const

export type Spacing = typeof spacing
export type BorderRadius = typeof borderRadius
export type Layout = typeof layout
