import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { AnimatedEZLogo, DecorativeBackground } from '@/components'
import { markOnboardingSeen } from '@/helpers'

/**
 * First-launch onboarding / landing page.
 *
 * Shown only once (the splash gate in `app/index.tsx` checks
 * `hasSeenOnboarding()`): an animated "EZ" badge over the shared pastel-blob
 * backdrop, the brand headline + description, and a teal CTA that marks
 * onboarding seen and continues to login. No auth logic lives here.
 */
export default function Onboarding() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [advancing, setAdvancing] = useState(false)

  const handleGetStarted = async () => {
    if (advancing) return
    setAdvancing(true)
    await markOnboardingSeen()
    router.replace('/login')
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Decorative pastel blobs, shared with the login screen */}
      <DecorativeBackground />

      <View
        style={[
          styles.safe,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.content}>
          <AnimatedEZLogo size={120} />

          <Text style={styles.headline}>Empower Your Workplace Journey</Text>

          <Text style={styles.description}>
            Connect with your organization, access important resources, and stay
            informed about company updates—all in one place.
          </Text>
        </View>

        <Pressable
          onPress={handleGetStarted}
          disabled={advancing}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          style={[styles.button, advancing && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  safe: { flex: 1, paddingHorizontal: 28 },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    color: '#13A07C',
    fontFamily: Platform.select({ android: 'Roboto', default: 'System' }),
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 36,
  },
  description: {
    color: '#5B6472',
    fontFamily: Platform.select({ android: 'Roboto', default: 'System' }),
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },

  button: {
    height: 54,
    borderRadius: 10,
    backgroundColor: '#13A07C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#0E7A60',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
})
