import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, RefreshControl } from 'react-native'
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import {
  ScreenContainer,
  PressableScale,
  Reveal,
  EmptyState,
  Button,
  Skeleton,
  SkeletonCard,
  DashboardHeader,
  CategoryTabs,
  HeroCarousel,
} from '@/components'
import { useTheme } from '@/constants/theme'
import { useAuth } from '@/hooks/useAuth'
import { dashboardService } from '@/api'
import type { DashboardItem, DashboardSection, DashboardTab } from '@/api/types'

/**
 * Sections never rendered on the dashboard: Rewards (REQUIREMENTS item 16) and
 * Careers — its sole item is "Internal Mobility", hidden per feedback #2.
 */
const HIDDEN_SECTIONS = new Set(['rewards', 'careers'])

/** Time-zone-aware greeting from the device's local clock (item 3). */
function greetingForNow(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

/**
 * Dashboard — landing screen after login.
 *
 * All content is API-driven from GET /dashboard/content: `meta.tabs` drives the
 * category chips, `sections` (iterated in tab order) drives the cards. Each
 * section renders as a mobile horizontal pager of large hero cards. The Social
 * section renders as linkable brand-icon rows; Rewards and Careers are hidden.
 * Cards open the type-routed detail screen; external links open in an in-app
 * browser.
 */
export default function DashboardScreen() {
  const { user } = useAuth()
  const { colors, shadows, spacing } = useTheme()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const query = useQuery({
    queryKey: ['dashboard', 'content'],
    queryFn: ({ signal }) => dashboardService.getContent(signal),
    retry: false,
  })

  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const greeting = useMemo(() => greetingForNow(), [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await query.refetch()
    } finally {
      setRefreshing(false)
    }
  }, [query])

  // Auto-hiding sticky tab bar. The greeting + in-flow chips scroll away
  // normally; once the user is scrolled past them (> REVEAL_AFTER) a floating
  // copy of the chips drives off scroll direction: scrolling down pushes it up
  // out of view, scrolling up slides it back down. On release it snaps to fully
  // shown (pinned/fixed) or fully hidden so it never rests half-open.
  const REVEAL_AFTER = 140
  const chipBarHeight = useSharedValue(64) // measured via onLayout
  const chipReveal = useSharedValue(0) // 0 = hidden above, 1 = shown & pinned
  const lastScrollY = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y
      const dy = y - lastScrollY.value
      lastScrollY.value = y
      if (y <= REVEAL_AFTER) {
        chipReveal.value = 0
        return
      }
      const next = chipReveal.value - dy / chipBarHeight.value
      chipReveal.value = next < 0 ? 0 : next > 1 ? 1 : next
    },
    // On release, settle to fully shown (pinned) or fully hidden — never half.
    onEndDrag: () => {
      const target = lastScrollY.value <= REVEAL_AFTER ? 0 : chipReveal.value > 0.5 ? 1 : 0
      chipReveal.value = withTiming(target, { duration: 160 })
    },
    onMomentumEnd: () => {
      const target = lastScrollY.value <= REVEAL_AFTER ? 0 : chipReveal.value > 0.5 ? 1 : 0
      chipReveal.value = withTiming(target, { duration: 160 })
    },
  })

  const chipBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (chipReveal.value - 1) * chipBarHeight.value }],
    opacity: chipReveal.value,
  }))

  const tabs: DashboardTab[] = useMemo(
    () => (query.data?.meta?.tabs ?? []).filter((t) => !HIDDEN_SECTIONS.has(t.key)),
    [query.data]
  )

  // Sections ordered by meta.tabs (excluding "all"); hidden sections removed.
  const orderedSections = useMemo<DashboardSection[]>(() => {
    const sections = query.data?.sections
    if (!sections) return []
    const order = tabs.filter((t) => t.key !== 'all').map((t) => t.key)
    const picked = order
      .map((key) => sections[key])
      .filter((s): s is DashboardSection => !!s)
    const fallback = Object.values(sections).filter((s) => !HIDDEN_SECTIONS.has(s.key))
    return picked.length > 0 ? picked : fallback
  }, [query.data, tabs])

  // Apply the active-tab filter.
  const visibleSections = useMemo<DashboardSection[]>(
    () =>
      activeTab === 'all' ? orderedSections : orderedSections.filter((s) => s.key === activeTab),
    [orderedSections, activeTab]
  )

  const openCard = useCallback(
    (section: DashboardSection, item: DashboardItem) => {
      // 1. External links open in an in-app browser — never the system browser.
      if (item.link_type === 'external') {
        if (item.link) WebBrowser.openBrowserAsync(item.link)
        return
      }
      // 2. API-driven detail screen.
      if (item.detail) {
        router.push({
          pathname: '/(protected)/content/[id]',
          params: {
            id: item.key,
            type: item.detail.type,
            key: item.detail.key ?? '',
            slug: item.detail.slug ?? '',
            detailId: item.detail.id != null ? String(item.detail.id) : '',
            title: item.title,
            image: item.image ?? '',
          },
        })
        return
      }
      // 3. Fallback for an internal link with no detail — open it in-app.
      if (item.link) WebBrowser.openBrowserAsync(item.link)
    },
    [router]
  )

  const Header = (
    <>
      {/* Top bar: left-aligned greeting/title with the profile photo on the right. */}
      <Reveal index={0}>
        <DashboardHeader greeting={greeting} firstName={firstName} />
      </Reveal>

      {/* Category chips (from meta.tabs). */}
      {tabs.length > 0 && (
        <Reveal index={1} direction="fade">
          <CategoryTabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
        </Reveal>
      )}
    </>
  )

  // First-load: skeleton placeholders (item 7).
  if (query.isLoading) {
    return (
      <ScreenContainer edges={['top']}>
        <View style={styles.headerPad}>
          <View style={styles.topBar}>
            <View style={styles.greeting}>
              <Skeleton width={46} height={46} borderRadius={23} />
              <View style={{ marginLeft: 12, gap: 8 }}>
                <Skeleton width={90} height={12} />
                <Skeleton width={130} height={18} />
              </View>
            </View>
          </View>
          <View style={styles.chipsRow}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width={84} height={36} borderRadius={999} />
            ))}
          </View>
          <View style={{ marginTop: 24 }}>
            <Skeleton width={160} height={18} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </View>
      </ScreenContainer>
    )
  }

  // Error: empty state + retry.
  if (query.isError) {
    return (
      <ScreenContainer edges={['top']}>
        <View style={styles.headerPad}>{Header}</View>
        <View style={styles.stateWrap}>
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't load dashboard"
            subtitle="Check your connection and try again."
          />
          <Button variant="outline" title="Retry" onPress={() => query.refetch()} />
        </View>
      </ScreenContainer>
    )
  }

  const hasResults = visibleSections.some((s) => s.items.length > 0)

  return (
    <ScreenContainer edges={['top']}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
      >
        {Header}

        {/* Sections — each a horizontal pager of hero cards. */}
        {(() => {
          let row = 2 // continue the stagger after the header rows
          return visibleSections.map((section) => {
            if (section.items.length === 0) return null
            // Social → linkable brand-icon rows (items 11 / 17).
            if (section.key === 'social') {
              return (
                <Reveal key={section.key} index={row++}>
                  <SocialSection section={section} onPress={(item) => openCard(section, item)} />
                </Reveal>
              )
            }
            return (
              <Reveal key={section.key} index={row++}>
                <HeroCarousel section={section} onPressItem={(item) => openCard(section, item)} />
              </Reveal>
            )
          })
        })()}

        {!hasResults && (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={40} color={colors.text.tertiary} />
            <Text style={[styles.noResultsText, { color: colors.text.secondary }]}>
              Nothing to show here yet.
            </Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* Floating auto-hiding tab bar: hidden at rest, slides up on scroll-down,
          slides back down and pins fixed on scroll-up (see scrollHandler). */}
      {tabs.length > 0 && (
        <Animated.View
          pointerEvents="box-none"
          onLayout={(e) => {
            chipBarHeight.value = e.nativeEvent.layout.height
          }}
          style={[
            styles.floatingChips,
            { backgroundColor: colors.background.primary },
            shadows.md,
            chipBarStyle,
          ]}
        >
          <CategoryTabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
        </Animated.View>
      )}
    </ScreenContainer>
  )
}

/* -------------------------------------------------------------------------- */
/* Social section (items 11 / 17 — brand-icon linkable rows)                  */
/* -------------------------------------------------------------------------- */

const SOCIAL_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  linkedin: { icon: 'logo-linkedin', color: '#0A66C2' },
  facebook: { icon: 'logo-facebook', color: '#1877F2' },
  instagram: { icon: 'logo-instagram', color: '#E1306C' },
  twitter: { icon: 'logo-twitter', color: '#1DA1F2' },
  youtube: { icon: 'logo-youtube', color: '#FF0000' },
}

function socialIconFor(
  title: string,
  brand: string
): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  const key = title.trim().toLowerCase()
  return SOCIAL_ICONS[key] ?? { icon: 'globe-outline', color: brand }
}

const SocialSection: React.FC<{
  section: DashboardSection
  onPress: (item: DashboardItem) => void
}> = ({ section, onPress }) => {
  const { colors, borderRadius } = useTheme()
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{section.title}</Text>
      <View style={{ gap: 12 }}>
        {section.items.map((item) => {
          // Brand-platform glyphs keep their official platform colors (logo
          // identity), which is intentional and not a theme color; the generic
          // fallback uses the app brand token.
          const { icon, color } = socialIconFor(item.title, colors.brand.primary)
          return (
            <PressableScale
              key={item.key}
              onPress={() => onPress(item)}
              activeScale={0.97}
              style={[
                styles.socialRow,
                {
                  borderRadius: borderRadius.base,
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.light,
                },
              ]}
              accessibilityRole="link"
              accessibilityLabel={`Open ${item.title}`}
            >
              <View
                style={[
                  styles.socialIcon,
                  { borderRadius: borderRadius.base, backgroundColor: colors.background.secondary },
                ]}
              >
                <Ionicons name={icon} size={24} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.socialTitle, { color: colors.text.primary }]}>
                  {item.title}
                </Text>
                <Text
                  style={[styles.socialSub, { color: colors.text.secondary }]}
                  numberOfLines={1}
                >
                  Bitpastel on {item.title}
                </Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.text.secondary} />
            </PressableScale>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  headerPad: { paddingHorizontal: 20 },
  stateWrap: { paddingHorizontal: 20, alignItems: 'center', gap: 16 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    marginBottom: 18,
  },
  greeting: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },

  chipsRow: { gap: 8, paddingRight: 8, paddingBottom: 4 },

  // Floating auto-hiding tab bar pinned to the top of the screen.
  floatingChips: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },

  section: { marginTop: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },

  noResults: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, gap: 12 },
  noResultsText: { fontSize: 14, textAlign: 'center' },

  // Social rows
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderWidth: 1,
  },
  socialIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  socialTitle: { fontSize: 15, fontWeight: '700' },
  socialSub: { fontSize: 12, marginTop: 2 },
})
