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
  user: UserProfile | null
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
