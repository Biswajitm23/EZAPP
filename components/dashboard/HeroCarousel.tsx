import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, useWindowDimensions, LayoutChangeEvent } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { PressableScale } from '@/components/motion'
import { pastelAt, useTheme } from '@/constants/theme'
import type { DashboardItem, DashboardSection } from '@/api/types'
import { HeroCard } from './HeroCard'
import { PaginationDots } from './PaginationDots'

export interface HeroCarouselProps {
  section: DashboardSection
  onPressItem: (item: DashboardItem) => void
}

const NOOP = () => {}
const VISIBLE = 3 // cards rendered in the stack at once

const mod = (n: number, m: number) => ((n % m) + m) % m

/**
 * Stacked swipe deck (JioHotstar-style). The active item sits on top; the next
 * items peek behind it, offset to the right and scaled down. Dragging the top
 * card left flings it away and promotes the next item to the front; the deck
 * cycles ("appends" the dismissed card to the back). Tapping opens the front
 * item. The whole stack is driven by a single `pos` shared value so transitions
 * are continuous and no card ever remounts. Geometry is measured from the
 * carousel's own width (`onLayout`), so cards fit inside the padded screen.
 */
export const HeroCarousel: React.FC<HeroCarouselProps> = ({ section, onPressItem }) => {
  const { colors } = useTheme()
  const { width: windowWidth } = useWindowDimensions()
  const [containerW, setContainerW] = useState(windowWidth)

  const items = section.items
  const count = items.length
  const isPresentation = section.key === 'presentations'

  // Center the front card; the symmetric side gap leaves room for the stacked
  // peek behind it.
  const cardWidth = Math.max(220, Math.round(containerW * 0.84))
  const sidePad = Math.round((containerW - cardWidth) / 2)
  const cardHeight = isPresentation ? 240 : Math.round(cardWidth / 1.4)
  const deckHeight = cardHeight + 34

  const onSectionLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width
      if (w > 0 && Math.abs(w - containerW) > 1) setContainerW(w)
    },
    [containerW]
  )

  // Continuous deck position (in card units). Integer = a card is at the front.
  const pos = useSharedValue(0)
  const start = useSharedValue(0)
  const [page, setPage] = useState(0)

  // Reset the deck whenever the section's content changes.
  useEffect(() => {
    pos.value = 0
    start.value = 0
    setPage(0)
  }, [section.key, count, pos, start])

  const syncPage = useCallback((target: number) => setPage(mod(target, count)), [count])
  const openAt = useCallback((i: number) => onPressItem(items[mod(i, count)]), [onPressItem, items, count])

  const renderCard = (item: DashboardItem, index: number) =>
    isPresentation ? (
      <PresentationCard item={item} pressable={false} onPress={NOOP} />
    ) : (
      <HeroCard item={item} pastel={pastelAt(index)} pressable={false} onPress={NOOP} />
    )

  // Single-item sections: just the card, no deck/gesture.
  if (count <= 1) {
    return (
      <View style={styles.section} onLayout={onSectionLayout}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{section.title}</Text>
        <View style={{ width: cardWidth, alignSelf: 'center' }}>
          {isPresentation ? (
            <PresentationCard item={items[0]} onPress={() => onPressItem(items[0])} />
          ) : (
            <HeroCard item={items[0]} pastel={pastelAt(0)} onPress={() => onPressItem(items[0])} />
          )}
        </View>
      </View>
    )
  }

  const swipeUnit = cardWidth * 0.62 // px of horizontal drag == one card advance

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onStart(() => {
      start.value = pos.value
    })
    .onUpdate((e) => {
      pos.value = start.value - e.translationX / swipeUnit
    })
    .onEnd((e) => {
      const moved = pos.value - start.value
      let target = Math.round(start.value)
      if (moved > 0.3 || e.velocityX < -500) target = Math.round(start.value) + 1
      else if (moved < -0.3 || e.velocityX > 500) target = Math.round(start.value) - 1
      pos.value = withTiming(target, { duration: 260 })
      runOnJS(syncPage)(target)
    })

  const tap = Gesture.Tap()
    .maxDistance(14)
    .onEnd(() => {
      runOnJS(openAt)(Math.round(pos.value))
    })

  const gesture = Gesture.Exclusive(pan, tap)

  return (
    <View style={styles.section} onLayout={onSectionLayout}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{section.title}</Text>

      <GestureDetector gesture={gesture}>
        <View style={[styles.deck, { height: deckHeight }]}>
          {items.map((item, i) => (
            <DeckCard key={item.key} index={i} count={count} pos={pos} cardWidth={cardWidth} sidePad={sidePad}>
              {renderCard(item, i)}
            </DeckCard>
          ))}
        </View>
      </GestureDetector>

      <PaginationDots count={count} activeIndex={page} />
    </View>
  )
}

/**
 * One card in the stack. Reads the shared `pos` to compute its depth offset and
 * derive the stacked transform: the front card (offset 0) is full size/opacity;
 * cards behind shift right, shrink and dim; a card leaving (offset < 0) flings
 * left, rotates and fades. The offset wraps modulo `count` for the cycling feel.
 */
const DeckCard: React.FC<{
  index: number
  count: number
  pos: SharedValue<number>
  cardWidth: number
  sidePad: number
  children: React.ReactNode
}> = ({ index, count, pos, cardWidth, sidePad, children }) => {
  const animatedStyle = useAnimatedStyle(() => {
    // Inline modulo — a worklet can't call the JS-thread `mod` helper.
    const diff = index - pos.value
    const raw = ((diff % count) + count) % count // 0 .. count
    const offset = raw > count - 1 ? raw - count : raw // (-1 .. count-1)

    // Front card is centered (sidePad). Cards behind peek slightly to the right;
    // a leaving card (offset < 0) flings off to the left.
    const translateX = interpolate(
      offset,
      [-1, 0, 1, 2, 3],
      [-(cardWidth + 100), 0, 14, 26, 32],
      Extrapolation.CLAMP
    )
    const translateY = interpolate(offset, [0, 1, 2, 3], [0, 12, 22, 28], Extrapolation.CLAMP)
    const scale = interpolate(offset, [0, 1, 2, 3], [1, 0.95, 0.9, 0.88], Extrapolation.CLAMP)
    const rotate = interpolate(offset, [-1, 0], [-9, 0], Extrapolation.CLAMP)
    const opacity = interpolate(offset, [-1, -0.5, 0, 2, 3], [0, 0.5, 1, 0.78, 0], Extrapolation.CLAMP)
    const zIndex = Math.round(
      interpolate(offset, [-1, 0, 1, 2, 3], [120, 100, 90, 80, 70], Extrapolation.CLAMP)
    )

    return {
      opacity,
      zIndex,
      transform: [{ translateX }, { translateY }, { rotate: `${rotate}deg` }, { scale }],
    }
  })

  return (
    <Animated.View style={[styles.deckCard, { left: sidePad, width: cardWidth }, animatedStyle]}>
      {children}
    </Animated.View>
  )
}

/* -------------------------------------------------------------------------- */
/* Presentation card (distinct, polished treatment — preserved)               */
/* -------------------------------------------------------------------------- */

const PresentationCard: React.FC<{
  item: DashboardItem
  onPress: () => void
  pressable?: boolean
}> = ({ item, onPress, pressable = true }) => {
  const { colors, borderRadius, shadows, spacing } = useTheme()

  const inner = (
    <>
      <View style={[styles.presImageWrap, { backgroundColor: colors.brand.secondary }]}>
        {item.image ? (
          <Image
            style={StyleSheet.absoluteFill}
            source={{ uri: item.image }}
            contentFit="cover"
            transition={250}
          />
        ) : null}
        {/* Image legibility scrim (allowed rgba-black exception). */}
        <LinearGradient
          colors={['rgba(0,0,0,0.32)', 'rgba(0,0,0,0)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View
          style={[
            styles.presBadge,
            { borderRadius: borderRadius.full, backgroundColor: colors.background.overlay },
          ]}
        >
          <Ionicons name="albums" size={14} color={colors.text.inverse} />
          <Text style={[styles.presBadgeText, { color: colors.text.inverse }]}>Presentations</Text>
        </View>
      </View>

      <View style={[styles.presBody, { backgroundColor: colors.background.card, padding: spacing.base }]}>
        <View
          style={[
            styles.presIconChip,
            { borderRadius: borderRadius.base, backgroundColor: colors.background.secondary },
          ]}
        >
          <Ionicons name="easel-outline" size={20} color={colors.brand.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.presTitle, { color: colors.text.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.presSub, { color: colors.text.secondary }]} numberOfLines={1}>
            Browse all topics &amp; slide decks
          </Text>
        </View>
        <View
          style={[styles.presCta, { borderRadius: borderRadius.full, backgroundColor: colors.brand.primary }]}
        >
          <Ionicons name="arrow-forward" size={18} color={colors.background.primary} />
        </View>
      </View>
    </>
  )

  const wrapStyle = [styles.presCard, { borderRadius: borderRadius.lg }, shadows.lg]

  if (!pressable) return <View style={wrapStyle}>{inner}</View>

  return (
    <PressableScale style={wrapStyle} onPress={onPress} activeScale={0.97}>
      {inner}
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  section: { marginTop: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },

  // Swipe deck — cards are absolutely stacked at the left; peek shows on the right.
  deck: { width: '100%', overflow: 'visible' },
  deckCard: { position: 'absolute', left: 0, top: 0 },

  presCard: { overflow: 'hidden' },
  presImageWrap: { height: 150, justifyContent: 'flex-start' },
  presBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    margin: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  presBadgeText: { fontSize: 12, fontWeight: '700' },
  presBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  presIconChip: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  presTitle: { fontSize: 16, fontWeight: '700' },
  presSub: { fontSize: 12, marginTop: 2 },
  presCta: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
})
