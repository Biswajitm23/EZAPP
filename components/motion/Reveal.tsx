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

/** How far an "up" reveal slides from below, in px. */
const SLIDE = 22

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
}
