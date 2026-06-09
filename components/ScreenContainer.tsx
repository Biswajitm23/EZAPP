import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { SafeAreaView, Edge } from 'react-native-safe-area-context'
import { useTheme } from '@/constants/theme'

interface ScreenContainerProps {
  children: React.ReactNode
  /** Safe-area edges to apply. Defaults to top + bottom. */
  edges?: Edge[]
  style?: ViewStyle
  /** Override the background; defaults to theme background.primary. */
  backgroundColor?: string
}

/**
 * Standard screen wrapper: applies the themed background and safe-area insets
 * so individual screens don't repeat the boilerplate.
 */
export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  edges = ['top', 'bottom'],
  style,
  backgroundColor,
}) => {
  const { colors } = useTheme()
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor: backgroundColor ?? colors.background.primary }, style]}
    >
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
})
