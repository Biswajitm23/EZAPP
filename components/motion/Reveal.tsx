<<<<<<< HEAD
import React, { useEffect } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated'
=======
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43

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

<<<<<<< HEAD
/** How far an "up" reveal slides from below, in px. */
const SLIDE = 22

=======
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
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
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
<<<<<<< HEAD
  const progress = useSharedValue(0)

  useEffect(() => {
    if (direction === 'up') {
      progress.value = withDelay(delay, withSpring(1, { damping: 18, mass: 0.7, stiffness: 140 }))
    } else {
      progress.value = withDelay(delay, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }))
    }
  }, [delay, direction, progress])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: direction === 'up' ? [{ translateY: (1 - progress.value) * SLIDE }] : [],
  }))

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
=======
  const entering =
    direction === 'up'
      ? FadeInDown.delay(delay).duration(460).springify().damping(18).mass(0.7)
      : FadeIn.delay(delay).duration(380)

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  )
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
}
