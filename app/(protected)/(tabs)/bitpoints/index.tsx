<<<<<<< HEAD
import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { ScreenContainer, AppHeader, EmptyState, Skeleton, Reveal } from '@/components'
import { collaborationService } from '@/api'
import type { CollaborationDay } from '@/api/types'

/* -------------------------------------------------------------------------- */
/* Collab Days — repurposed bitpoints/ route (path unchanged per AI_CONTRACT). */
/*                                                                            */
/* A brand-green hero card shows the next applicable collaboration day, with   */
/* the full month list below it. After 11:00 AM IST on a collab day the hero   */
/* rolls over to the following day. Data: GET /collaboration (TanStack Query). */
/* -------------------------------------------------------------------------- */

const BRAND = '#13A07C'
const PAGE_SIZE = 10

/** Today's date in IST (UTC+5:30) as a "YYYY-MM-DD" string + hour-of-day. */
function istNow(): { dateStr: string; hour: number } {
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000 // +05:30
  const ist = new Date(Date.now() + IST_OFFSET_MS)
  // Use UTC getters: we've already shifted the epoch into IST wall-clock.
  const y = ist.getUTCFullYear()
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0')
  const d = String(ist.getUTCDate()).padStart(2, '0')
  return { dateStr: `${y}-${m}-${d}`, hour: ist.getUTCHours() }
}

/**
 * Pick the index of the day the hero card should highlight.
 *
 * Default = the next collab day whose date is today or later. On a collab day,
 * once it's past 11:00 AM IST that day is considered "done", so we roll the
 * hero over to the next day in the list. Returns -1 when no upcoming day.
 */
function pickActiveIndex(days: CollaborationDay[]): number {
  if (!days.length) return -1
  const { dateStr, hour } = istNow()
  for (let i = 0; i < days.length; i++) {
    const d = days[i].date
    if (d > dateStr) return i
    if (d === dateStr) {
      // Today is a collab day: keep it until 11:00 AM IST, then roll over.
      if (hour < 11) return i
      return i + 1 < days.length ? i + 1 : -1
    }
  }
  return -1
}

/** "2026-06-10" -> "Wed, 10 Jun 2026" (Hermes-safe, no Intl). */
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function prettyDate(iso: string, weekday?: string): string {
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  const mi = parseInt(m, 10) - 1
  const mon = mi >= 0 && mi < 12 ? MONTHS_SHORT[mi] : m
  const wk = weekday ? `${weekday}, ` : ''
  return `${wk}${parseInt(d, 10)} ${mon} ${y}`
}

/** Whole-screen skeleton matching the hero card + list layout. */
function CollabSkeleton() {
  return (
    <View style={styles.scroll}>
      <Skeleton width="55%" height={26} style={{ marginBottom: 6 }} />
      <Skeleton width="35%" height={14} style={{ marginBottom: 20 }} />
      <Skeleton height={150} borderRadius={24} style={{ marginBottom: 24 }} />
      <Skeleton width="40%" height={18} style={{ marginBottom: 16 }} />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} height={72} borderRadius={16} style={{ marginBottom: 12 }} />
      ))}
    </View>
  )
}

export default function CollabDaysScreen() {
  const query = useQuery({
    queryKey: ['collaboration'],
    queryFn: ({ signal }) => collaborationService.getCollaboration(undefined, signal),
    retry: false,
  })

  // How many list rows are visible (infinite scroll grows this in PAGE_SIZE steps).
  const [visible, setVisible] = useState(PAGE_SIZE)

  const days = useMemo<CollaborationDay[]>(() => query.data?.days ?? [], [query.data])
  const activeIndex = useMemo(() => pickActiveIndex(days), [days])
  const heroDay = activeIndex >= 0 ? days[activeIndex] : undefined
  const pagedDays = useMemo(() => days.slice(0, visible), [days, visible])
  const canLoadMore = visible < days.length

  const onEndReached = useCallback(() => {
    setVisible((v) => (v < days.length ? Math.min(v + PAGE_SIZE, days.length) : v))
  }, [days.length])

  const onRefresh = useCallback(() => {
    setVisible(PAGE_SIZE)
    query.refetch()
  }, [query])

  /* ------------------------------- Loading ------------------------------- */
  if (query.isLoading) {
    return (
      <ScreenContainer edges={['top']}>
        <CollabSkeleton />
      </ScreenContainer>
    )
  }

  /* -------------------------------- Error -------------------------------- */
  if (query.isError) {
    return (
      <ScreenContainer edges={['top']}>
        <EmptyState
          icon="calendar-outline"
          title="Couldn't load Collab Days"
          subtitle="Something went wrong while loading the collaboration matrix. Pull down to retry."
        />
      </ScreenContainer>
    )
  }

  /* ------------------ Empty state (no matrix uploaded yet) ---------------- */
  if (query.data && (query.data.available === false || days.length === 0)) {
    return (
      <ScreenContainer edges={['top']}>
        <FlatList
          data={[]}
          renderItem={null}
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={onRefresh} tintColor={BRAND} colors={[BRAND]} />
          }
          ListHeaderComponent={<AppHeader showBack kicker="Office Collaboration" title="Collab Days" />}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No Collab Days yet"
              subtitle="The collaboration matrix for this period hasn't been published. Check back soon."
            />
          }
        />
      </ScreenContainer>
    )
  }

  /* ------------------------------- Content ------------------------------- */
  const renderHeader = () => (
    <>
      <Reveal index={0}>
        <AppHeader showBack kicker="Office Collaboration" title="Collab Days" />
        {!!query.data?.title && <Text style={styles.subtitle}>{query.data.title}</Text>}
      </Reveal>

      {/* Hero card — the next applicable collab day. */}
      <Reveal index={1}>
        <LinearGradient
          colors={['#1AB996', '#13A07C', '#0C6E57']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>{heroDay ? 'Your Next Collab Day' : 'Upcoming Collab Day'}</Text>
            <View style={styles.iconTile}>
              <Ionicons name="calendar" size={22} color="#FFD45F" />
            </View>
          </View>

          {heroDay ? (
            <>
              <Text style={styles.heroDate}>{prettyDate(heroDay.date, heroDay.weekday)}</Text>
              <Text style={styles.heroStatus}>{heroDay.status}</Text>
              <View style={styles.heroMetaRow}>
                <View style={styles.heroMeta}>
                  <Ionicons name="business-outline" size={15} color="#EAFBF4" />
                  <Text style={styles.heroMetaText}>{heroDay.room}</Text>
                </View>
                <View style={styles.heroMeta}>
                  <Ionicons name="people-outline" size={15} color="#EAFBF4" />
                  <Text style={styles.heroMetaText}>{heroDay.ws} on site</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.heroDate}>All caught up</Text>
              <Text style={styles.heroStatus}>No further collab days this period.</Text>
            </>
          )}
        </LinearGradient>
      </Reveal>

      <Reveal index={2}>
        <View style={styles.listHead}>
          <Text style={styles.sectionTitle}>All Collab Days</Text>
          {query.data?.total_office_days != null && (
            <Text style={styles.countPill}>{query.data.total_office_days} days</Text>
          )}
        </View>
      </Reveal>
    </>
  )

  const renderItem = ({ item, index }: { item: CollaborationDay; index: number }) => {
    const isActive = activeIndex >= 0 && days[activeIndex]?.date === item.date
    const parts = item.date.split('-')
    const dayNum = parts.length === 3 ? parseInt(parts[2], 10) : item.date
    return (
      <Reveal index={Math.min(index, 6)}>
        <View style={[styles.row, isActive && styles.rowActive]}>
          <View style={[styles.dateChip, isActive && styles.dateChipActive]}>
            <Text style={[styles.dateChipDay, isActive && styles.dateChipDayActive]}>{dayNum}</Text>
            <Text style={[styles.dateChipWk, isActive && styles.dateChipWkActive]}>{item.weekday}</Text>
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowStatus} numberOfLines={1}>
              {item.status}
            </Text>
            <View style={styles.rowMetaRow}>
              <Ionicons name="business-outline" size={13} color="#8A92A0" />
              <Text style={styles.rowMeta}>{item.room}</Text>
              <Ionicons name="people-outline" size={13} color="#8A92A0" style={{ marginLeft: 10 }} />
              <Text style={styles.rowMeta}>{item.ws}</Text>
            </View>
          </View>
          {isActive && <View style={styles.activeDot} />}
        </View>
      </Reveal>
    )
  }

  return (
    <ScreenContainer edges={['top']}>
      <FlatList
        data={pagedDays}
        keyExtractor={(item) => item.date}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={onRefresh} tintColor={BRAND} colors={[BRAND]} />
        }
        ListFooterComponent={
          canLoadMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={BRAND} />
            </View>
          ) : null
        }
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 120 },
  emptyScroll: { padding: 20, flexGrow: 1 },

  // Header
  header: { marginBottom: 18 },
  kicker: { fontSize: 13, color: '#9AA1AD', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: '800', color: '#0E1726', marginTop: 2 },
  subtitle: { fontSize: 13, color: '#8A92A0', textAlign: 'center', marginTop: -8, marginBottom: 12 },

  // Hero card
  heroCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDate: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 10, letterSpacing: 0.3 },
  heroStatus: { color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: '600', marginTop: 4 },
  heroMetaRow: { flexDirection: 'row', gap: 18, marginTop: 16 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaText: { color: '#EAFBF4', fontSize: 13, fontWeight: '600' },

  // List head
  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1B2233' },
  countPill: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND,
    backgroundColor: '#E7F5EF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },

  // Day row
  row: {
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
  rowActive: { borderColor: BRAND, borderWidth: 1.5, backgroundColor: '#F3FBF8' },
  dateChip: {
    width: 48,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#E7F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipActive: { backgroundColor: BRAND },
  dateChipDay: { fontSize: 18, fontWeight: '800', color: BRAND },
  dateChipDayActive: { color: '#FFFFFF' },
  dateChipWk: { fontSize: 11, fontWeight: '600', color: '#5FA98E', marginTop: 1 },
  dateChipWkActive: { color: '#EAFBF4' },
  rowBody: { flex: 1 },
  rowStatus: { fontSize: 15, fontWeight: '700', color: '#1B2233' },
  rowMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  rowMeta: { fontSize: 13, color: '#8A92A0', marginLeft: 4 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND },

  footer: { paddingVertical: 16, alignItems: 'center' },
})
=======
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { RewardsView } from '@/components'
import { bitpointsService } from '@/api'

/**
 * Bitpoints — the employee's Bitpoints balance + full history.
 *
 * Live data from GET /bitpoints (Bearer, newest-first). No static/fallback data.
 * Presentation is the shared {@link RewardsView}; the star icon matches the
 * Bitpoints bottom-nav tab.
 */
export default function BitpointsScreen() {
  const query = useQuery({
    queryKey: ['bitpoints'],
    queryFn: ({ signal }) => bitpointsService.getBitpoints(signal),
    retry: false,
  })

  return (
    <RewardsView
      kicker="Rewards & Recognition"
      title="BitPoints"
      cardLabel="Current Points"
      unit="BitPoints"
      icon="star"
      valueKey="cumulative_cash_via_bitpoints"
      rows={query.data?.bitpoints ?? []}
      isLoading={query.isLoading}
      isError={query.isError}
      onRetry={query.refetch}
      onRefresh={query.refetch}
      refreshing={query.isRefetching}
      errorTitle="Couldn't load Bitpoints"
      emptyText="No Bitpoints history yet."
    />
  )
}
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
