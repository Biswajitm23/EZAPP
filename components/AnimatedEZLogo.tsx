import React, { useEffect, useState } from 'react'
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const BRAND_TEAL = '#13A07C'
const BRAND_GREEN = '#00A974'

interface AnimatedEZLogoProps {
  /** Diameter of the badge in px. Defaults to 120. */
  size?: number
  /** When false, skips both the entrance and the continuous loop. Defaults to true. */
  animate?: boolean
}

/**
 * A circular teal→green "EZ" badge for the onboarding / landing screen.
 *
 * Animation (react-native-reanimated v4, all UI-thread / worklet driven):
 *  - Entrance: the badge scales up (`0.6 → 1`) and fades in (`0 → 1`) on mount.
 *  - Continuous: a surrounding ring softly "breathes" — looping scale + opacity
 *    pulse via `withRepeat(withSequence(...))`, kept subtle and inexpensive.
 *
 * Respects the OS "reduce motion" setting: when enabled (or `animate={false}`),
 * the badge renders settled with no looping motion. The reduce-motion lookup is
 * async and non-blocking, so first paint is never delayed.
 */
export const AnimatedEZLogo: React.FC<AnimatedEZLogoProps> = ({ size = 120, animate = true }) => {
  const [reduceMotion, setReduceMotion] = useState(false)

  const scale = useSharedValue(animate ? 0.6 : 1)
  const opacity = useSharedValue(animate ? 0 : 1)
  const ringScale = useSharedValue(1)
  const ringOpacity = useSharedValue(0.35)

  useEffect(() => {
    let cancelled = false
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const motionOn = animate && !reduceMotion

    if (!motionOn) {
      // Settle everything to its resting state with no looping motion.
      scale.value = 1
      opacity.value = 1
      ringScale.value = 1
      ringOpacity.value = 0.35
      return
    }

    // Entrance: gentle scale-up + fade-in.
    scale.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) })
    opacity.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) })

    // Continuous: soft breathing ring (scale + opacity), looping forever.
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    )
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.12, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.35, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    )
  }, [animate, reduceMotion, opacity, ringOpacity, ringScale, scale])

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }))

  const radius = size / 2
  const fontSize = Math.round(size * 0.36)

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Breathing accent ring behind the badge */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          { width: size, height: size, borderRadius: radius, borderColor: BRAND_GREEN },
          ringStyle,
        ]}
      />

      <Animated.View
        style={[
          styles.badge,
          { width: size, height: size, borderRadius: radius },
          badgeStyle,
        ]}
      >
        <LinearGradient
          colors={[BRAND_TEAL, BRAND_GREEN]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fill, { borderRadius: radius }]}
        >
          <Text style={[styles.letters, { fontSize }]}>EZ</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
  badge: {
    overflow: 'hidden',
    shadowColor: '#0E7A60',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
  },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  letters: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 1,
  },
})

export default AnimatedEZLogo
