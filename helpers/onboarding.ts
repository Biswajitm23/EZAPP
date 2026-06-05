import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * First-launch onboarding flag.
 *
 * Persists whether the user has already advanced past the onboarding / landing
 * page so it is shown only once. Backed by AsyncStorage; the key is namespaced
 * `@emp_*` to match the app's other stored preferences (e.g. `@emp_theme_mode`).
 *
 * The flag is written on *explicit advance* (the CTA on the landing page), not
 * merely on view — so killing the app while on the landing page keeps it
 * showing on next launch.
 */
const ONBOARDING_SEEN_KEY = '@emp_has_seen_onboarding'

/** Returns true once the user has tapped through the onboarding landing page. */
export const hasSeenOnboarding = async (): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_SEEN_KEY)) === 'true'
  } catch {
    return false
  }
}

/** Records that the user has seen (and advanced past) onboarding. */
export const markOnboardingSeen = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true')
  } catch {
    // Non-fatal: worst case onboarding shows again on next launch.
  }
}
