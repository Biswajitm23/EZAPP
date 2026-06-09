import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/constants/theme'

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
  minHeight?: number
}

/**
 * Shared "no results" view for listing screens. Pass as a FlatList
 * `ListEmptyComponent` with `contentContainerStyle={{ flexGrow: 1 }}`.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, minHeight = 320 }) => {
  const { colors } = useTheme()

  return (
    <View style={[styles.container, { minHeight }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.semantic.successLight }]}>
        <Ionicons name={icon} size={40} color={colors.brand.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 24 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
})
