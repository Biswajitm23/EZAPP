import React from 'react'
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface PressableScaleProps extends PressableProps {
  /** How far to shrink on press-in (0.96 = subtle, 0.9 = punchy). */
  activeScale?: number
  /** Dim slightly while pressed. Set 1 to disable. */
  activeOpacity?: number
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}

/**
 * A Pressable that springs down on press and bounces back on release.
 *
 * This is the app's standard "tappable" feel — drop it in anywhere a plain
 * Pressable is used (cards, chips, icon buttons) to make touches feel alive
 * instead of static. Runs entirely on the UI thread via Reanimated worklets.
 */
export const PressableScale: React.FC<PressableScaleProps> = ({
  activeScale = 0.96,
  activeOpacity = 0.92,
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const pressed = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(1 - pressed.value * (1 - activeScale), { stiffness: 300, damping: 18, mass: 0.6 }) },
    ],
    opacity: withTiming(1 - pressed.value * (1 - activeOpacity), { duration: 120 }),
  }))

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        pressed.value = 1
        onPressIn?.(e)
      }}
      onPressOut={(e) => {
        pressed.value = 0
        onPressOut?.(e)
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  )
}
