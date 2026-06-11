import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Keyboard,
  findNodeHandle,
  UIManager,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import { PressableScale, Reveal, useFeedback } from '@/components'
import { useAuth } from '@/hooks/useAuth'
import {
  isValidEmail,
  getRememberedCredentials,
  saveRememberedCredentials,
  clearRememberedCredentials,
} from '@/helpers'
import { authService } from '@/api'

const AppLogo = require('../assets/images/app-icon.png')

// Vertical brand wash behind everything: brand green easing into a soft blue toe.
const BACKDROP = ['#13A07C', '#16928C', '#2E6FB5'] as const


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
  const [remember, setRemember] = useState(false)

  // Restore "Remember me" credentials saved on a previous sign-in. If a record
  // exists the box was checked, so we pre-fill both fields and re-check it.
  useEffect(() => {
    let active = true
    getRememberedCredentials().then((creds) => {
      if (!active || !creds) return
      setEmail(creds.email)
      setPassword(creds.password)
      setRemember(true)
    })
    return () => {
      active = false
    }
  }, [])

  // When a field gains focus we scroll it into view so the on-screen keyboard
  // never covers it. We measure the focused field's Y position relative to the
  // ScrollView's scrollable content and scroll there with a small top margin —
  // works on both platforms (iOS pairs it with KeyboardAvoidingView 'padding',
  // Android pairs it with windowSoftInputMode=adjustResize).
  const scrollRef = useRef<ScrollView>(null)
  const scrollFieldIntoView = (node: number | null) => {
    if (node == null) return
    const scrollNode = scrollRef.current && findNodeHandle(scrollRef.current)
    if (scrollNode == null) return
    // Defer to the next frame so the keyboard has begun resizing/animating.
    requestAnimationFrame(() => {
      UIManager.measureLayout(
        node,
        scrollNode as number,
        () => {},
        (_x, y) => {
          scrollRef.current?.scrollTo({ y: Math.max(y - 24, 0), animated: true })
        },
      )
    })
  }

  const validate = () => {
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Email is required'
    else if (!isValidEmail(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleLogin = async () => {
    Keyboard.dismiss()
    if (!validate()) return
    setSubmitting(true)
    try {
      const result = await authService.login({ email: email.trim(), password })
      // Persist or drop the remembered credentials based on the checkbox. Done
      // on success only, so a failed attempt never overwrites a saved record.
      if (remember) {
        await saveRememberedCredentials({ email: email.trim(), password })
      } else {
        await clearRememberedCredentials()
      }
      await signIn(result)
      // Unmount the button spinner and let signIn's auth-state re-render commit
      // BEFORE navigating. Calling router.replace synchronously in this same
      // promise tick races react-native-screens' screen re-parenting on Fabric and
      // crashes with `addViewAt: failed to insert view / The specified child
      // already has a parent`. Deferring the replace by one frame lets the outgoing
      // login tree (ScrollView + spinner) settle first — this is exactly why the
      // cold-open path (app/index.tsx, which navigates from a timer) never crashed.
      setSubmitting(false)
      const firstName = result?.user?.name?.trim().split(' ')[0]
      requestAnimationFrame(() => {
        router.replace('/(protected)/(tabs)/dashboard')
        // Welcome toast — fire it only AFTER the screen transition has committed.
        // The toast is a root-level animation; showing it during navigation would
        // re-render the root mid-transition and risk the same Fabric re-parent
        // crash we just fixed, so defer it past the (tabs) fade (240ms).
        setTimeout(() => {
          toast.success(firstName ? `Welcome back, ${firstName}! 👋` : 'Logged in successfully.')
        }, 500)
      })

      return
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
          ref={scrollRef}
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {/* Branded header on the gradient — app icon + welcome copy. */}
          <View style={styles.header}>
            <View style={styles.iconTile}>
              <Image source={AppLogo} style={styles.iconImage} resizeMode="contain" />
            </View>
            <Text style={styles.brandTitle}>Employee Zone</Text>
            <Text style={styles.welcome}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* White card with rounded top corners overlaying the background.
              Bottom inset lives inside the card so the white reaches the screen
              edge — no gradient shows below it. */}
          <Reveal index={1} style={[styles.card, { paddingBottom: insets.bottom + 24 }]}>
            <Field
              label="Email"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              importantForAutofill="yes"
              focused={focused === 'email'}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              onFocusScroll={scrollFieldIntoView}
              error={errors.email}
            />

            <Field
              label="Password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={hidePassword}
              autoComplete="password"
              textContentType="password"
              focused={focused === 'password'}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              onFocusScroll={scrollFieldIntoView}
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

            <Pressable
              onPress={() => setRemember((r) => !r)}
              hitSlop={8}
              style={styles.rememberRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: remember }}
              accessibilityLabel="Remember me"
            >
              <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                {remember ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </Pressable>

            <PressableScale onPress={handleLogin} disabled={submitting} style={styles.buttonWrap}>
              <View style={[styles.button, submitting && styles.buttonDisabled]}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Log In</Text>
                )}
              </View>
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
  /** Scrolls this field into view above the keyboard; receives its node handle. */
  onFocusScroll?: (node: number | null) => void
}

const Field: React.FC<FieldProps> = ({
  label,
  icon,
  focused,
  error,
  trailing,
  style,
  onFocus,
  onFocusScroll,
  ...rest
}) => {
  const wrapRef = useRef<View>(null)
  return (
    <View ref={wrapRef} style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused, !!error && styles.fieldError]}>
        <Ionicons name={icon} size={20} color="#13A07C" style={styles.fieldIcon} />
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#9AA1AD"
          onFocus={(e) => {
            onFocus?.(e)
            onFocusScroll?.(findNodeHandle(wrapRef.current))
          }}
          {...rest}
        />
        {trailing}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}

/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#13A07C' },
  flex: { flex: 1 },
  // Header sits on the gradient at the top; the white card flows below it and
  // grows to fill the remaining space (rounded top corners overlay the backdrop).
  scroll: { flexGrow: 1, justifyContent: 'flex-start' },

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

  // Header (on the gradient)
  header: { alignItems: 'center', paddingHorizontal: 22, paddingBottom: 30 },
  iconTile: {
    width: 92,
    height: 92,
    borderRadius: 24,
    // backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#063D2F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  iconImage: { width: 92, height: 92 },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
    includeFontPadding: false,
    textAlign: 'center',
    opacity: 0.92,
  },
  welcome: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },

  // Card — rounded top corners, overlays the gradient, fills remaining height.
  card: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 28,
    marginTop: 10,
  },

  // Fields
  fieldWrap: { marginBottom: 20 },
  label: { color: '#2B3445', fontSize: 16, fontWeight: '700', marginBottom: 6 },
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

  // Remember me
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: 18,
    paddingVertical: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C2CAD6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: { backgroundColor: '#13A07C', borderColor: '#13A07C' },
  rememberText: { color: '#2B3445', fontSize: 14, fontWeight: '600' },

  // Button
  buttonWrap: { marginTop: 8, borderRadius: 30, overflow: 'hidden' },
  button: {
    height: 56,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14a973',
  },
  buttonDisabled: { opacity: 0.85 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
})