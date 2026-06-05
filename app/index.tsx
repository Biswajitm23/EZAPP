import React, { useCallback, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import AppLogo from '../assets/images/App_logo.svg'
import Bitpastel from '../assets/images/bitpastel.svg'
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

// Must match the login screen's backdrop + header so the hand-off is seamless.
const BACKDROP = ['#13A07C', '#16928C', '#2E6FB5'] as const
const HEADER_TOP_OFFSET = 36 // login's ScrollView paddingTop above the safe area
const EST_LOGIN_CONTENT_H = 600 // approx height of login's centered content (header + card)

/**
 * How long the cube "plays" before it flies up into the login header.
 * Bump to 5000 for a full 5-second intro.
 */
const SPLASH_DURATION_MS = 3500

/**
 * App entry — animated splash + auth gate.
 *
 * Plays on every cold open: the Employee Zone cube pops in, breathes/wobbles
 * for ~SPLASH_DURATION_MS, then the whole brand lockup (icon + "BITPASTEL" +
 * "Employee Zone") flies up and settles exactly where the login header sits,
 * before routing on. Because the gradient + header sizes match the login
 * screen, the route swap reads as one continuous motion.
 *
 * Meanwhile it restores any persisted session and picks the destination:
 *   signed in -> dashboard · otherwise -> login
 */
export default function Index() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const insets = useSafeAreaInsets()
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
    )
    ring.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 1500 })),
      -1,
      false
    )

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

    return () => {
      clearTimeout(t)
      clearTimeout(navTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      <StatusBar style="light" />
      <LinearGradient colors={BACKDROP} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[styles.haloLg, { top: insets.top + 4 }]} />
      <View pointerEvents="none" style={[styles.haloSm, { top: insets.top + 90 }]} />

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
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#13A07C' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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

  // Brand lockup — sizes mirror the login header exactly (scale 1.0 == header).
  column: { alignItems: 'center' },
  iconArea: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iconTile: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#063D2F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
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