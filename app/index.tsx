import React, { useCallback, useEffect, useRef } from 'react'
<<<<<<< HEAD
import { View, Image, StyleSheet } from 'react-native'
=======
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native'
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
<<<<<<< HEAD
import * as SplashScreen from 'expo-splash-screen'
=======
import AppLogo from '../assets/images/App_logo.svg'
import Bitpastel from '../assets/images/bitpastel.svg'
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
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

<<<<<<< HEAD
const AppLogo = require('../assets/images/app-icon.png')

// Keep the native splash up until the JS splash's first frame is painted, so the
// user never sees a blank white frame on cold start (the native splash, configured
// in app.json with this same icon + brand background, hands off seamlessly).
SplashScreen.preventAutoHideAsync().catch(() => {})

// Brand backdrop — matches the login screen + the native splash background.
const BACKDROP = ['#13A07C', '#16928C', '#2E6FB5'] as const

/** How long the bubble logo plays before fading out and routing on. */
const SPLASH_DURATION_MS = 2600
=======
// Must match the login screen's backdrop + header so the hand-off is seamless.
const BACKDROP = ['#13A07C', '#16928C', '#2E6FB5'] as const
const HEADER_TOP_OFFSET = 36 // login's ScrollView paddingTop above the safe area
const EST_LOGIN_CONTENT_H = 600 // approx height of login's centered content (header + card)

/**
 * How long the cube "plays" before it flies up into the login header.
 * Bump to 5000 for a full 5-second intro.
 */
const SPLASH_DURATION_MS = 3500
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43

/**
 * App entry — animated splash + auth gate.
 *
<<<<<<< HEAD
 * Plays on every cold open: the Employee Zone app icon "bubbles" in (pop/scale)
 * centered on the brand backdrop, breathes/floats for ~SPLASH_DURATION_MS, then
 * fades/scales out before routing on. No wordmark, no text — just the icon.
=======
 * Plays on every cold open: the Employee Zone cube pops in, breathes/wobbles
 * for ~SPLASH_DURATION_MS, then the whole brand lockup (icon + "BITPASTEL" +
 * "Employee Zone") flies up and settles exactly where the login header sits,
 * before routing on. Because the gradient + header sizes match the login
 * screen, the route swap reads as one continuous motion.
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
 *
 * Meanwhile it restores any persisted session and picks the destination:
 *   signed in -> dashboard · otherwise -> login
 */
export default function Index() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const insets = useSafeAreaInsets()
<<<<<<< HEAD

  const targetRef = useRef<string>('/login')
  const navigatedRef = useRef(false)

  // Bubble entrance + idle float + exit.
  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)
  const float = useSharedValue(0)
  const ring = useSharedValue(0)
  const ringVisible = useSharedValue(1)
=======
  const { height } = useWindowDimensions()

  const targetRef = useRef<string>('/login')
  const columnTopRef = useRef<number | null>(null)
  const navigatedRef = useRef(false)

  // Brand lockup (icon + texts) — entrance, hold scale, and fly-up exit.
  const colScale = useSharedValue(0)
  const colOpacity = useSharedValue(0)
  const colTranslateY = useSharedValue(0)
  // Continuous "alive" motion on the cube.
  const wobble = useSharedValue(0)
  const breathe = useSharedValue(0)
  const ring = useSharedValue(0)
  const ringVisible = useSharedValue(1)
  // Text reveal.
  const textOpacity = useSharedValue(0)
  const textY = useSharedValue(14)
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43

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
<<<<<<< HEAD
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
=======
    // Entrance: pop the lockup in.
    colOpacity.value = withTiming(1, { duration: 500 })
    colScale.value = withSpring(1.4, { stiffness: 150, damping: 14, mass: 0.9 })
    textOpacity.value = withDelay(450, withTiming(1, { duration: 520 }))
    textY.value = withDelay(450, withSpring(0, { stiffness: 130, damping: 16 }))

    // Continuous: gentle wobble + breathe + a breathing ring.
    wobble.value = withDelay(
      650,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(-1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      )
    )
    breathe.value = withDelay(
      650,
      withRepeat(withSequence(withTiming(1, { duration: 850 }), withTiming(0, { duration: 850 })), -1, true)
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
    )
    ring.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 1500 })),
      -1,
      false
    )

<<<<<<< HEAD
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
=======
    // Exit: stop the idle motion and fly the lockup up into the login header.
    const t = setTimeout(() => {
      cancelAnimation(wobble)
      cancelAnimation(breathe)
      cancelAnimation(ring)
      wobble.value = withTiming(0, { duration: 300 })
      breathe.value = withTiming(0, { duration: 300 })
      ringVisible.value = withTiming(0, { duration: 250 })

      const colTop = columnTopRef.current ?? height * 0.4
      // Login centers its content vertically — estimate where its header lands
      // so the lockup flies to that spot (not the very top).
      const avail = height - insets.top - HEADER_TOP_OFFSET - (insets.bottom + 28)
      const targetTop = insets.top + HEADER_TOP_OFFSET + Math.max(0, (avail - EST_LOGIN_CONTENT_H) / 2)
      colTranslateY.value = withTiming(targetTop - colTop, { duration: 620, easing: Easing.inOut(Easing.cubic) })
      colScale.value = withTiming(1, { duration: 620, easing: Easing.inOut(Easing.cubic) })
    }, SPLASH_DURATION_MS)

    // Route on once the lockup has settled into the header position.
    const navTimer = setTimeout(go, SPLASH_DURATION_MS + 680)
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43

    return () => {
      clearTimeout(t)
      clearTimeout(navTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

<<<<<<< HEAD
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
=======
  const columnStyle = useAnimatedStyle(() => ({
    opacity: colOpacity.value,
    transform: [{ translateY: colTranslateY.value }, { scale: colScale.value }],
  }))
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wobble.value * 7}deg` }, { scale: 1 + breathe.value * 0.06 }],
  }))
  const ringStyle = useAnimatedStyle(() => ({
    opacity: (0.45 - ring.value * 0.35) * ringVisible.value,
    transform: [{ scale: 1 + ring.value * 0.3 }],
  }))
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }))

  return (
    <View style={styles.root}>
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
      <StatusBar style="light" />
      <LinearGradient colors={BACKDROP} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[styles.haloLg, { top: insets.top + 4 }]} />
      <View pointerEvents="none" style={[styles.haloSm, { top: insets.top + 90 }]} />

<<<<<<< HEAD
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
=======
      <View style={styles.center}>
        <Animated.View
          style={[styles.column, columnStyle]}
          onLayout={(e) => {
            columnTopRef.current = e.nativeEvent.layout.y
          }}
        >
          <View style={styles.iconArea}>
            <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />
            <Animated.View style={[styles.iconTile, iconStyle]}>
              <AppLogo width={84} height={84} />
            </Animated.View>
          </View>

          <Animated.View style={[textStyle, styles.textBlock]}>
            <Bitpastel width={90} height={40} style={styles.wordmark} />
            <Text style={styles.title}>Employee Zone</Text>
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  )
}

<<<<<<< HEAD
const ICON = 96
const TILE = 120

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#13A07C' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
=======
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#13A07C' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43

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

<<<<<<< HEAD
  iconArea: { width: TILE, height: TILE, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: TILE,
    height: TILE,
    borderRadius: 34,
=======
  // Brand lockup — sizes mirror the login header exactly (scale 1.0 == header).
  column: { alignItems: 'center' },
  iconArea: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 26,
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iconTile: {
<<<<<<< HEAD
    width: TILE,
    height: TILE,
    borderRadius: 30,
    // backgroundColor: '#FFFFFF',
=======
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#063D2F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
<<<<<<< HEAD
  // The static fallback sits at rest (no transform) directly behind the animation.
  fallback: {},
  icon: { width: ICON, height:  ICON ,  borderRadius: 30, },
})
=======
  textBlock: { alignItems: 'center' },
  wordmark: { marginTop: 16 },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.3,
    includeFontPadding: false,
    textAlign: 'center',
  },
})
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
