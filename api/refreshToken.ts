import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import config from '@/config'
import {
  AUTH_STORAGE_KEY,
  authLog,
  expiryFromNow,
  isRefreshTokenExpired,
  type StoredAuth,
} from '@/helpers/auth'
import { store } from '@/provider/store/store'
import { setSessionExpired } from '@/provider/slices/authSlice'
import { ENDPOINTS } from './endpoints'
import type { RefreshResponse } from './types'

/**
 * Refresh-token logic — shared by the axios 401 interceptor and the explicit
 * `authService.refresh` call.
 *
 * Contract (POST /refresh): body { refresh_token }, returns { access_token,
 * refresh_token, token_type, expires_in, refresh_expires_in }. The backend
 * ROTATES the refresh token, so the new pair MUST be saved. Errors: 422
 * (missing refresh_token), 401 (invalid/expired/revoked).
 *
 * All calls here use a BARE axios client (no interceptors) so a refresh that
 * itself returns 401 can't recurse back through the response interceptor.
 */

const readStoredAuth = async (): Promise<StoredAuth | null> => {
  try {
    const raw = await SecureStore.getItemAsync(AUTH_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredAuth) : null
  } catch {
    return null
  }
}

const clearSession = (): Promise<void> =>
  SecureStore.deleteItemAsync(AUTH_STORAGE_KEY).catch(() => {})

/**
 * Persist the rotated token pair + refreshed expiry timestamps, preserving the
 * rest of the session (user). Rotation overwrites the OLD refresh token. When the
 * response omits a lifetime the prior expiry is kept.
 */
export const saveRotatedTokens = async (
  accessToken: string,
  refreshToken: string,
  expiresIn?: number,
  refreshExpiresIn?: number,
  tokenType?: string
): Promise<void> => {
  const current = (await readStoredAuth()) ?? ({} as Partial<StoredAuth>)
  await SecureStore.setItemAsync(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      ...current,
      accessToken,
      refreshToken,
      tokenType: tokenType ?? current.tokenType ?? 'Bearer',
      accessExpiresAt: expiryFromNow(expiresIn) ?? current.accessExpiresAt,
      refreshExpiresAt: expiryFromNow(refreshExpiresIn) ?? current.refreshExpiresAt,
    })
  )
}

/** Bare POST /refresh. Throws on 401/422. Does NOT persist — caller decides. */
export const requestRefresh = async (refreshToken: string): Promise<RefreshResponse> => {
  const { data } = await axios.post<RefreshResponse>(
    `${config.baseUrl}${ENDPOINTS.auth.refresh}`,
    { refresh_token: refreshToken },
    { headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, timeout: 20000 }
  )
  return data
}

// Single-flight: concurrent 401s share one in-flight refresh.
let refreshPromise: Promise<string | null> | null = null

/**
 * Refresh using the stored refresh token, rotate + save the new pair, and
 * return the new access token. Returns null when there is no refresh token, or
 * when the refresh fails (in which case the stored session is cleared so the
 * app can route back to login). Safe to call concurrently (single-flight).
 */
export const refreshAccessToken = (): Promise<string | null> => {
  // Single-flight: concurrent callers (multiple screens / queued 401s) share the
  // one in-flight refresh instead of each firing their own /refresh.
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const auth = await readStoredAuth()
    const refreshToken = auth?.refreshToken
    if (!refreshToken) {
      // No refresh token — nothing to refresh. Surface the expiry so the
      // protected layer routes back to login.
      authLog('LOGOUT TRIGGERED')
      store.dispatch(setSessionExpired(true))
      return null
    }

    // The refresh token itself has expired — a /refresh would just 401, so skip
    // straight to logout (rule 4: refresh_expires_at < Date.now()).
    if (isRefreshTokenExpired(auth)) {
      authLog('REFRESH SKIPPED — refresh token expired')
      authLog('LOGOUT TRIGGERED')
      await clearSession()
      store.dispatch(setSessionExpired(true))
      return null
    }

    authLog('REFRESH START')
    try {
      const data = await requestRefresh(refreshToken)
      if (!data?.access_token || !data?.refresh_token) {
        throw new Error('Malformed refresh response')
      }
      // Rotation: overwrite ALL stored auth values + the new expiry timestamps.
      await saveRotatedTokens(
        data.access_token,
        data.refresh_token,
        data.expires_in,
        data.refresh_expires_in,
        data.token_type
      )
      authLog('REFRESH SUCCESS')
      if (data.refresh_token !== refreshToken) authLog('REFRESH ROTATED')
      return data.access_token
    } catch {
      authLog('REFRESH FAILED')
      authLog('LOGOUT TRIGGERED')
      await clearSession()
      // Mark the session expired so the protected layout reacts (toast + redirect
      // to /login).
      store.dispatch(setSessionExpired(true))
      return null
    }
  })().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}
