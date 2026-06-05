import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { ScreenContainer } from './ScreenContainer'
import { InitialAvatar } from './InitialAvatar'
import { BrandWordmark } from './BrandWordmark'
import { useAuth } from '@/hooks/useAuth'

export type PointsRow = { month: string; balance: string }

interface PointsViewProps {
  /** Page heading, e.g. "Bitpoints" or "Sum Of Total Cash". */
  title: string
  rows: PointsRow[]
}

/**
 * Shared layout for the Bitpoints / Incentives screens — mirrors the web
 * portal: a heading, an employee banner (avatar | name | bitpastel wordmark),
 * and a Month / Balance table.
 */
export const PointsView: React.FC<PointsViewProps> = ({ title, rows }) => {
  const { user } = useAuth()
  const name = user?.name ?? 'Employee'

  return (
    <ScreenContainer edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.card}>
          {/* Employee banner */}
          <View style={styles.banner}>
            <View style={styles.avatarBox}>
              <InitialAvatar name={name} size={44} />
            </View>
            <View style={styles.nameBox}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
            </View>
            <View style={styles.logoBox}>
              <BrandWordmark size={16} />
            </View>
          </View>

          {/* Table */}
          <View style={styles.table}>
            <View style={[styles.row, styles.headRow]}>
              <Text style={[styles.cell, styles.headCell, styles.cellDivider]}>Month</Text>
              <Text style={[styles.cell, styles.headCell]}>Balance</Text>
            </View>
            {rows.map((r, i) => (
              <View key={i} style={[styles.row, i < rows.length - 1 && styles.rowDivider]}>
                <Text style={[styles.cell, styles.cellDivider]}>{r.month}</Text>
                <Text style={styles.cell}>{r.balance || '—'}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  )
}

const BORDER = '#E5E7EB'
const TEAL = '#13A07C'

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 110 },
  title: { fontSize: 22, fontWeight: '700', color: '#2B2B2B', textAlign: 'center', marginBottom: 20 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    minHeight: 72,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    // subtle lift
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarBox: { paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  nameBox: { flex: 1, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  name: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  logoBox: { paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },

  table: { borderWidth: 1, borderColor: BORDER, borderRadius: 6, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  headRow: { backgroundColor: '#DCF2E1' },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: BORDER },
  cell: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, textAlign: 'center', color: '#2B2B2B', fontSize: 14 },
  cellDivider: { borderRightWidth: 1, borderRightColor: BORDER },
  headCell: { fontWeight: '700' },
})
