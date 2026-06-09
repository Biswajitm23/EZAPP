import React from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'

/* -------------------------------------------------------------------------- */
/* Soft pastel circles framing the screen. Positions/sizes are fractions of    */
/* the screen so the spacing stays consistent across devices. Extracted from   */
/* the login screen so login + onboarding share one identical backdrop.        */
/* -------------------------------------------------------------------------- */

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

type Circle = {
  color: string
  /** Diameter as a fraction of the screen width. */
  size: number
  pos: { top?: number; bottom?: number; left?: number; right?: number }
}

const CIRCLES: Circle[] = [
  // top-left + top-right corners (symmetric)
  { color: '#F6D78A', size: 0.6, pos: { top: -SCREEN_H * 0.05, left: -SCREEN_W * 0.2 } },
  { color: '#9FD8F2', size: 0.62, pos: { top: -SCREEN_H * 0.05, right: -SCREEN_W * 0.2 } },
  // right-middle accent
  { color: '#F4B6C8', size: 0.54, pos: { top: SCREEN_H * 0.15, right: -SCREEN_W * 0.24 } },
  // bottom-left + bottom-right corners (symmetric)
  { color: '#BFE3B0', size: 0.62, pos: { bottom: SCREEN_H * 0.12, left: -SCREEN_W * 0.2 } },
  { color: '#F6D78A', size: 0.56, pos: { bottom: -SCREEN_H * 0.04, right: -SCREEN_W * 0.18 } },
  // bottom-center accent
  { color: '#A8E0D8', size: 0.58, pos: { bottom: -SCREEN_H * 0.05, left: SCREEN_W * 0.26 } },
]

/**
 * Pastel "blob" backdrop echoing the web portal's photo collage. Renders behind
 * screen content and ignores touches so it never blocks interaction.
 */
export const DecorativeBackground: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {CIRCLES.map((c, i) => {
      const d = SCREEN_W * c.size
      return (
        <View
          key={i}
          style={[styles.blob, c.pos, { width: d, height: d, backgroundColor: c.color }]}
        />
      )
    })}
  </View>
)

const styles = StyleSheet.create({
  blob: { position: 'absolute', borderRadius: 9999, opacity: 0.55 },
})

export default DecorativeBackground
