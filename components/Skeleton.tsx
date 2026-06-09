import React, { useEffect } from 'react'
import { StyleSheet, View, ViewStyle, StyleProp, DimensionValue } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated'
import { useTheme } from '@/constants/theme'

interface SkeletonProps {
  width?: DimensionValue
  height?: DimensionValue
  borderRadius?: number
  style?: StyleProp<ViewStyle>
}

/**
 * A single shimmering placeholder block.
 *
 * Used to compose loading skeletons that mirror real content layout (cards,
 * avatars, text lines) instead of a bare spinner. The shimmer sweep runs on the
 * UI thread via Reanimated and adapts to the active light/dark theme.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 16, borderRadius = 8, style }) => {
  const { isDark } = useTheme()
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, false)
  }, [progress])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.45, 1, 0.45]),
  }))

  const base = isDark ? '#1B2942' : '#E9ECF2'

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: base }, animatedStyle, style]}
    />
  )
}

/** Pre-composed card skeleton matching the dashboard hero-card layout. */
export const SkeletonCard: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  const { isDark } = useTheme()
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? '#0F1A2C' : '#FFFFFF', borderColor: isDark ? 'rgba(148,163,184,0.16)' : '#F0F2F5' },
        style,
      ]}
    >
      <Skeleton height={170} borderRadius={0} />
      <View style={styles.cardBody}>
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="40%" height={12} />
        </View>
        <Skeleton width={88} height={36} borderRadius={999} />
      </View>
    </View>
  )
}

/** A single list-row skeleton: leading tile + two text lines + trailing value. */
export const SkeletonRow: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  const { isDark } = useTheme()
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: isDark ? '#0F1A2C' : '#FFFFFF', borderColor: isDark ? 'rgba(148,163,184,0.16)' : '#F0F2F5' },
        style,
      ]}
    >
      <Skeleton width={40} height={40} borderRadius={12} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="55%" height={14} />
        <Skeleton width="35%" height={11} />
      </View>
      <Skeleton width={48} height={16} />
    </View>
  )
}

/**
 * Full content-detail skeleton mirroring the detail screens' chrome: a back row,
 * a title line, a 16:9 (or tall) media block, then a couple of text lines and a
 * CTA-shaped block. Used by content/[id] while the detail query is in flight.
 */
export const SkeletonDetail: React.FC<{ tallMedia?: boolean }> = ({ tallMedia = false }) => (
  <View style={styles.detail}>
    <Skeleton width={64} height={18} style={{ marginBottom: 18 }} />
    <Skeleton width="65%" height={26} style={{ marginBottom: 18 }} />
    <Skeleton height={tallMedia ? 320 : 200} borderRadius={12} style={{ marginBottom: 18 }} />
    <Skeleton width="40%" height={14} style={{ marginBottom: 12 }} />
    <Skeleton width="90%" height={12} style={{ marginBottom: 8 }} />
    <Skeleton width="80%" height={12} style={{ marginBottom: 24 }} />
    <Skeleton height={56} borderRadius={16} />
  </View>
)

/**
 * Profile-screen skeleton: centered avatar + identity, then three info cards of
 * stacked rows. Mirrors the profile layout so the swap from skeleton to content
 * has no visual jump.
 */
export const SkeletonProfile: React.FC = () => {
  const { isDark } = useTheme()
  const cardBg = isDark ? '#0F1A2C' : '#FFFFFF'
  const cardBorder = isDark ? 'rgba(148,163,184,0.16)' : '#F0F2F5'
  return (
    <View style={styles.detail}>
      <View style={styles.profileIdentity}>
        <Skeleton width={120} height={120} borderRadius={60} style={{ marginBottom: 14 }} />
        <Skeleton width={160} height={20} style={{ marginBottom: 8 }} />
        <Skeleton width={110} height={13} style={{ marginBottom: 16 }} />
        <Skeleton width={220} height={48} borderRadius={30} />
      </View>
      {[0, 1, 2].map((c) => (
        <View key={c} style={[styles.profileCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Skeleton width="45%" height={16} style={{ marginBottom: 14 }} />
          {[0, 1, 2].map((r) => (
            <View key={r} style={styles.profileInfoRow}>
              <Skeleton width={40} height={40} borderRadius={12} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="35%" height={11} />
                <Skeleton width="60%" height={14} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  detail: { padding: 20 },
  profileIdentity: { alignItems: 'center', marginTop: 6, marginBottom: 22 },
  profileCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  profileInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
})
