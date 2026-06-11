import * as SecureStore from 'expo-secure-store'
import type { UserProfile } from '@/api/types'

/**
 * Auth persistence helpers.
 *
 * The session (tokens + cached user) is stored in the device secure store so
 * it survives restarts. The axios request interceptor reads the access token
 * from here, and the app entry screen restores the redux state from it.
 */
export const AUTH_STORAGE_KEY = 'auth'

export interface StoredAuth {
  accessToken: string
  refreshToken: string
  /** "Bearer" — from the login / refresh response. */
  tokenType?: string
  /** Absolute epoch-ms the access token expires at: Date.now() + expires_in * 1000. */
  accessExpiresAt?: number
  /** Absolute epoch-ms the refresh token expires at: Date.now() + refresh_expires_in * 1000. */
  refreshExpiresAt?: number
  user: UserProfile | null
}

/**
 * Refresh the access token this many ms BEFORE it actually expires, to absorb
 * clock skew + request latency (so a token never expires mid-flight).
 */
export const TOKEN_EXPIRY_SKEW_MS = 30_000

/** Auth lifecycle logger — emits the exact event tags (ACCESS EXPIRED, REFRESH
 *  START/SUCCESS/ROTATED, LOGOUT TRIGGERED) used across the refresh flow. */
export const authLog = (event: string): void => {
  if (__DEV__) console.log(`[auth] ${event}`)
}

/** Convert a relative `expires_in` (seconds) into an absolute epoch-ms expiry. */
export const expiryFromNow = (seconds?: number | null): number | undefined =>
  typeof seconds === 'number' && seconds > 0 ? Date.now() + seconds * 1000 : undefined

/**
 * True when the access token is missing or within the skew window of expiry. When
 * the expiry is unknown (e.g. a session stored before expiry-tracking existed) we
 * return false so the request still goes out — the 401 response interceptor stays
 * the safety net.
 */
export const isAccessTokenExpired = (auth?: StoredAuth | null): boolean => {
  if (!auth?.accessToken) return true
  if (typeof auth.accessExpiresAt !== 'number') return false
  return Date.now() >= auth.accessExpiresAt - TOKEN_EXPIRY_SKEW_MS
}

/**
 * True only when we KNOW the refresh token has expired (so a /refresh call would
 * be futile and we should log out immediately). Unknown expiry → false (attempt
 * the refresh; a 401 will then trigger logout).
 */
export const isRefreshTokenExpired = (auth?: StoredAuth | null): boolean => {
  if (typeof auth?.refreshExpiresAt !== 'number') return false
  return Date.now() >= auth.refreshExpiresAt
}

export const saveAuth = async (auth: StoredAuth): Promise<void> => {
  try {
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(auth))
  } catch (err) {
    console.error('[auth] Failed to save session:', err)
  }
}

export const getAuth = async (): Promise<StoredAuth | null> => {
  try {
    const raw = await SecureStore.getItemAsync(AUTH_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredAuth) : null
  } catch (err) {
    console.error('[auth] Failed to read session:', err)
    return null
  }
}

export const clearStoredAuth = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY)
  } catch (err) {
    console.error('[auth] Failed to clear session:', err)
  }
}

/**
 * "Remember me" credentials.
 *
 * When the user opts in on the login screen we keep their email + password in
 * the device secure store so the next sign-in can be pre-filled. Presence of a
 * record means the box was checked; clearing it means it was unchecked. This is
 * separate from the session (AUTH_STORAGE_KEY) so signing out never wipes it.
 */
export const REMEMBER_STORAGE_KEY = 'remember_credentials'

export interface RememberedCredentials {
  email: string
  password: string
}

export const saveRememberedCredentials = async (
  creds: RememberedCredentials,
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(REMEMBER_STORAGE_KEY, JSON.stringify(creds))
  } catch (err) {
    console.error('[auth] Failed to save remembered credentials:', err)
  }
}

export const getRememberedCredentials = async (): Promise<RememberedCredentials | null> => {
  try {
    const raw = await SecureStore.getItemAsync(REMEMBER_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RememberedCredentials) : null
  } catch (err) {
    console.error('[auth] Failed to read remembered credentials:', err)
    return null
  }
}

export const clearRememberedCredentials = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(REMEMBER_STORAGE_KEY)
  } catch (err) {
    console.error('[auth] Failed to clear remembered credentials:', err)
  }
}
