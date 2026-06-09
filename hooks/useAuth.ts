import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/provider/hooks'
import { setAuthDetails, clearAuth } from '@/provider/slices/authSlice'
import { saveAuth, clearStoredAuth } from '@/helpers/auth'
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
      await saveAuth({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
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
