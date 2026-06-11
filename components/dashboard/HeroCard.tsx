import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { PressableScale } from '@/components/motion'
import { useTheme, type Pastel } from '@/constants/theme'
import type { DashboardItem } from '@/api/types'

/* -------------------------------------------------------------------------- */
/* Card state (shared dashboard helper — logic preserved verbatim)            */
/* -------------------------------------------------------------------------- */

/** Derive the status button label + done-state for a card. */
export function cardState(item: DashboardItem): { label: string; subline?: string; done: boolean } {
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

type MetaChip = { icon: keyof typeof Ionicons.glyphMap; text: string }

/** Bottom-left metadata chips, mirroring the reference's icon+label row, but
 *  sourced from real EZ fields (progress / viewed). */
function metaFor(item: DashboardItem): MetaChip[] {
  const chips: MetaChip[] = []
  if (item.total_forms != null || item.submitted_forms != null) {
    const submitted = item.submitted_forms ?? 0
    const total = item.total_forms ?? 0
    if (total > 0) chips.push({ icon: 'documents-outline', text: `${submitted}/${total} forms` })
  }
  if (item.viewed === true) chips.push({ icon: 'checkmark-circle-outline', text: 'Viewed' })
  return chips
}

/* -------------------------------------------------------------------------- */
/* HeroCard                                                                    */
/* -------------------------------------------------------------------------- */

export interface HeroCardProps {
  item: DashboardItem
  /** pastelAt(index) from the carousel — used as the image-less fallback tint. */
  pastel: Pastel
  onPress: () => void
  /** When false, render without the PressableScale wrapper — the parent (e.g. the
   *  swipe deck) owns the gesture/press. Defaults to true. */
  pressable?: boolean
}

/**
 * Premium edge-to-edge hero card modelled on the reference travel-card layout,
 * adapted to EZ data: an `expo-image` fills the card with a bottom `expo-linear-
 * gradient` scrim for legibility; a floating circular state button sits top-right
 * (checkmark when done, "open" affordance otherwise); the bottom overlay carries
 * the title + a metadata row (progress / viewed) on the left and the status pill
 * — the accent "value", like the reference price — on the right. Image-less items
 * fall back to a `pastelAt(index)` tint with `pastel.accent` text. Press feedback
 * is `PressableScale`; the coverflow transform is applied by `HeroCarousel`.
 */
export const HeroCard: React.FC<HeroCardProps> = ({ item, pastel, onPress, pressable = true }) => {
  const { colors, borderRadius, shadows, spacing, isDark } = useTheme()
  const { label, done } = cardState(item)
  const hasImage = !!item.image
  const meta = metaFor(item)

  // Text/icon color over the image scrim vs over the pastel fallback.
  const onCard = hasImage ? colors.text.inverse : pastel.accent

  // Status pill colors (preserve cardState().done mapping):
  //   done    → surface bg + primary text
  //   pending → brand bg + background text
  const pillBg = done ? colors.background.card : colors.brand.primary
  const pillText = done ? colors.text.primary : colors.background.primary

  const inner = (
    <View style={[styles.imageWrap, { borderRadius: borderRadius.xl }]}>
        {hasImage ? (
          <Image
            style={StyleSheet.absoluteFill}
            source={{ uri: item.image }}
            // The EZ banners have text baked into the artwork, so cover-cropping
            // cut it off. `contain` shows the whole image inside the card.
            contentFit="contain"
            transition={250}
          />
        ) : (
          <Text style={[styles.fallback, { color: pastel.accent }]} numberOfLines={2}>
            {item.title}
          </Text>
        )}

        {/* Bottom legibility scrim. The rgba-black gradient is the one allowed
            non-token color: it is an image scrim, not a theme color. Hidden when
            there is no image (the pastel fallback is already light/legible). */}
        {hasImage ? (
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.28)', 'rgba(0,0,0,0.66)']}
            locations={[0.35, 0.65, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        ) : null}

        {/* Floating circular state button (reference's top-right circle). Glass
            uses the background.overlay token; only shown over an image. */}
        {hasImage ? (
          <View
            style={[
              styles.fab,
              { top: spacing.base, right: spacing.base, backgroundColor: colors.background.overlay },
            ]}
            pointerEvents="none"
          >
            <Ionicons
              name={done ? 'checkmark' : 'arrow-forward'}
              size={18}
              color={colors.text.inverse}
            />
          </View>
        ) : null}

        <View style={[styles.overlay, { padding: spacing.base, gap: spacing.md }]}>
          <View style={styles.textCol}>
            <Text style={[styles.title, { color: onCard }]} numberOfLines={2}>
              {item.title}
            </Text>

            {meta.length > 0 ? (
              <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
                {meta.map((m, i) => (
                  <View key={i} style={styles.metaChip}>
                    <Ionicons name={m.icon} size={13} color={onCard} style={styles.metaDim} />
                    <Text style={[styles.metaText, { color: onCard }, styles.metaDim]} numberOfLines={1}>
                      {m.text}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View
            style={[
              styles.pill,
              { backgroundColor: pillBg, borderRadius: borderRadius.full },
              // On the pastel fallback (no scrim), give a "done" pill a hairline so
              // the surface-on-pastel stays defined. Branch on isDark only, never a literal.
              !hasImage && done && {
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: isDark ? colors.border.light : colors.border.default,
              },
            ]}
          >
            <Text style={[styles.pillText, { color: pillText }]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </View>
      </View>
  )

  const wrapStyle = [
    styles.hero,
    { borderRadius: borderRadius.xl, backgroundColor: pastel.bg },
    shadows.lg,
  ]

  // In the swipe deck the parent owns the gesture, so render a plain View.
  if (!pressable) return <View style={wrapStyle}>{inner}</View>

  return (
    <PressableScale style={wrapStyle} onPress={onPress} activeScale={0.97}>
      {inner}
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden' },
  imageWrap: {
    // Wider ratio to better match the landscape banner artwork (width/height).
    aspectRatio: 1.4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fallback: {
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
  fab: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  textCol: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: 0.2, lineHeight: 25 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12.5, fontWeight: '600' },
  metaDim: { opacity: 0.92 },
  pill: {
    minWidth: 76,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pillText: { fontSize: 13, fontWeight: '700' },
})
