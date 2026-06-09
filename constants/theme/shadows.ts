/**
 * Shadow / Elevation System — works on both iOS and Android.
 */

import { ViewStyle } from 'react-native'

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>

const createShadow = (
  offsetY: number,
  blur: number,
  opacity: number,
  elevation: number,
  color: string = '#000000'
): ShadowStyle => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: offsetY },
  shadowOpacity: opacity,
  shadowRadius: blur,
  elevation,
})

export const lightShadows = {
  none: createShadow(0, 0, 0, 0),
  sm: createShadow(2, 4, 0.1, 2),
  md: createShadow(4, 8, 0.12, 4),
  lg: createShadow(8, 16, 0.15, 8),
  card: createShadow(2, 8, 0.08, 3),
} as const

export const darkShadows = {
  none: createShadow(0, 0, 0, 0),
  sm: createShadow(2, 4, 0.4, 2),
  md: createShadow(4, 8, 0.5, 4),
  lg: createShadow(8, 16, 0.6, 8),
  card: createShadow(2, 8, 0.4, 3),
} as const

export type Shadows = typeof lightShadows
