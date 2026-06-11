import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/provider/hooks'
import { setAuthDetails, clearAuth } from '@/provider/slices/authSlice'
import { saveAuth, clearStoredAuth, expiryFromNow, authLog } from '@/helpers/auth'
import { authService } from '@/api'
import type { LoginResult } from '@/api/types'

/**
 * Convenience hook for reading + mutating auth state.
 *
 * Keeps the redux store and the secure-store session in sync, so screens just
 * call `signIn(result)` / `signOut()` without worrying about persistence.
 */
export const useAuth = () => {
  const dispatch = useAppDispatch()
  const auth = useAppSelector((s) => s.auth)

  const signIn = useCallback(
    async (result: LoginResult) => {
      // Turn the relative lifetimes into absolute expiry timestamps and persist
      // the full session (tokens + type + expiries) to secure storage.
      await saveAuth({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tokenType: result.tokenType ?? 'Bearer',
        accessExpiresAt: expiryFromNow(result.expiresIn),
        refreshExpiresAt: expiryFromNow(result.refreshExpiresIn),
        user: result.user,
      })
      dispatch(
        setAuthDetails({
          token: { accessToken: result.accessToken, refreshToken: result.refreshToken },
          isAuthenticated: true,
          sessionExpired: false,
          user: result.user,
        })
      )
    },
    [dispatch]
  )

  const signOut = useCallback(async () => {
    authLog('LOGOUT TRIGGERED')
    try {
      await authService.logout()
    } catch {
      // Ignore network errors on logout — we clear locally regardless.
    }
    await clearStoredAuth()
    dispatch(clearAuth())
  }, [dispatch])

  return {
    ...auth,
    signIn,
    signOut,
  }
}
