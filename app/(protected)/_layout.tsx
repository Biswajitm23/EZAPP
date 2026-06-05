import React, { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { useAppDispatch, useAppSelector } from '@/provider/hooks'
import { clearAuth } from '@/provider/slices/authSlice'
import { clearStoredAuth } from '@/helpers/auth'
import { useFeedback } from '@/components'

/**
 * Protected stack — guards everything under /(protected).
 *
 * If there is no authenticated session in the store, redirect back to /login.
 * (The entry screen at app/index.tsx restores the session before routing here,
 * so a logged-in user lands directly without a flash.)
 *
 * It also reacts to `sessionExpired` — set by the axios interceptor / refresh
 * flow on a hard 401 (refresh failed, no refresh token, or deactivated
 * account). On expiry it clears the session, shows a toast, and routes to
 * /login (mirrors the OLD APP's session-expiry handling).
 */
export default function ProtectedLayout() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { toast } = useFeedback()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const sessionExpired = useAppSelector((s) => s.auth.sessionExpired)

  // Hard session-expiry (from the interceptor): clear + notify + redirect.
  useEffect(() => {
    if (sessionExpired) {
      clearStoredAuth()
      dispatch(clearAuth())
      toast.error('Your session has expired. Please sign in again.')
      router.replace('/login')
    }
  }, [sessionExpired, dispatch, toast, router])

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade', animationDuration: 240 }} />
      <Stack.Screen
        name="content/[id]"
        options={{ animation: 'slide_from_right', animationDuration: 320, gestureEnabled: true }}
      />
    </Stack>
  )
}
