import React, { useCallback, useEffect, useRef } from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import * as SplashScreen from 'expo-splash-screen'
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useAppDispatch } from '@/provider/hooks'
import { setAuthDetails } from '@/provider/slices/authSlice'
import { getAuth } from '@/helpers/auth'

const AppLogo = require('../assets/images/app-icon.png')

// Keep the native splash up until the JS splash's first frame is painted, so the
// user never sees a blank white frame on cold start (the native splash, configured
// in app.json with this same icon + brand background, hands off seamlessly).
SplashScreen.preventAutoHideAsync().catch(() => {})

// Brand backdrop — matches the login screen + the native splash background.
const BACKDROP = ['#13A07C', '#16928C', '#2E6FB5'] as const

/** How long the bubble logo plays before fading out and routing on. */
const SPLASH_DURATION_MS = 2600

/**
 * App entry — animated splash + auth gate.
 *
 * Plays on every cold open: the Employee Zone app icon "bubbles" in (pop/scale)
 * centered on the brand backdrop, breathes/floats for ~SPLASH_DURATION_MS, then
 * fades/scales out before routing on. No wordmark, no text — just the icon.
 *
 * Meanwhile it restores any persisted session and picks the destination:
 *   signed in -> dashboard · otherwise -> login
 */
export default function Index() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const insets = useSafeAreaInsets()

  const targetRef = useRef<string>('/login')
  const navigatedRef = useRef(false)

  // Bubble entrance + idle float + exit.
  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)
  const float = useSharedValue(0)
  const ring = useSharedValue(0)
  const ringVisible = useSharedValue(1)

  // Restore session + decide where to go (runs in parallel with the animation).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const stored = await getAuth()
      if (cancelled) return
      if (stored?.accessToken) {
        dispatch(
          setAuthDetails({
            token: { accessToken: stored.accessToken, refreshToken: stored.refreshToken ?? '' },
            isAuthenticated: true,
            sessionExpired: false,
            user: stored.user,
          })
        )
        targetRef.current = '/(protected)/(tabs)/dashboard'
      } else {
        targetRef.current = '/login'
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dispatch])

  const go = useCallback(() => {
    if (navigatedRef.current) return
    navigatedRef.current = true
    router.replace(targetRef.current as any)
  }, [router])

  // Animation timeline — runs once on mount.
  useEffect(() => {
    // Entrance: bubble pop.
    opacity.value = withTiming(1, { duration: 380 })
    scale.value = withSequence(
      withSpring(1.12, { stiffness: 170, damping: 11, mass: 0.9 }),
      withSpring(1, { stiffness: 150, damping: 14 })
    )

    // Idle: gentle float + a breathing ring.
    float.value = withDelay(
      650,
      withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })), -1, true)
    )
    ring.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 1500 })),
      -1,
      false
    )

    // Exit: stop idle motion and fade/scale the bubble out before routing.
    const t = setTimeout(() => {
      cancelAnimation(float)
      cancelAnimation(ring)
      float.value = withTiming(0, { duration: 250 })
      ringVisible.value = withTiming(0, { duration: 220 })
      opacity.value = withTiming(0, { duration: 420, easing: Easing.in(Easing.cubic) })
      scale.value = withTiming(1.25, { duration: 420, easing: Easing.in(Easing.cubic) })
    }, SPLASH_DURATION_MS)

    const navTimer = setTimeout(go, SPLASH_DURATION_MS + 460)

    return () => {
      clearTimeout(t)
      clearTimeout(navTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Hide the native splash only once our first frame has actually painted, so the
  // hand-off from native splash -> JS splash has no white gap.
  const onRootLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: -float.value * 8 }, { scale: scale.value }],
  }))
  const ringStyle = useAnimatedStyle(() => ({
    opacity: (0.45 - ring.value * 0.35) * ringVisible.value,
    transform: [{ scale: 1 + ring.value * 0.35 }],
  }))

  return (
    <View style={styles.root} onLayout={onRootLayout}>
      <StatusBar style="light" />
      <LinearGradient colors={BACKDROP} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[styles.haloLg, { top: insets.top + 4 }]} />
      <View pointerEvents="none" style={[styles.haloSm, { top: insets.top + 90 }]} />

      {/* Static fallback: the branded icon is laid out immediately behind the
          animation, so even if the animation lib's first frame is slow the user
          sees the brand — never a white screen. */}
      <View pointerEvents="none" style={styles.center}>
        <View style={[styles.iconTile, styles.fallback]}>
          <Image source={AppLogo} style={styles.icon} resizeMode="contain" />
        </View>
      </View>

      <View style={styles.center}>
        <Animated.View style={styles.iconArea}>
          <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />
          <Animated.View style={[styles.iconTile, bubbleStyle]}>
            <Image source={AppLogo} style={styles.icon} resizeMode="contain" />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  )
}

const ICON = 96
const TILE = 120

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#13A07C' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },

  // Faint header halos (match login).
  haloLg: {
    position: 'absolute',
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  haloSm: {
    position: 'absolute',
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  iconArea: { width: TILE, height: TILE, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: TILE,
    height: TILE,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iconTile: {
    width: TILE,
    height: TILE,
    borderRadius: 30,
    // backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#063D2F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  // The static fallback sits at rest (no transform) directly behind the animation.
  fallback: {},
  icon: { width: ICON, height:  ICON ,  borderRadius: 30, },
})
