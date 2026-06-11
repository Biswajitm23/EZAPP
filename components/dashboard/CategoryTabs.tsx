import React from 'react'
import { Text, StyleSheet, ScrollView, StyleProp, ViewStyle } from 'react-native'
import { PressableScale } from '@/components/motion'
import { useTheme } from '@/constants/theme'
import type { DashboardTab } from '@/api/types'

export interface CategoryTabsProps {
  tabs: DashboardTab[]
  activeKey: string
  onChange: (key: string) => void
  style?: StyleProp<ViewStyle>
}

/**
 * API-driven horizontal category chips from `meta.tabs`. Controlled: the parent
 * owns `activeKey` + `onChange`. Reused for BOTH the in-flow header chips and
 * the floating auto-hiding bar. Active chip = brand bg + inverse text; inactive
 * chip = secondary bg + secondary text. Each chip is a `PressableScale`.
 */
export const CategoryTabs: React.FC<CategoryTabsProps> = ({ tabs, activeKey, onChange, style }) => {
  const { colors, borderRadius } = useTheme()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey
        return (
          <PressableScale
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.chip,
              {
                borderRadius: borderRadius.full,
                backgroundColor: active ? colors.brand.primary : colors.background.secondary,
              },
            ]}
            activeScale={0.93}
          >
            <Text
              style={[
                styles.chipText,
                { color: active ? colors.text.inverse : colors.text.secondary },
              ]}
            >
              {tab.title}
            </Text>
          </PressableScale>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 9 },
  chipText: { fontSize: 13, fontWeight: '600' },
})
