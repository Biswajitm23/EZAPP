import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ScreenContainer, PressableScale, Reveal } from '@/components'

/**
 * Content detail / video screen — opened from a Dashboard card. Mirrors the web
 * portal's video page: a back header, a language selector, a video player area,
 * and an "I have already watched the Video" confirmation card.
 *
 * The player is a placeholder until real media/URLs are wired via the API.
 */
export default function ContentDetail() {
  const router = useRouter()
  const params = useLocalSearchParams<{ title?: string; tagline?: string; color?: string }>()
  const title = params.title ?? 'Content'
  const tagline = params.tagline ?? ''
  const color = params.color ?? '#13A07C'

  const [watched, setWatched] = useState(false)

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Reveal index={0}>
          <View style={styles.headerRow}>
            <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color="#1B2233" />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>{title}</Text>
        </Reveal>

        {/* Language selector (static) */}
        <Reveal index={1}>
          <PressableScale style={styles.langPill} activeScale={0.95}>
            <Ionicons name="globe-outline" size={16} color="#1B2233" />
            <Text style={styles.langText}>English</Text>
            <Ionicons name="chevron-down" size={16} color="#1B2233" />
          </PressableScale>
        </Reveal>

        {/* Video player placeholder */}
        <Reveal index={2}>
          <View style={[styles.player, { backgroundColor: color }]}>
            <View style={styles.playerOverlay}>
              <PressableScale style={styles.playBtn} activeScale={0.9}>
                <Ionicons name="play" size={30} color="#FFFFFF" />
              </PressableScale>
              {tagline ? <Text style={styles.playerCaption}>{tagline}</Text> : null}
            </View>
            {/* fake controls bar */}
            <View style={styles.controls}>
              <Ionicons name="pause" size={16} color="#FFFFFF" />
              <Text style={styles.controlsTime}>0:00 / 6:51</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="volume-medium" size={16} color="#FFFFFF" />
              <Ionicons name="settings-outline" size={16} color="#FFFFFF" style={{ marginLeft: 12 }} />
            </View>
          </View>
        </Reveal>

        {/* Watched confirmation card */}
        <Reveal index={3}>
          <PressableScale style={styles.watchedCard} onPress={() => setWatched((w) => !w)} activeScale={0.98}>
            <View style={[styles.checkCircle, { backgroundColor: watched ? '#13A07C' : '#D1D5DB' }]}>
              <Ionicons name="checkmark" size={34} color="#FFFFFF" />
            </View>
            <Text style={styles.watchedText}>
              {watched ? 'Marked as watched' : 'I have already watched the Video'}
            </Text>
          </PressableScale>
        </Reveal>
      </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },

  headerRow: { flexDirection: 'row', alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 16, fontWeight: '600', color: '#1B2233', marginLeft: 2 },
  title: { fontSize: 24, fontWeight: '700', color: '#2B2B2B', marginTop: 10, marginBottom: 16 },

  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E5EA',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 18,
  },
  langText: { fontSize: 14, fontWeight: '600', color: '#1B2233' },

  player: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  playerOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  playerCaption: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  controlsTime: { color: '#FFFFFF', fontSize: 12 },

  watchedCard: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  checkCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  watchedText: { fontSize: 15, color: '#4B5563', fontWeight: '500' },
})
