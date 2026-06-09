import React, { useCallback, useMemo, useState } from 'react'
<<<<<<< HEAD
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import {
  ScreenContainer,
  AppHeader,
  PressableScale,
  Reveal,
  EmptyState,
  Button,
  Skeleton,
  SkeletonCard,
} from '@/components'
import { pastelAt, useTheme, type Pastel } from '@/constants/theme'
import { useAuth } from '@/hooks/useAuth'
import { dashboardService } from '@/api'
import type { DashboardItem, DashboardSection, DashboardTab } from '@/api/types'
=======
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, Linking, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ScreenContainer, InitialAvatar, BrandWordmark, PressableScale, Reveal } from '@/components'
import { pastelAt, type Pastel } from '@/constants/theme'
import { useAuth } from '@/hooks/useAuth'
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43

const BRAND = '#13A07C'

/**
<<<<<<< HEAD
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
  const { isDark, colors } = useTheme()
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

  const themedSub = isDark ? '#9FB0C7' : '#6B7280'

  // Horizontal category chips — rendered both in the in-flow header and in the
  // floating (auto-hiding) bar, so it's a function to get a fresh tree per use.
  const renderChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeTab
        return (
          <PressableScale
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.chip,
              { backgroundColor: isDark ? '#16233A' : '#F2F4F8' },
              active && styles.chipActive,
            ]}
            activeScale={0.93}
          >
            <Text style={[styles.chipText, { color: themedSub }, active && styles.chipTextActive]}>
              {tab.title}
            </Text>
          </PressableScale>
        )
      })}
    </ScrollView>
  )

  const Header = (
    <>
      {/* Top bar: centered greeting/title with the profile photo on the right. */}
      <Reveal index={0}>
        <AppHeader kicker={greeting} title={firstName} />
      </Reveal>

      {/* Category chips (from meta.tabs). */}
      {tabs.length > 0 && (
        <Reveal index={1} direction="fade">
          {renderChips()}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} colors={[BRAND]} />
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
                  <SocialSection
                    section={section}
                    isDark={isDark}
                    onPress={(item) => openCard(section, item)}
                  />
                </Reveal>
              )
            }
            return (
              <Reveal key={section.key} index={row++}>
                <SectionCarousel
                  section={section}
                  isDark={isDark}
                  onPressItem={(item) => openCard(section, item)}
                />
              </Reveal>
            )
          })
        })()}

        {!hasResults && (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={40} color="#C2C7CF" />
            <Text style={[styles.noResultsText, { color: themedSub }]}>
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
            chipBarStyle,
          ]}
        >
          {renderChips()}
        </Animated.View>
      )}
=======
 * Dashboard — landing screen after login.
 *
 * Mirrors the web Employee Zone: a top bar with the bitpastel wordmark, a
 * greeting, a horizontal category filter, and full-width content cards grouped
 * into sections. Cards open a detail/video screen; Social cards open external
 * links. All content is static placeholder data until the API is wired.
 */

type Status = 'view' | 'viewed' | 'pending'
type Card = { title: string; tagline: string; color: string; status: Status }
type Section = { title: string; cards: Card[] }

const SECTIONS: Section[] = [
  {
    title: 'E-Learning Videos',
    cards: [
      { title: 'Induction', tagline: 'Welcome to the Family', color: '#F2994A', status: 'viewed' },
      { title: 'Remote Working', tagline: 'Our Effective Working from Home Culture', color: '#17A2A2', status: 'viewed' },
      { title: 'APDR', tagline: 'Annual Performance & Development Review', color: '#EB5C5C', status: 'viewed' },
    ],
  },
  {
    title: 'Compliance',
    cards: [
      { title: 'Forms', tagline: "Let's Know", color: '#2F80ED', status: 'pending' },
      { title: 'HR Handbook', tagline: 'Our Working Principles', color: '#F2994A', status: 'viewed' },
    ],
  },
  {
    title: 'Careers',
    cards: [{ title: 'Internal Mobility', tagline: 'Internal Mobility', color: '#E2B93B', status: 'view' }],
  },
  {
    title: 'Guidelines',
    cards: [
      { title: 'Instructions for IT Equipment Care', tagline: 'Taking Care of Your Devices', color: '#6FCF97', status: 'view' },
      { title: 'Remote Working Guidelines', tagline: 'Instructions for Effective Remote Working', color: '#F2994A', status: 'view' },
      { title: 'Bitpastel Onboarding', tagline: 'Know More About Us', color: '#9B51E0', status: 'view' },
      { title: 'How to send G-Meet Invite', tagline: 'How to send a Google Meet Invite', color: '#2D9CDB', status: 'view' },
      { title: 'Email Format', tagline: 'Mail Formats', color: '#219653', status: 'viewed' },
      { title: 'Work Status Reporting Guidelines', tagline: 'Work Status Reporting Guidelines', color: '#9B51E0', status: 'view' },
      { title: 'Instructions for sharing files on drive', tagline: 'Instructions for Sharing Files on Drive', color: '#EB5C8E', status: 'viewed' },
      { title: 'Professional Conduct Guidelines', tagline: 'Professional Conduct Guidelines', color: '#2D2D2D', status: 'view' },
      { title: 'Collaboration - Switch', tagline: 'Collaboration - Switch', color: '#0E8F8F', status: 'view' },
    ],
  },
  {
    title: 'Weekly Games',
    cards: [
      { title: 'Weekly Jackpot', tagline: 'Weekly Jackpot (Engineering Team)', color: '#EB5C5C', status: 'view' },
      { title: 'Weekly Lead Magnet', tagline: 'Weekly Lead Magnet (Sales Team)', color: '#6FCF97', status: 'view' },
    ],
  },
  {
    title: 'Rewards',
    cards: [
      { title: 'How To Earn Bitpoints', tagline: 'How to Earn Bitpoints', color: '#5B43C0', status: 'view' },
      { title: 'Employee Referral Bonus', tagline: 'Employee Referral Bonus', color: '#F2994A', status: 'view' },
      { title: 'Bit Store Brochure', tagline: 'Bit Store — Earn Points Get Reward', color: '#2F80ED', status: 'view' },
      { title: 'Bit Store Form', tagline: 'Bit Store — Earn Points Get Reward', color: '#2F80ED', status: 'view' },
    ],
  },
  {
    title: 'Presentations',
    cards: [{ title: 'All Presentations', tagline: 'Presentations', color: '#56CCF2', status: 'view' }],
  },
  {
    title: 'Social',
    cards: [
      { title: 'LinkedIn', tagline: 'LinkedIn', color: '#2D9CDB', status: 'view' },
      { title: 'Instagram', tagline: 'Instagram', color: '#E1306C', status: 'view' },
      { title: 'Facebook', tagline: 'Facebook', color: '#1877F2', status: 'view' },
    ],
  },
]

const SOCIAL_URLS: Record<string, string> = {
  LinkedIn: 'https://www.linkedin.com/company/bitpastel/',
  Instagram: 'https://www.instagram.com/bitpastel/',
  Facebook: 'https://www.facebook.com/bitpastel/',
}

const CATEGORIES = ['All', ...SECTIONS.map((s) => s.title)]

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function DashboardScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Pull-to-refresh. Content is static placeholder for now, so this just shows
  // the spinner briefly — swap the timeout for the dashboard query's refetch
  // once that API is wired.
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 900)
  }, [])

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const visibleSections = useMemo(() => {
    const byCategory =
      activeCategory === 'All' ? SECTIONS : SECTIONS.filter((s) => s.title === activeCategory)
    const q = search.trim().toLowerCase()
    if (!q) return byCategory
    return byCategory
      .map((s) => ({
        ...s,
        cards: s.cards.filter(
          (c) => c.title.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.cards.length > 0)
  }, [activeCategory, search])

  const openCard = (sectionTitle: string, card: Card, pastel: Pastel) => {
    if (sectionTitle === 'Social') {
      Linking.openURL(SOCIAL_URLS[card.title] ?? 'https://www.bitpastel.com')
      return
    }
    router.push({
      pathname: '/(protected)/content/[id]',
      params: { id: slugify(card.title), title: card.title, tagline: card.tagline, color: pastel.accent },
    })
  }

  return (
    <ScreenContainer edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#13A07C" colors={['#13A07C']} />
        }
      >
        {/* Top bar with brand wordmark */}
        <Reveal index={0} style={styles.topBar}>
          <BrandWordmark size={22} />
          <PressableScale style={styles.menuBtn} hitSlop={8} activeScale={0.88}>
            <Ionicons name="notifications-outline" size={22} color={BRAND} />
          </PressableScale>
        </Reveal>

        {/* Greeting */}
        <Reveal index={1} style={styles.greeting}>
          <InitialAvatar name={user?.name ?? 'Employee'} size={44} />
          <View style={styles.greetingText}>
            <Text style={styles.hello}>Hello 👋</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
        </Reveal>

        {/* Search */}
        <Reveal index={2} style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9AA1AD" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search for a resource"
            placeholderTextColor="#9AA1AD"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#C2C7CF" />
            </Pressable>
          )}
        </Reveal>

        {/* Category chips */}
        <Reveal index={3} direction="fade">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {CATEGORIES.map((cat) => {
              const active = cat === activeCategory
              return (
                <PressableScale
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[styles.chip, active && styles.chipActive]}
                  activeScale={0.93}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
                </PressableScale>
              )
            })}
          </ScrollView>
        </Reveal>

        {/* Sections */}
        {(() => {
          let row = 4 // continue the stagger after the 4 header rows
          return visibleSections.map((section) => (
            <View key={section.title}>
              <Reveal index={row++}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </Reveal>
              {section.cards.map((card, ci) => {
                const pastel = pastelAt(ci)
                return (
                  <Reveal key={card.title} index={row++}>
                    <ContentCard
                      card={card}
                      pastel={pastel}
                      onPress={() => openCard(section.title, card, pastel)}
                    />
                  </Reveal>
                )
              })}
            </View>
          ))
        })()}

        {visibleSections.length === 0 && (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={40} color="#C2C7CF" />
            <Text style={styles.noResultsText}>No resources match “{search.trim()}”.</Text>
          </View>
        )}
      </ScrollView>
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
    </ScreenContainer>
  )
}

<<<<<<< HEAD
/* -------------------------------------------------------------------------- */
/* Card state                                                                 */
/* -------------------------------------------------------------------------- */

/** Derive the status button label + done-state for a card. */
function cardState(item: DashboardItem): { label: string; subline?: string; done: boolean } {
  // Compliance "Forms" card: status + submitted/total counts.
  if (item.status || item.total_forms != null || item.submitted_forms != null) {
    const submitted = item.submitted_forms ?? 0
    const total = item.total_forms ?? 0
    const done = item.status === 'Submitted'
    return {
      label: item.status ?? (done ? 'Submitted' : 'Pending'),
      subline: total > 0 ? `${submitted} / ${total} submitted` : undefined,
      done,
    }
  }
  if (item.viewed === true) return { label: item.label || 'Viewed', done: true }
  return { label: item.label || 'View', done: false }
}

/* -------------------------------------------------------------------------- */
/* Section carousel (mobile horizontal pager)                                 */
/* -------------------------------------------------------------------------- */

const SectionCarousel: React.FC<{
  section: DashboardSection
  isDark: boolean
  onPressItem: (item: DashboardItem) => void
}> = ({ section, isDark, onPressItem }) => {
  const { width } = useWindowDimensions()
  // Coverflow geometry: the active card is narrower than the screen so the
  // neighbours peek on both sides. The snap interval (card + gap) also drives
  // the per-card transform interpolation, and the symmetric side padding keeps
  // the active card centered.
  const cardWidth = Math.round(width * 0.78)
  const gap = 16
  const snap = cardWidth + gap
  const sidePad = (width - cardWidth) / 2
  const [page, setPage] = useState(0)
  const isPresentation = section.key === 'presentations'

  // Live scroll offset (UI thread) drives the coverflow transforms.
  const scrollX = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x
    },
  })

  // Dot sync stays on the JS thread off the momentum-settled offset.
  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setPage(Math.round(e.nativeEvent.contentOffset.x / snap))
    },
    [snap]
  )

  const themedText = isDark ? '#FFFFFF' : '#1B2233'

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: themedText }]}>{section.title}</Text>

      {section.items.length === 1 ? (
        <View style={{ width: cardWidth, alignSelf: 'center' }}>
          {isPresentation ? (
            <PresentationCard
              item={section.items[0]}
              isDark={isDark}
              onPress={() => onPressItem(section.items[0])}
            />
          ) : (
            <HeroCard
              item={section.items[0]}
              pastel={pastelAt(0)}
              isDark={isDark}
              onPress={() => onPressItem(section.items[0])}
            />
          )}
        </View>
      ) : (
        <>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={snap}
            snapToAlignment="start"
            disableIntervalMomentum
            onScroll={scrollHandler}
            onMomentumScrollEnd={onMomentumEnd}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: sidePad }}
          >
            {section.items.map((item, ci) => (
              <CoverflowCard
                key={item.key}
                index={ci}
                scrollX={scrollX}
                snap={snap}
                cardWidth={cardWidth}
                gap={gap}
                isLast={ci === section.items.length - 1}
              >
                {isPresentation ? (
                  <PresentationCard item={item} isDark={isDark} onPress={() => onPressItem(item)} />
                ) : (
                  <HeroCard
                    item={item}
                    pastel={pastelAt(ci)}
                    isDark={isDark}
                    onPress={() => onPressItem(item)}
                  />
                )}
              </CoverflowCard>
            ))}
          </Animated.ScrollView>

          {/* Paging dots. */}
          <View style={styles.dots}>
            {section.items.map((it, i) => (
              <View
                key={it.key}
                style={[styles.dot, i === page ? styles.dotActive : { backgroundColor: isDark ? '#33425C' : '#D5DBE3' }]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  )
}

/**
 * Per-card coverflow wrapper. Interpolates scale / horizontal pull-in / opacity
 * from the live scroll offset so the centered card sits large and opaque while
 * neighbours shrink, fade and slide slightly behind it (the stacked look).
 */
const CoverflowCard: React.FC<{
  index: number
  scrollX: ReturnType<typeof useSharedValue<number>>
  snap: number
  cardWidth: number
  gap: number
  isLast: boolean
  children: React.ReactNode
}> = ({ index, scrollX, snap, cardWidth, gap, isLast, children }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * snap, index * snap, (index + 1) * snap]
    const scale = interpolate(scrollX.value, inputRange, [0.86, 1, 0.86], Extrapolation.CLAMP)
    const opacity = interpolate(scrollX.value, inputRange, [0.55, 1, 0.55], Extrapolation.CLAMP)
    // Pull neighbours toward the active card so they peek/stack behind it.
    const translateX = interpolate(scrollX.value, inputRange, [22, 0, -22], Extrapolation.CLAMP)
    return { opacity, transform: [{ scale }, { translateX }] }
  })

  return (
    <Animated.View
      style={[{ width: cardWidth, marginRight: isLast ? 0 : gap }, animatedStyle]}
    >
      {children}
    </Animated.View>
  )
}

/* -------------------------------------------------------------------------- */
/* Hero card (DashboardListDesign.png)                                        */
/* -------------------------------------------------------------------------- */

const HeroCard: React.FC<{
  item: DashboardItem
  pastel: Pastel
  isDark: boolean
  onPress: () => void
}> = ({ item, pastel, isDark, onPress }) => {
  const { label, subline, done } = cardState(item)
  return (
    <PressableScale style={styles.hero} onPress={onPress} activeScale={0.97}>
      <View style={[styles.heroImageWrap, { backgroundColor: pastel.bg }]}>
        {item.image ? (
          <Image style={StyleSheet.absoluteFill} source={{ uri: item.image }} contentFit="cover" transition={250} />
        ) : (
          <Text style={[styles.heroFallback, { color: pastel.accent }]} numberOfLines={2}>
            {item.title}
          </Text>
        )}
        {/* Bottom gradient scrim + overlaid title/status to match the reference. */}
        <View style={styles.heroScrim} />
        <View style={styles.heroOverlay}>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {subline ? <Text style={styles.heroSub} numberOfLines={1}>{subline}</Text> : null}
          </View>
          <View style={[styles.statusBtn, done ? styles.statusViewed : styles.statusActive]}>
            <Text style={[styles.statusText, done && styles.statusTextViewed]}>{label}</Text>
          </View>
=======
const ContentCard: React.FC<{ card: Card; pastel: Pastel; onPress: () => void }> = ({ card, pastel, onPress }) => {
  const viewed = card.status === 'viewed'
  const label = card.status === 'pending' ? 'Pending' : card.status === 'viewed' ? 'Viewed' : 'View'
  return (
    <PressableScale style={styles.card} onPress={onPress} activeScale={0.97}>
      <View style={[styles.cardHero, { backgroundColor: pastel.bg }]}>
        <Text style={[styles.cardTagline, { color: pastel.accent }]} numberOfLines={2}>
          {card.tagline}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {card.title}
        </Text>
        <View style={[styles.cardButton, viewed ? styles.btnViewed : styles.btnActive]}>
          <Text style={[styles.cardButtonText, viewed && styles.cardButtonTextViewed]}>{label}</Text>
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
        </View>
      </View>
    </PressableScale>
  )
}

<<<<<<< HEAD
/* -------------------------------------------------------------------------- */
/* Presentation card (item 18 — distinct, polished treatment)                 */
/* -------------------------------------------------------------------------- */

const PresentationCard: React.FC<{ item: DashboardItem; isDark: boolean; onPress: () => void }> = ({
  item,
  isDark,
  onPress,
}) => {
  return (
    <PressableScale style={styles.presCard} onPress={onPress} activeScale={0.97}>
      <View style={styles.presImageWrap}>
        {item.image ? (
          <Image style={StyleSheet.absoluteFill} source={{ uri: item.image }} contentFit="cover" transition={250} />
        ) : null}
        <View style={styles.presScrim} />
        <View style={styles.presBadge}>
          <Ionicons name="albums" size={14} color="#FFFFFF" />
          <Text style={styles.presBadgeText}>Presentations</Text>
        </View>
      </View>
      <View style={[styles.presBody, { backgroundColor: isDark ? '#0F1A2C' : '#FFFFFF' }]}>
        <View style={styles.presIconChip}>
          <Ionicons name="easel-outline" size={20} color={BRAND} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.presTitle, { color: isDark ? '#FFFFFF' : '#1B2233' }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.presSub, { color: isDark ? '#9FB0C7' : '#8A92A0' }]} numberOfLines={1}>
            Browse all topics &amp; slide decks
          </Text>
        </View>
        <View style={styles.presCta}>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </View>
      </View>
    </PressableScale>
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

function socialIconFor(title: string): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  const key = title.trim().toLowerCase()
  return SOCIAL_ICONS[key] ?? { icon: 'globe-outline', color: BRAND }
}

const SocialSection: React.FC<{
  section: DashboardSection
  isDark: boolean
  onPress: (item: DashboardItem) => void
}> = ({ section, isDark, onPress }) => {
  const themedText = isDark ? '#FFFFFF' : '#1B2233'
  const themedSub = isDark ? '#9FB0C7' : '#8A92A0'
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: themedText }]}>{section.title}</Text>
      <View style={{ gap: 12 }}>
        {section.items.map((item) => {
          const { icon, color } = socialIconFor(item.title)
          return (
            <PressableScale
              key={item.key}
              onPress={() => onPress(item)}
              activeScale={0.97}
              style={[
                styles.socialRow,
                {
                  backgroundColor: isDark ? '#0F1A2C' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(148,163,184,0.16)' : '#F0F2F5',
                },
              ]}
              accessibilityRole="link"
              accessibilityLabel={`Open ${item.title}`}
            >
              <View style={[styles.socialIcon, { backgroundColor: `${color}1A` }]}>
                <Ionicons name={icon} size={24} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.socialTitle, { color: themedText }]}>{item.title}</Text>
                <Text style={[styles.socialSub, { color: themedSub }]} numberOfLines={1}>
                  Bitpastel on {item.title}
                </Text>
              </View>
              <Ionicons name="open-outline" size={18} color={themedSub} />
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
=======
const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 110 },
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
<<<<<<< HEAD
    marginBottom: 18,
  },
  greeting: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  greetingText: { marginLeft: 12, flex: 1 },
  hello: { fontSize: 13 },
  name: { fontSize: 20, fontWeight: '700', marginTop: 1 },

  chipsRow: { gap: 8, paddingRight: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999 },
  chipActive: { backgroundColor: BRAND },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },

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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },

  section: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 24, marginBottom: 16 },

  noResults: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, gap: 12 },
  noResultsText: { fontSize: 14, textAlign: 'center' },

  // Hero card
  hero: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
  heroImageWrap: { aspectRatio: 16 / 11, justifyContent: 'flex-end', overflow: 'hidden' },
  heroFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 20,
    fontSize: 20,
    fontWeight: '700',
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    top: '55%',
    backgroundColor: 'rgba(8, 18, 28, 0.55)',
  },
  heroOverlay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  heroTextCol: { flex: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 3, fontWeight: '600' },
  statusBtn: { minWidth: 84, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  statusActive: { backgroundColor: BRAND },
  statusViewed: { backgroundColor: 'rgba(255,255,255,0.9)' },
  statusText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  statusTextViewed: { color: '#1B2233' },

  // Paging dots
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotActive: { width: 18, backgroundColor: BRAND },

  // Presentation card
  presCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 5,
  },
  presImageWrap: { height: 150, backgroundColor: '#0E7A60', justifyContent: 'flex-start' },
  presScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14, 122, 96, 0.32)' },
  presBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    margin: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  presBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  presBody: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  presIconChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E7F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presTitle: { fontSize: 16, fontWeight: '700' },
  presSub: { fontSize: 12, marginTop: 2 },
  presCta: { width: 38, height: 38, borderRadius: 19, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },

  // Social rows
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  socialIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  socialTitle: { fontSize: 15, fontWeight: '700' },
  socialSub: { fontSize: 12, marginTop: 2 },
=======
    marginBottom: 16,
  },
  menuBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E7F5EF', alignItems: 'center', justifyContent: 'center' },

  greeting: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  greetingText: { marginLeft: 12 },
  hello: { fontSize: 13, color: '#6B7280' },
  name: { fontSize: 20, fontWeight: '700', color: '#1B2233', marginTop: 1 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDEFF3',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1B2233', paddingVertical: 0 },

  chipsRow: { gap: 8, paddingRight: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: '#F2F4F8' },
  chipActive: { backgroundColor: BRAND },
  chipText: { fontSize: 13, fontWeight: '600', color: '#5B6472' },
  chipTextActive: { color: '#FFFFFF' },

  noResults: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, gap: 12 },
  noResultsText: { fontSize: 14, color: '#8A92A0', textAlign: 'center' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1B2233', textAlign: 'center', marginTop: 24, marginBottom: 16 },

  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F2F5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHero: { minHeight: 120, paddingHorizontal: 20, justifyContent: 'center' },
  cardTagline: { fontSize: 18, fontWeight: '700', lineHeight: 24, maxWidth: '85%' },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1B2233' },
  cardButton: { minWidth: 96, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  btnActive: { backgroundColor: BRAND },
  btnViewed: { backgroundColor: '#EDEFF3' },
  cardButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  cardButtonTextViewed: { color: '#8A92A0' },
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
})
