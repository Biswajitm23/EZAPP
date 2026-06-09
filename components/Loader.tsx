import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '@/constants/theme'

interface LoaderProps {
  /** Fill the parent and center, vs. inline. */
  fullscreen?: boolean
  size?: 'small' | 'large'
}

/** Themed loading spinner. */
export const Loader: React.FC<LoaderProps> = ({ fullscreen = true, size = 'large' }) => {
  const { colors } = useTheme()
  return (
    <View style={fullscreen ? styles.fullscreen : styles.inline}>
      <ActivityIndicator size={size} color={colors.brand.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  fullscreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inline: { alignItems: 'center', justifyContent: 'center', padding: 16 },
})
