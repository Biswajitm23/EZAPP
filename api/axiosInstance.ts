import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import config from '@/config'
import {
  AUTH_STORAGE_KEY,
  authLog,
  isAccessTokenExpired,
  isRefreshTokenExpired,
  type StoredAuth,
} from '@/helpers/auth'
import { store } from '@/provider/store/store'
import { setSessionExpired } from '@/provider/slices/authSlice'
import { refreshAccessToken } from './refreshToken'

/**
 * Central axios instance for the Employee Zone API.
 *
 * - baseURL comes from `config.baseUrl` (app.json -> extra.baseUrl / EXPO_PUBLIC_BASE_URL)
 * - a request interceptor attaches the stored access token
 * - a response interceptor auto-refreshes on 401 using the stored refresh token
 *   (single-flight), rotates + saves the new tokens, and retries the request
 *
 * The refresh flow is ready to go: it activates the moment login starts
 * persisting a non-empty `refreshToken`. Until then there's no refresh token to
 * use, so a 401 simply propagates to the caller (today's behaviour).
 */
export const axiosInstance = axios.create({
  baseURL: config.baseUrl,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Request interceptor — proactively keep the access token fresh, then attach it.
//   1. no session            → send unauthenticated (login, refresh-bare, etc.)
//   2. refresh token expired  → logout (a refresh would be futile)
//   3. access token expired   → refresh first (single-flight), attach new token
//   4. access token valid     → attach it
axiosInstance.interceptors.request.use(
  async (req) => {
    try {
      const raw = await SecureStore.getItemAsync(AUTH_STORAGE_KEY)
      const auth = raw ? (JSON.parse(raw) as StoredAuth) : null
      if (!auth?.accessToken) return req

      const scheme = auth.tokenType || 'Bearer'

      if (isRefreshTokenExpired(auth)) {
        authLog('LOGOUT TRIGGERED')
        store.dispatch(setSessionExpired(true))
        return req
      }

      if (isAccessTokenExpired(auth)) {
        authLog('ACCESS EXPIRED')
        const newToken = await refreshAccessToken()
        if (newToken) {
          req.headers.Authorization = `${scheme} ${newToken}`
        }
        return req
      }

      req.headers.Authorization = `${scheme} ${auth.accessToken}`
    } catch (err) {
      if (__DEV__) {
        console.log('[axios] Failed to read/refresh auth token:', err)
      }
    }
    return req
  },
  (error) => Promise.reject(error)
)

/* -------------------------------------------------------------------------- */
/* Auto-refresh on 401                                                        */
/* -------------------------------------------------------------------------- */

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status
    const original = error?.config as ((typeof error.config) & { _retry?: boolean }) | undefined

    // On 401, try a (single-flight) token refresh once, then retry the request.
    // refreshAccessToken() uses a bare client, so it never re-enters here.
    if (status === 401 && original && !original._retry) {
      original._retry = true

      // Deactivated-account guard: if the backend signals the account is no
      // longer active, don't bother refreshing — clear the session and surface
      // the expiry immediately (mirrors the OLD APP interceptor).
      const resData = error?.response?.data
      if (resData?.status === 'ERROR' && resData?.message === 'Account is no longer active.') {
        if (__DEV__) {
          console.log('[axios] Account no longer active — forcing logout')
        }
        await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY).catch(() => {})
        store.dispatch(setSessionExpired(true))
        return Promise.reject(error)
      }

      const newAccessToken = await refreshAccessToken()
      if (newAccessToken) {
        original.headers = original.headers ?? {}
        ;(original.headers as Record<string, string>).Authorization = `Bearer ${newAccessToken}`
        return axiosInstance(original) // retry the original request
      }
      // Refresh unavailable/failed: session is invalid — fall through to reject.
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
