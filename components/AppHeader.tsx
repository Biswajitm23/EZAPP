import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { PressableScale } from './motion'
import { InitialAvatar } from './InitialAvatar'
import { useAuth } from '@/hooks/useAuth'

const DASHBOARD_ROUTE = '/(protected)/(tabs)/dashboard'
const PROFILE_ROUTE = '/(protected)/(tabs)/profile'

interface AppHeaderProps {
  /** Bold, centered heading. */
  title?: string
  /** Small muted line above the title (also centered). */
  kicker?: string
  /** Show the left-side back button. */
  showBack?: boolean
  /** Override the back action (defaults to router.back(), or Dashboard if there's no history). */
  onBack?: () => void
  /** Show the right-side profile avatar (defaults to true). */
  showProfile?: boolean
  /** Override the avatar tap target (defaults to the Profile tab). */
  onProfilePress?: () => void
  /** Horizontal alignment of the kicker + title. Defaults to 'center'. */
  align?: 'center' | 'left'
}

/**
 * Reusable screen header: a left Back button, a centered title (+ optional
 * kicker), and a right-aligned profile avatar that opens the Profile tab. The
 * side slots are equal width so the title stays optically centered regardless
 * of which controls are present. Used across Dashboard, Detail, Collab Days and
 * Rewards so every screen shares one header treatment.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  kicker,
  showBack = false,
  onBack,
  showProfile = true,
  onProfilePress,
  align = 'center',
}) => {
  const router = useRouter()
  const { user } = useAuth()
  const avatar = user?.profile_image_url
  const isLeft = align === 'left'

  const handleBack =
    onBack ??
    (() => {
      if (router.canGoBack()) router.back()
      else router.replace(DASHBOARD_ROUTE)
    })

  const handleProfile = onProfilePress ?? (() => router.push(PROFILE_ROUTE))

  return (
    <View style={styles.wrap}>
      {/* Left slot — back button. Omitted entirely for left-aligned headers
          with no back button so the title can start at the very left edge. */}
      {(!isLeft || showBack) && (
        <View style={styles.side}>
          {showBack ? (
            <PressableScale style={styles.backBtn} onPress={handleBack} activeScale={0.9} hitSlop={6}>
              <Ionicons name="chevron-back" size={20} color="#1B2233" />
              <Text style={styles.backText}>Back</Text>
            </PressableScale>
          ) : null}
        </View>
      )}

      {/* Center slot — kicker + title */}
      <View style={[styles.center, isLeft && styles.centerLeft]}>
        {kicker ? (
          <Text style={[styles.kicker, isLeft && styles.alignLeft]} numberOfLines={1}>
            {kicker}
          </Text>
        ) : null}
        {title ? (
          <Text style={[styles.title, isLeft && styles.alignLeft]} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>

      {/* Right slot — profile avatar */}
      <View style={[styles.side, styles.sideRight]}>
        {showProfile ? (
          <PressableScale onPress={handleProfile} activeScale={0.9} hitSlop={6}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" transition={200} />
            ) : (
              <InitialAvatar name={user?.name ?? 'Employee'} size={44} />
            )}
          </PressableScale>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    marginBottom: 16,
  },
  // Equal-width side slots keep the title optically centered; wide enough to
  // fit the "‹ Back" pill on the left and the avatar on the right.
  side: { width: 84, justifyContent: 'center' },
  sideRight: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  centerLeft: { alignItems: 'flex-start', paddingHorizontal: 0 },
  alignLeft: { textAlign: 'left' },
  kicker: { fontSize: 13, color: '#9AA1AD', fontWeight: '500', textAlign: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#0E1726', textAlign: 'center', marginTop: 2 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 40,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 20,
    backgroundColor: '#F3F5F9',
    gap: 2,
  },
  backText: { fontSize: 15, fontWeight: '600', color: '#1B2233' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB' },
})
