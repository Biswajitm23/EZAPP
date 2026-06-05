import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useAppDispatch } from '@/provider/hooks'
import { setAuthDetails } from '@/provider/slices/authSlice'
import { getAuth } from '@/helpers/auth'
import { hasSeenOnboarding } from '@/helpers'
import { Loader, ScreenContainer } from '@/components'

/**
 * App entry / splash gate.
 *
 * Restores any persisted session, then routes:
 *   - signed in  -> /(protected)/(tabs)/dashboard
 *   - signed out -> /onboarding on first launch, otherwise /login
 *
 * This is where you'd add a token-validity / refresh check before deciding.
 */
export default function Index() {
  const router = useRouter()
  const dispatch = useAppDispatch()

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      const stored = await getAuth()

      if (cancelled) return

      if (stored?.accessToken) {
        dispatch(
          setAuthDetails({
            token: { accessToken: stored.accessToken, refreshToken: stored.refreshToken ?? '' },
            isAuthenticated: true,
            sessionExpired: false,
            user: stored.user,
          })
        )
        router.replace('/(protected)/(tabs)/dashboard')
      } else {
        const seen = await hasSeenOnboarding()
        if (cancelled) return
        router.replace(seen ? '/login' : '/onboarding')
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [dispatch, router])

  return (
    <ScreenContainer>
      <Loader />
    </ScreenContainer>
  )
}
