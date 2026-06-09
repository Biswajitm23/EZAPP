import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { initialsOf } from '@/helpers'

// Curated palettes so each name maps to a recognisable colour identity.
// Brand-aligned: greens/teals lead, with a few warm accents for variety.
const PALETTES: Array<readonly [string, string]> = [
  ['#13A07C', '#0E7A60'],
  ['#0EA5A5', '#22C9C9'],
  ['#1E7A52', '#34B27B'],
  ['#0891B2', '#22D3EE'],
  ['#F59E0B', '#F2994A'],
  ['#B24A57', '#EB7C8A'],
]

function paletteFor(name: string): readonly [string, string] {
  if (!name) return PALETTES[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return PALETTES[Math.abs(hash) % PALETTES.length]
}

interface InitialAvatarProps {
  name: string
  size: number
  borderRadius?: number
}

/**
 * Gradient avatar with initials — shown when a user has no profile photo.
 */
export const InitialAvatar: React.FC<InitialAvatarProps> = ({ name, size, borderRadius }) => {
  const palette = paletteFor(name)
  const radius = borderRadius ?? size / 2
  const fontSize = Math.round(size * 0.4)

  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}>
      <LinearGradient colors={palette} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
        <Text style={[styles.text, { fontSize }]}>{initialsOf(name)}</Text>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.5 },
})
