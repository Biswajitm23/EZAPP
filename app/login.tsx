import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import AppLogo from '../assets/images/App_logo.svg'
import Bitpastel from '../assets/images/bitpastel.svg'
import { PressableScale, Reveal, useFeedback } from '@/components'
import { useAuth } from '@/hooks/useAuth'
import { isValidEmail } from '@/helpers'
import { authService } from '@/api'

// Vertical brand wash behind everything: brand green easing into a soft blue toe.
const BACKDROP = ['#13A07C', '#16928C', '#2E6FB5'] as const

/**
 * Employee Zone login.
 *
 * Layout mirrors the Figma "Employee Zone App Design":
 *   - a green → blue gradient backdrop,
 *   - a header (app icon, "BITPASTEL", "Employee Zone") sitting on the green,
 *   - a floating white card with a centered "Welcome Back" heading, labeled
 *     email/password fields, and a gradient LOGIN button.
 *
 * The form + validation are wired locally; the network call goes through
 * `authService.login` (see api/services/authService.ts).
 */
export default function Login() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { signIn } = useAuth()
  const { toast } = useFeedback()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [hidePassword, setHidePassword] = useState(true)
  const [focused, setFocused] = useState<'email' | 'password' | null>(null)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Email is required'
    else if (!isValidEmail(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const result = await authService.login({ email: email.trim(), password })
      await signIn(result)
      const first = result?.user?.name?.split(' ')[0]
      toast.success(first ? `Welcome back, ${first}! 👋` : 'Logged in successfully.')
      router.replace('/(protected)/(tabs)/dashboard')
    } catch (err: any) {
      toast.error(loginErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Green → blue gradient backdrop */}
      <LinearGradient colors={BACKDROP} style={StyleSheet.absoluteFill} />
      {/* Faint texture circles on the header (echoes the design) */}
      <View pointerEvents="none" style={[styles.haloLg, { top: insets.top + 4 }]} />
      <View pointerEvents="none" style={[styles.haloSm, { top: insets.top + 80 }]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header — app icon + brand. Static (no entrance): the animated splash
              flies this exact lockup into place, so re-animating it here would
              break the hand-off. */}
          <View style={styles.header}>
            <View style={styles.iconTile}>
              <AppLogo width={84} height={84} />
            </View>
            <Bitpastel width={90} height={40} style={styles.wordmark} />
            <Text style={styles.brandTitle}>Employee Zone</Text>
          </View>

          {/* Login card */}
          <Reveal index={1} style={styles.card}>
            <Text style={styles.welcome}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <Field
              label="Email Address"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              focused={focused === 'email'}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              error={errors.email}
            />

            <Field
              label="Password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={hidePassword}
              focused={focused === 'password'}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              error={errors.password}
              trailing={
                <Pressable onPress={() => setHidePassword((h) => !h)} hitSlop={10}>
                  <Ionicons
                    name={hidePassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9AA1AD"
                  />
                </Pressable>
              }
            />

            <PressableScale onPress={handleLogin} disabled={submitting} style={styles.buttonWrap}>
              <LinearGradient
                colors={['#19B289', '#0E8F6F']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.button, submitting && styles.buttonDisabled]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.buttonRow}>
                    <Text style={styles.buttonText}>LOGIN</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </View>
                )}
              </LinearGradient>
            </PressableScale>
          </Reveal>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

/**
 * Maps a login API error to a user-facing message.
 *   422 — missing email/password · 401 — invalid credentials
 *   429 — too many attempts (uses retry_after when provided)
 */
function loginErrorMessage(err: any): string {
  const status = err?.response?.status
  const data = err?.response?.data
  if (data?.message) return data.message
  if (status === 422) return 'Please enter your email and password.'
  if (status === 401) return 'Invalid email or password.'
  if (status === 429) {
    const retry = data?.retry_after
    return `Too many attempts. Please try again${retry ? ` in ${retry}s` : ' later'}.`
  }
  return 'Unable to sign in. Please check your connection and try again.'
}

/* -------------------------------------------------------------------------- */
/* Labeled input with a leading icon, matching the card design                 */
/* -------------------------------------------------------------------------- */

interface FieldProps extends React.ComponentProps<typeof TextInput> {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  focused?: boolean
  error?: string
  trailing?: React.ReactNode
}

const Field: React.FC<FieldProps> = ({ label, icon, focused, error, trailing, style, ...rest }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.field, focused && styles.fieldFocused, !!error && styles.fieldError]}>
      <Ionicons name={icon} size={20} color="#13A07C" style={styles.fieldIcon} />
      <TextInput style={[styles.input, style]} placeholderTextColor="#9AA1AD" {...rest} />
      {trailing}
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
)

/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#13A07C' },
  flex: { flex: 1 },
  // Whole section vertically centered. The splash estimates this centered
  // header position so the hand-off still lands close (see app/index.tsx).
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22 },

  // Soft lighter-green halos textured into the header.
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

  // Header
  header: { alignItems: 'center', marginBottom: 26 },
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
  wordmark: { marginTop: 16 },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.3,
    includeFontPadding: false,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#063D2F',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 14,
  },
  welcome: {
    color: '#0E1726',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#7A8496',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },

  // Fields
  fieldWrap: { marginBottom: 18 },
  label: { color: '#2B3445', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E7EBF0',
  },
  fieldFocused: { borderColor: '#13A07C', backgroundColor: '#F4FBF8' },
  fieldError: { borderColor: '#EF4444' },
  fieldIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1B2233', paddingVertical: 0 },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 6, marginLeft: 4 },

  // Button
  buttonWrap: { marginTop: 8, borderRadius: 30, overflow: 'hidden' },
  button: {
    height: 56,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.85 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
})