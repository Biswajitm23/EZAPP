import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  LayoutAnimation,
  UIManager,
  LayoutChangeEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

const BRAND = '#13A07C'
const INACTIVE = '#9AA1AD'

// Enable smooth layout reflow (label grow/shrink) on Android.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type IoniconName = keyof typeof Ionicons.glyphMap

/** Active / inactive icon + short label per tab route. */
const TAB_CONFIG: Record<string, { active: IoniconName; inactive: IoniconName; label: string }> = {
  'dashboard/index': { active: 'home', inactive: 'home-outline', label: 'Home' },
<<<<<<< HEAD
  // The bitpoints/ route is repurposed to host the Collab Days screen (route
  // path unchanged; only the label + calendar icon differ).
  'bitpoints/index': { active: 'calendar', inactive: 'calendar-outline', label: 'Collab Days' },
  'incentives/index': { active: 'gift', inactive: 'gift-outline', label: 'Reward' },
=======
  'bitpoints/index': { active: 'star', inactive: 'star-outline', label: 'Bitpoints' },
  'incentives/index': { active: 'gift', inactive: 'gift-outline', label: 'Incentives' },
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
  'profile/index': { active: 'person', inactive: 'person-outline', label: 'Profile' },
}

type Rect = { x: number; width: number }

/**
 * Floating pill tab bar — mirrors the reference app: a rounded white bar where
 * the active tab is a solid green pill (white icon + label) and inactive tabs
 * are just muted icons.
 *
 * The green pill is a single absolutely-positioned view that SLIDES: each tab
 * reports its position/size via onLayout, and when the active tab changes the
 * pill springs (translateX + width) to the new tab. The label grow/shrink is
 * eased with LayoutAnimation so the whole highlight glides instead of snapping.
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets()
  const activeIndex = state.index

  // Per-tab measured rectangles (relative to the inner bar).
  const [rects, setRects] = useState<Rect[]>([])

  // Animated pill position + width (layout props → JS driver).
  const pillX = useRef(new Animated.Value(0)).current
  const pillW = useRef(new Animated.Value(0)).current
  const firstRun = useRef(true)

  const target = rects[activeIndex]

  useEffect(() => {
    if (!target) return
    if (firstRun.current) {
      // Snap into place on first measure (no animation from 0).
      pillX.setValue(target.x)
      pillW.setValue(target.width)
      firstRun.current = false
      return
    }
    Animated.parallel([
      Animated.spring(pillX, { toValue: target.x, useNativeDriver: false, stiffness: 180, damping: 20, mass: 0.7 }),
      Animated.spring(pillW, { toValue: target.width, useNativeDriver: false, stiffness: 180, damping: 20, mass: 0.7 }),
    ]).start()
  }, [target?.x, target?.width, pillX, pillW])

  const onItemLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout
    setRects((prev) => {
      if (prev[index] && prev[index].x === x && prev[index].width === width) return prev
      const next = prev.slice()
      next[index] = { x, width }
      return next
    })
  }

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        <View style={styles.inner}>
          {/* Sliding green pill (behind the items) */}
          {target && (
            <Animated.View
              pointerEvents="none"
              style={[styles.pill, { transform: [{ translateX: pillX }], width: pillW }]}
            />
          )}

          {state.routes.map((route, index) => {
          const focused = state.index === index
          const cfg = TAB_CONFIG[route.name] ?? {
            active: 'ellipse' as IoniconName,
            inactive: 'ellipse-outline' as IoniconName,
            label: route.name,
          }

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!focused && !event.defaultPrevented) {
              // Ease the label grow/shrink that the press is about to cause.
              LayoutAnimation.configureNext(LayoutAnimation.create(260, 'easeInEaseOut', 'opacity'))
              navigation.navigate(route.name)
            }
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLayout={onItemLayout(index)}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              hitSlop={6}
              style={styles.item}
            >
              <Ionicons name={focused ? cfg.active : cfg.inactive} size={22} color={focused ? '#FFFFFF' : INACTIVE} />
              {focused && (
                <Text style={styles.label} numberOfLines={1}>
                  {cfg.label}
                </Text>
              )}
            </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  bar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: '100%',
    maxWidth: 460,
    shadowColor: '#0E7A60',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 12,
    ...Platform.select({ android: { borderWidth: 1, borderColor: '#EEF1F5' } }),
  },
  // Padding-free row so the pill (absolute, left:0) and items share an origin.
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Absolutely-positioned highlight that slides between tabs.
  pill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 44,
    borderRadius: 999,
    backgroundColor: BRAND,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 999,
    paddingHorizontal: 14,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
})
