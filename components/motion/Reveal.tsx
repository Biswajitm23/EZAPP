import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'

interface RevealProps {
  /** Position in a list — drives the stagger delay so items cascade in. */
  index?: number
  /** Milliseconds between each item (default 55). */
  step?: number
  /** Extra delay before the whole group starts. */
  baseDelay?: number
  /** Clamp the cascade so long lists don't lag far-down items (default 650ms). */
  maxDelay?: number
  /** Slide up from below (default) or just fade. */
  direction?: 'up' | 'fade'
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}

/**
 * Wraps content in a staggered "reveal" entrance — a soft fade + slide-up that
 * cascades by `index`. This is the motion that makes a screen feel like it
 * *arrives* instead of just appearing. Built on Reanimated layout animations,
 * so it fires once on mount with zero per-frame JS.
 *
 * Usage:
 *   {items.map((item, i) => (
 *     <Reveal key={item.id} index={i}><Card .../></Reveal>
 *   ))}
 */
export const Reveal: React.FC<RevealProps> = ({
  index = 0,
  step = 55,
  baseDelay = 0,
  maxDelay = 650,
  direction = 'up',
  style,
  children,
}) => {
  const delay = Math.min(baseDelay + index * step, maxDelay)
  const entering =
    direction === 'up'
      ? FadeInDown.delay(delay).duration(460).springify().damping(18).mass(0.7)
      : FadeIn.delay(delay).duration(380)

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  )
}
