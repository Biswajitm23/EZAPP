import Constants from 'expo-constants'

/**
 * App Configuration
 *
 * Reads from app.json -> expo.extra for production builds (APK/AAB),
 * and falls back to EXPO_PUBLIC_* environment variables in development.
 *
 * Usage:
 *   import config from '@/config'
 *   axios.get(config.baseUrl + 'profile')
 */

const extra = Constants.expoConfig?.extra

export const config = {
  // API Configuration — keep the trailing slash, e.g. ".../api/"
  baseUrl: extra?.baseUrl || process.env.EXPO_PUBLIC_BASE_URL || '',

  // Google Sign-In Configuration (existing Employee Zone portal uses Google OAuth)
  google: {
    webClientId: extra?.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    androidClientId: extra?.googleAndroidClientId || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    iosClientId: extra?.googleIosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  },
}

// Log configuration source for debugging
if (__DEV__) {
  console.log('App Configuration:', {
    baseUrl: config.baseUrl,
    source: extra?.baseUrl ? 'app.json' : 'env',
  })
}

export default config
