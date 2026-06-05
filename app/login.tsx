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
  Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { BitpastelLogo, useFeedback } from '@/components'
import { useAuth } from '@/hooks/useAuth'
import { isValidEmail } from '@/helpers'
import { authService } from '@/api'

/**
 * Employee Zone login — mirrors the look of the web portal
 * (https://www.bitpastel.org/employee-zone/): the Bitpastel wordmark, a soft
 * pastel "blob" backdrop, and a centered glass card with the Employee Zone
 * title, email/password fields, and an Enter button.
 *
 * The form + validation are wired locally; the network call goes through
 * `authService.login` (see api/services/authService.ts). Swap the endpoint /
 * mapping for the real Employee Zone auth contract when integrating the API.
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
      router.replace('/(protected)/(tabs)/dashboard')
    } catch (err: any) {
      toast.error(loginErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Decorative pastel blobs echoing the web portal's photo collage */}
      <DecorativeBackground />

      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.logoWrap}>
                <BitpastelLogo width={140} />
              </View>

              <Text style={styles.title}>Employee Zone</Text>

              <Field
                value={email}
                onChangeText={setEmail}
                placeholder="you@bitpastel.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                focused={focused === 'email'}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                error={errors.email}
              />

              <Field
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
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
                      color="#5B6472"
                    />
                  </Pressable>
                }
              />

              <Pressable
                onPress={handleLogin}
                disabled={submitting}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                style={[styles.button, submitting && styles.buttonPressed]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Enter</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
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
/* Filled input matching the web portal's lavender fields                     */
/* -------------------------------------------------------------------------- */

interface FieldProps extends React.ComponentProps<typeof TextInput> {
  focused?: boolean
  error?: string
  trailing?: React.ReactNode
}

const Field: React.FC<FieldProps> = ({ focused, error, trailing, style, ...rest }) => (
  <View style={styles.fieldWrap}>
    <View
      style={[
        styles.field,
        focused && styles.fieldFocused,
        !!error && styles.fieldError,
      ]}
    >
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="#9AA1AD"
        {...rest}
      />
      {trailing}
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
)

/* -------------------------------------------------------------------------- */
/* Soft pastel circles framing the card. Positions/sizes are fractions of the  */
/* screen so the spacing stays consistent across devices.                      */
/* -------------------------------------------------------------------------- */

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

type Circle = {
  color: string
  /** Diameter as a fraction of the screen width. */
  size: number
  pos: { top?: number; bottom?: number; left?: number; right?: number }
}

const CIRCLES: Circle[] = [
  // top-left + top-right corners (symmetric)
  { color: '#F6D78A', size: 0.6, pos: { top: -SCREEN_H * 0.05, left: -SCREEN_W * 0.2 } },
  { color: '#9FD8F2', size: 0.62, pos: { top: -SCREEN_H * 0.05, right: -SCREEN_W * 0.2 } },
  // right-middle accent
  { color: '#F4B6C8', size: 0.54, pos: { top: SCREEN_H * 0.15, right: -SCREEN_W * 0.24 } },
  // bottom-left + bottom-right corners (symmetric)
  { color: '#BFE3B0', size: 0.62, pos: { bottom: SCREEN_H * 0.12, left: -SCREEN_W * 0.2 } },
  { color: '#F6D78A', size: 0.56, pos: { bottom: -SCREEN_H * 0.04, right: -SCREEN_W * 0.18 } },
  // bottom-center accent
  { color: '#A8E0D8', size: 0.58, pos: { bottom: -SCREEN_H * 0.05, left: SCREEN_W * 0.26 } },
]

const DecorativeBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {CIRCLES.map((c, i) => {
      const d = SCREEN_W * c.size
      return <View key={i} style={[styles.blob, c.pos, { width: d, height: d, backgroundColor: c.color }]} />
    })}
  </View>
)

/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  blob: { position: 'absolute', borderRadius: 9999, opacity: 0.55 },

  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 18,
    // Equal gap on all four sides between the card edge and its content
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    // Elevation / shadow so the glass card lifts off the backdrop
    shadowColor: '#0E7A60',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  logoWrap: { alignItems: 'center', marginBottom: 18 },
  title: {
    color: '#13A07C',
    fontFamily: Platform.select({ android: 'Roboto', default: 'System' }),
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 26,
  },

  fieldWrap: { marginBottom: 16 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F4',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fieldFocused: { borderColor: '#13A07C', backgroundColor: '#EAF6F1' },
  fieldError: { borderColor: '#EF4444' },
  input: { flex: 1, fontSize: 16, color: '#1B2233', paddingVertical: 0 },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 6, marginLeft: 4 },

  button: {
    height: 54,
    borderRadius: 10,
    backgroundColor: '#13A07C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
})
