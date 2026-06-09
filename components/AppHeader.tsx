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
}) => {
  const router = useRouter()
  const { user } = useAuth()
  const avatar = user?.profile_image_url

  const handleBack =
    onBack ??
    (() => {
      if (router.canGoBack()) router.back()
      else router.replace(DASHBOARD_ROUTE)
    })

  const handleProfile = onProfilePress ?? (() => router.push(PROFILE_ROUTE))

  return (
    <View style={styles.wrap}>
      {/* Left slot — back button */}
      <View style={styles.side}>
        {showBack ? (
          <PressableScale style={styles.iconBtn} onPress={handleBack} activeScale={0.9} hitSlop={6}>
            <Ionicons name="chevron-back" size={22} color="#1B2233" />
          </PressableScale>
        ) : null}
      </View>

      {/* Center slot — kicker + title */}
      <View style={styles.center}>
        {kicker ? (
          <Text style={styles.kicker} numberOfLines={1}>
            {kicker}
          </Text>
        ) : null}
        {title ? (
          <Text style={styles.title} numberOfLines={1}>
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
  side: { width: 48, justifyContent: 'center' },
  sideRight: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  kicker: { fontSize: 13, color: '#9AA1AD', fontWeight: '500', textAlign: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: '#0E1726', textAlign: 'center', marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB' },
})
