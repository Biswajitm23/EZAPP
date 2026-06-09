import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import config from '@/config'
import { AUTH_STORAGE_KEY } from '@/helpers/auth'
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

interface StoredTokens {
  accessToken?: string
  refreshToken?: string
  [k: string]: unknown
}

const readStoredAuth = async (): Promise<StoredTokens | null> => {
  try {
    const raw = await SecureStore.getItemAsync(AUTH_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredTokens) : null
  } catch {
    return null
  }
}

/** Persist the rotated token pair, preserving the rest of the session (user). */
export const saveRotatedTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  const current = (await readStoredAuth()) ?? {}
  await SecureStore.setItemAsync(
    AUTH_STORAGE_KEY,
    JSON.stringify({ ...current, accessToken, refreshToken })
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
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const auth = await readStoredAuth()
      const refreshToken = auth?.refreshToken
      if (!refreshToken) {
        // No refresh token yet — nothing to refresh. Surface the expiry so the
        // protected layer can route back to login (mirrors the OLD APP).
        store.dispatch(setSessionExpired(true))
        return null
      }

      try {
        const data = await requestRefresh(refreshToken)
        if (!data?.access_token || !data?.refresh_token) {
          throw new Error('Malformed refresh response')
        }
        await saveRotatedTokens(data.access_token, data.refresh_token)
        return data.access_token
      } catch {
        if (__DEV__) {
          console.log('[auth] Token refresh failed — clearing session')
        }
        await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY).catch(() => {})
        // Mark the session expired so a mounted screen/layout can react (toast
        // + redirect to login), matching the OLD APP's interceptor behaviour.
        store.dispatch(setSessionExpired(true))
        return null
      }
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}
