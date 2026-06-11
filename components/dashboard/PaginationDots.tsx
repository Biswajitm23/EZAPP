import React from 'react'
import { StyleSheet, StyleProp, ViewStyle, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated'
import { useTheme } from '@/constants/theme'

export interface PaginationDotsProps {
  count: number
  activeIndex: number
  style?: StyleProp<ViewStyle>
}

const DOT_WIDTH = 7
const DOT_ACTIVE_WIDTH = 18
const DOT_HEIGHT = 7

/** A single dot whose width + color animate when it becomes the active page. */
const Dot: React.FC<{ active: boolean }> = ({ active }) => {
  const { colors } = useTheme()

  const animatedStyle = useAnimatedStyle(() => ({
    width: withSpring(active ? DOT_ACTIVE_WIDTH : DOT_WIDTH, {
      damping: 18,
      mass: 0.6,
      stiffness: 220,
    }),
    backgroundColor: withTiming(active ? colors.brand.primary : colors.border.default, {
      duration: 180,
    }),
  }))

  return <Animated.View style={[styles.dot, animatedStyle]} />
}

/**
 * Theme-colored paging indicator. The active dot is wider + brand-colored (width
 * animated on the UI thread via reanimated); inactive dots use the border color.
 * Centered row under the carousel.
 */
export const PaginationDots: React.FC<PaginationDotsProps> = ({ count, activeIndex, style }) => {
  if (count <= 1) return null
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} active={i === activeIndex} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: DOT_WIDTH,
    height: DOT_HEIGHT,
    borderRadius: 4,
  },
})
