import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ActivityIndicator,
  type GestureResponderEvent,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useEvent } from 'expo'
import { useVideoPlayer, VideoView } from 'expo-video'

/* Modern palette (matches the redesigned e-learning screen). */
const PRIMARY = '#10B981'

/** Format seconds as m:ss (or h:mm:ss for long videos). */
function fmt(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

const HIDE_AFTER_MS = 2800
const DOUBLE_TAP_MS = 280

/**
 * Netflix/YouTube-style video player built on expo-video.
 *
 * Edge-to-edge 16:9 surface with rounded corners + a soft shadow (no card
 * chrome). Custom overlay controls: a center play/pause, a draggable progress
 * bar, current time (bottom-left), duration + fullscreen (bottom-right). The
 * controls fade out ~3s after the last interaction while playing, and a
 * double-tap on the left/right third seeks ±10s. Shows the poster thumbnail
 * before first play and a skeleton spinner while the media loads.
 */
export function VideoPlayer({ uri, poster }: { uri: string; poster?: string }) {
  const ref = useRef<VideoView>(null)
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false
    p.timeUpdateEventInterval = 0.25
  })

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing })
  const { status } = useEvent(player, 'statusChange', { status: player.status })
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: 0,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  })

  const duration = player.duration || 0
  const loading = status === 'loading' || status === 'idle'

  const [hasPlayed, setHasPlayed] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [scrubRatio, setScrubRatio] = useState<number | null>(null)
  const [seekFlash, setSeekFlash] = useState<'back' | 'fwd' | null>(null)

  const fade = useRef(new Animated.Value(1)).current
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastTap = useRef(0)
  const boxW = useRef(0)
  const trackW = useRef(0)

  useEffect(() => {
    if (isPlaying && !hasPlayed) setHasPlayed(true)
  }, [isPlaying, hasPlayed])

  // Fade the controls in/out.
  useEffect(() => {
    Animated.timing(fade, {
      toValue: controlsVisible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start()
  }, [controlsVisible, fade])

  // Auto-hide while playing; never auto-hide while paused or scrubbing.
  useEffect(() => {
    clearTimeout(hideTimer.current)
    if (controlsVisible && isPlaying && scrubRatio == null) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), HIDE_AFTER_MS)
    }
    return () => clearTimeout(hideTimer.current)
  }, [controlsVisible, isPlaying, scrubRatio])

  useEffect(() => () => clearTimeout(flashTimer.current), [])

  const togglePlay = useCallback(() => {
    if (player.playing) player.pause()
    else player.play()
    setControlsVisible(true)
  }, [player])

  const flash = useCallback((dir: 'back' | 'fwd') => {
    setSeekFlash(dir)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setSeekFlash(null), 500)
  }, [])

  // Tap on the video surface: single tap toggles controls; double-tap on the
  // outer thirds seeks ±10s, in the middle toggles play/pause.
  const onSurfaceTap = useCallback(
    (e: GestureResponderEvent) => {
      const now = Date.now()
      const x = e.nativeEvent.locationX
      const w = boxW.current || 1
      if (now - lastTap.current < DOUBLE_TAP_MS) {
        if (x < w * 0.35) {
          player.seekBy(-10)
          flash('back')
        } else if (x > w * 0.65) {
          player.seekBy(10)
          flash('fwd')
        } else {
          togglePlay()
        }
        setControlsVisible(true)
        lastTap.current = 0
      } else {
        setControlsVisible((v) => !v)
        lastTap.current = now
      }
    },
    [player, togglePlay, flash]
  )

  const scrubTo = useCallback(
    (x: number) => {
      const w = trackW.current || 1
      setScrubRatio(clamp(x / w, 0, 1))
    },
    []
  )

  const commitScrub = useCallback(() => {
    setScrubRatio((r) => {
      if (r != null && duration) player.currentTime = r * duration
      return null
    })
    setControlsVisible(true)
  }, [player, duration])

  const progress = scrubRatio != null ? scrubRatio : duration ? clamp(currentTime / duration, 0, 1) : 0
  const shownTime = scrubRatio != null ? scrubRatio * duration : currentTime
  const showPoster = !!poster && !hasPlayed

  return (
    <View style={styles.shell}>
      <View
        style={styles.frame}
        onLayout={(e) => (boxW.current = e.nativeEvent.layout.width)}
      >
        <VideoView
          ref={ref}
          style={styles.video}
          player={player}
          nativeControls={false}
          contentFit="contain"
          allowsFullscreen
          allowsPictureInPicture
        />

        {/* Poster thumbnail until the first play. */}
        {showPoster ? (
          <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : null}

        {/* Loading skeleton. */}
        {loading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : null}

        {/* Background tap layer (show/hide + double-tap seek). */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onSurfaceTap} />

        {/* Double-tap seek feedback. */}
        {seekFlash ? (
          <View
            pointerEvents="none"
            style={[styles.seekFlash, seekFlash === 'back' ? styles.seekFlashLeft : styles.seekFlashRight]}
          >
            <Ionicons name={seekFlash === 'back' ? 'play-back' : 'play-forward'} size={22} color="#FFFFFF" />
            <Text style={styles.seekFlashText}>{seekFlash === 'back' ? '-10s' : '+10s'}</Text>
          </View>
        ) : null}

        {/* Controls overlay. */}
        <Animated.View
          style={[styles.controls, { opacity: fade }]}
          pointerEvents={controlsVisible ? 'box-none' : 'none'}
        >
          {/* Center play / pause. */}
          <View style={styles.centerRow} pointerEvents="box-none">
            <Pressable style={styles.playBtn} onPress={togglePlay} hitSlop={10}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Bottom bar: time · progress · duration · fullscreen. */}
          <View style={styles.bottomBar} pointerEvents="box-none">
            <Text style={styles.time}>{fmt(shownTime)}</Text>

            <View
              style={styles.trackHit}
              onLayout={(e) => (trackW.current = e.nativeEvent.layout.width)}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e) => scrubTo(e.nativeEvent.locationX)}
              onResponderMove={(e) => scrubTo(e.nativeEvent.locationX)}
              onResponderRelease={commitScrub}
              onResponderTerminate={commitScrub}
            >
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
                <View style={[styles.thumb, { left: `${progress * 100}%` }]} />
              </View>
            </View>

            <Text style={styles.time}>{fmt(duration)}</Text>

            <Pressable style={styles.iconBtn} onPress={() => ref.current?.enterFullscreen()} hitSlop={8}>
              <Ionicons name="expand" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  // Outer wrapper carries the shadow (no overflow clipping so it shows).
  shell: {
    borderRadius: 22,
    backgroundColor: '#000000',
    shadowColor: '#0B1B33',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  // Inner clips the video + overlays to the rounded 16:9 surface.
  frame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  // Player fills the frame via explicit dimensions (not absoluteFill) so it never
  // drives its own size — the 16:9 frame is the single source of truth.
  video: { width: '100%', height: '100%' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  centerRow: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  time: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    minWidth: 34,
    textAlign: 'center',
  },
  // Larger touch target than the visible track for easier scrubbing.
  trackHit: { flex: 1, height: 28, justifyContent: 'center' },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
    backgroundColor: PRIMARY,
  },
  thumb: {
    position: 'absolute',
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    marginLeft: -6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  iconBtn: { padding: 4 },
  seekFlash: {
    position: 'absolute',
    top: '50%',
    marginTop: -28,
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  seekFlashLeft: { left: '12%' },
  seekFlashRight: { right: '12%' },
  seekFlashText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
})
