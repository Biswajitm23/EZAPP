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
<<<<<<< HEAD

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
=======
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
