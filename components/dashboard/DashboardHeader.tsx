import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AppHeader } from '@/components/AppHeader'
import { useTheme } from '@/constants/theme'

export interface DashboardHeaderProps {
  /** greetingForNow() result, e.g. "Good Morning". */
  greeting: string
  /** user?.name?.split(' ')[0] ?? 'there'. */
  firstName: string
}

/**
 * Thin wrapper around the shared `<AppHeader/>`. Keeps the greeting kicker +
 * left-aligned title + avatar exactly, and owns the surrounding spacing/
 * typography polish so the dashboard screen no longer inlines it. Does NOT
 * change `AppHeader` internals.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ greeting, firstName }) => {
  const { spacing, colors } = useTheme()

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: spacing.xs, marginBottom: spacing.base, backgroundColor: colors.background.primary },
      ]}
    >
      <AppHeader kicker={greeting} title={firstName} align="left" />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {},
})
