<<<<<<< HEAD
import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { ScreenContainer } from './ScreenContainer'
import { AppHeader } from './AppHeader'
import { Skeleton, SkeletonRow } from './Skeleton'
import { EmptyState } from './EmptyState'
import { Button } from './Button'
import { Reveal } from './motion'
=======
import React, { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { ScreenContainer } from './ScreenContainer'
import { InitialAvatar } from './InitialAvatar'
import { Loader } from './Loader'
import { EmptyState } from './EmptyState'
import { Button } from './Button'
import { PressableScale, Reveal } from './motion'
import { useAuth } from '@/hooks/useAuth'
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
import type { BitpointRow } from '@/api/types'

type IoniconName = keyof typeof Ionicons.glyphMap

<<<<<<< HEAD
/** How many history rows to show before infinite-scroll loads the next page. */
const PAGE_SIZE = 10

=======
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
/** "1250" -> "1,250" without relying on Intl (Hermes-safe). */
const withCommas = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "3" -> "March"; passes through names like "March" unchanged. */
const monthName = (m?: string | number): string => {
  if (m == null || m === '') return ''
  const s = String(m).trim()
  const n = parseInt(s, 10)
  if (!Number.isNaN(n) && n >= 1 && n <= 12) return MONTHS[n - 1]
  return s
}

const toNumber = (raw: string | number | undefined): number => {
  if (raw == null) return 0
  if (typeof raw === 'number') return raw
  const n = parseFloat(String(raw).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** The value shown — read from the page's value field, with fallbacks. */
const pointsOf = (r: BitpointRow, valueKey: keyof BitpointRow): number =>
  toNumber((r[valueKey] as string | number | undefined) ?? r.points ?? r.balance ?? r.amount)

/** Row label: "March 2026" from issue_month/issue_year. */
const labelOf = (r: BitpointRow): string => {
  const period = [monthName(r.issue_month), r.issue_year].filter(Boolean).join(' ')
  return period || r.month || r.date || '—'
}
const descOf = (r: BitpointRow): string => r.description ?? r.reason ?? r.type ?? ''

/** A row has data only if it carries a period (month/year) — drops empty rows. */
const hasData = (r: BitpointRow): boolean =>
  !!(r.issue_month || r.issue_year || r.month || r.date)

interface RewardsViewProps {
  /** Small grey line above the title. */
  kicker: string
  /** Bold page heading + default card subtitle unit. */
  title: string
  /** Label inside the gradient card, e.g. "Current Points". */
  cardLabel: string
  /** Unit under the big number (defaults to `title`). */
  unit?: string
  /** Icon for the card tile + history coins — match the bottom-nav icon. */
  icon: IoniconName
  /** Which row field holds this page's value (e.g. cumulative_cash_via_bitpoints / incentives). */
  valueKey: keyof BitpointRow
  rows: BitpointRow[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  /** Pull-to-refresh: refetch handler + whether a refetch is in flight. */
  onRefresh: () => void
  refreshing: boolean
  errorTitle: string
  emptyText: string
}

/**
<<<<<<< HEAD
 * Shared Rewards screen used by the Incentives tab: a header (kicker + title +
 * profile avatar), a brand-green stats card with the running total, and a
 * staggered history list. Live-data only — no static/fallback rows; shows a
 * spinner while loading, an empty state with retry on error.
 *
 * The history list renders {@link PAGE_SIZE} rows up front and grows in
 * PAGE_SIZE steps as the user scrolls (onEndReached), so very long histories
 * don't mount every row at once.
=======
 * Shared Rewards screen used by Bitpoints and Incentives: a header (kicker +
 * title + profile avatar), a brand-green stats card with the running total, and
 * a staggered history list. Live-data only — no static/fallback rows; shows a
 * spinner while loading, an empty state with retry on error.
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
 */
export const RewardsView: React.FC<RewardsViewProps> = ({
  kicker,
  title,
  cardLabel,
  unit,
  icon,
  valueKey,
  rows,
  isLoading,
  isError,
  onRetry,
  onRefresh,
  refreshing,
  errorTitle,
  emptyText,
}) => {
<<<<<<< HEAD
  // How many history rows are visible (infinite scroll grows this in PAGE_SIZE steps).
  const [visible, setVisible] = useState(PAGE_SIZE)
=======
  const router = useRouter()
  const { user } = useAuth()
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43

  // Drop empty rows (no period), then: Current = the latest month (newest-first);
  // History = everything else, so the latest period isn't duplicated in the list.
  const validRows = useMemo(() => rows.filter(hasData), [rows])
  const total = useMemo(() => (validRows.length ? pointsOf(validRows[0], valueKey) : 0), [validRows, valueKey])
  const history = useMemo(() => validRows.slice(1), [validRows])
<<<<<<< HEAD
  const pagedHistory = useMemo(() => history.slice(0, visible), [history, visible])
  const canLoadMore = visible < history.length

  const onEndReached = useCallback(() => {
    setVisible((v) => (v < history.length ? Math.min(v + PAGE_SIZE, history.length) : v))
  }, [history.length])

  const handleRefresh = useCallback(() => {
    setVisible(PAGE_SIZE)
    onRefresh()
  }, [onRefresh])

  if (isLoading) {
    return (
      <ScreenContainer edges={['top']}>
        <View style={styles.scroll}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Skeleton width="55%" height={13} style={{ marginBottom: 8 }} />
              <Skeleton width="40%" height={22} />
            </View>
            <Skeleton width={48} height={48} borderRadius={24} />
          </View>
          {/* Stats card */}
          <Skeleton height={150} borderRadius={24} style={{ marginBottom: 24 }} />
          {/* History */}
          <Skeleton width="30%" height={18} style={{ marginBottom: 14 }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
=======

  const avatar = user?.profile_image_url
  const goProfile = () => router.push('/(protected)/(tabs)/profile')

  if (isLoading) {
    return (
      <ScreenContainer>
        <Loader />
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
      </ScreenContainer>
    )
  }

  if (isError) {
    return (
      <ScreenContainer edges={['top']}>
        <EmptyState
          icon={icon}
          title={errorTitle}
          subtitle="Something went wrong while loading. Please try again."
        />
        <View style={{ paddingHorizontal: 20 }}>
          <Button title="Retry" variant="outline" onPress={onRetry} />
        </View>
      </ScreenContainer>
    )
  }

<<<<<<< HEAD
  const renderHeader = () => (
    <>
      {/* Header */}
      <Reveal index={0}>
        <AppHeader showBack kicker={kicker} title={title} />
      </Reveal>

      {/* Stats card */}
      <Reveal index={1}>
        <LinearGradient
          colors={['#1AB996', '#13A07C', '#0C6E57']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>{cardLabel}</Text>
            <View style={styles.iconTile}>
              <Ionicons name={icon} size={22} color="#FFD45F" />
            </View>
          </View>

          <Text style={styles.bigNumber}>{withCommas(total)}</Text>
          <Text style={styles.cardSub}>{unit ?? title}</Text>
        </LinearGradient>
      </Reveal>

      {/* History */}
      <Reveal index={2}>
        <Text style={styles.sectionTitle}>History</Text>
      </Reveal>
    </>
  )

  const renderItem = ({ item, index }: { item: BitpointRow; index: number }) => {
    const pts = pointsOf(item, valueKey)
    const desc = descOf(item)
    return (
      <Reveal index={3 + Math.min(index, 5)}>
        <View style={styles.historyRow}>
          <View style={styles.coin}>
            <Ionicons name={icon} size={18} color="#13A07C" />
          </View>
          <View style={styles.historyText}>
            <Text style={styles.historyLabel} numberOfLines={1}>
              {labelOf(item)}
            </Text>
            {!!desc && (
              <Text style={styles.historyDesc} numberOfLines={1}>
                {desc}
              </Text>
            )}
          </View>
          <Text style={[styles.historyPoints, pts < 0 && styles.historyPointsNeg]}>
            {withCommas(pts)}
          </Text>
        </View>
      </Reveal>
    )
  }

  return (
    <ScreenContainer edges={['top']}>
      <FlatList
        data={pagedHistory}
        keyExtractor={(item, i) => String(item.id ?? i)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#13A07C" colors={['#13A07C']} />
        }
        ListEmptyComponent={
=======
  return (
    <ScreenContainer edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#13A07C" colors={['#13A07C']} />
        }
      >
        {/* Header */}
        <Reveal index={0}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>{kicker}</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            <PressableScale onPress={goProfile} activeScale={0.9} hitSlop={6}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <InitialAvatar name={user?.name ?? 'Employee'} size={48} />
              )}
            </PressableScale>
          </View>
        </Reveal>

        {/* Stats card */}
        <Reveal index={1}>
          <LinearGradient
            colors={['#1AB996', '#13A07C', '#0C6E57']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardLabel}>{cardLabel}</Text>
              <View style={styles.iconTile}>
                <Ionicons name={icon} size={22} color="#FFD45F" />
              </View>
            </View>

            <Text style={styles.bigNumber}>{withCommas(total)}</Text>
            <Text style={styles.cardSub}>{unit ?? title}</Text>
          </LinearGradient>
        </Reveal>

        {/* History */}
        <Reveal index={2}>
          <Text style={styles.sectionTitle}>History</Text>
        </Reveal>

        {history.length === 0 ? (
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
          <Reveal index={3}>
            <View style={styles.emptyHistory}>
              <Ionicons name="time-outline" size={36} color="#C2C7CF" />
              <Text style={styles.emptyHistoryText}>{emptyText}</Text>
            </View>
          </Reveal>
<<<<<<< HEAD
        }
        ListFooterComponent={
          canLoadMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color="#13A07C" />
            </View>
          ) : null
        }
      />
=======
        ) : (
          history.map((row, i) => {
            const pts = pointsOf(row, valueKey)
            const desc = descOf(row)
            return (
              <Reveal key={row.id ?? i} index={3 + i}>
                <View style={styles.historyRow}>
                  <View style={styles.coin}>
                    <Ionicons name={icon} size={18} color="#13A07C" />
                  </View>
                  <View style={styles.historyText}>
                    <Text style={styles.historyLabel} numberOfLines={1}>
                      {labelOf(row)}
                    </Text>
                    {!!desc && (
                      <Text style={styles.historyDesc} numberOfLines={1}>
                        {desc}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.historyPoints, pts < 0 && styles.historyPointsNeg]}>
                    {withCommas(pts)}
                  </Text>
                </View>
              </Reveal>
            )
          })
        )}
      </ScrollView>
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
    </ScreenContainer>
  )
}

const TEAL = '#13A07C'

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 120 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headerText: { flex: 1 },
  kicker: { fontSize: 13, color: '#9AA1AD', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: '800', color: '#0E1726', marginTop: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5E7EB' },

  // Stats card
  card: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigNumber: { color: '#FFFFFF', fontSize: 46, fontWeight: '800', marginTop: 6, letterSpacing: 0.5 },
  cardSub: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600', marginTop: -2 },

  // History
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1B2233', marginBottom: 14 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  coin: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E7F5EF', alignItems: 'center', justifyContent: 'center' },
  historyText: { flex: 1 },
  historyLabel: { fontSize: 15, fontWeight: '700', color: '#1B2233' },
  historyDesc: { fontSize: 13, color: '#8A92A0', marginTop: 2 },
  historyPoints: { fontSize: 16, fontWeight: '800', color: TEAL },
  historyPointsNeg: { color: '#EB5C5C' },

  emptyHistory: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  emptyHistoryText: { fontSize: 14, color: '#8A92A0' },
<<<<<<< HEAD

  footer: { paddingVertical: 16, alignItems: 'center' },
})
=======
})
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
