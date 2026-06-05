import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, Linking, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ScreenContainer, InitialAvatar, BrandWordmark, PressableScale, Reveal } from '@/components'
import { pastelAt, type Pastel } from '@/constants/theme'
import { useAuth } from '@/hooks/useAuth'

const BRAND = '#13A07C'

/**
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
    </ScreenContainer>
  )
}

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
        </View>
      </View>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 110 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
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
})
