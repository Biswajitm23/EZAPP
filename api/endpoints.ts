/**
 * Central registry of API endpoint paths.
 *
 * Paths are relative to `config.baseUrl` (which already ends in a slash).
 * Keeping them here means you change a route in exactly one place.
 *
 * TODO: replace these placeholder paths with the real Employee Zone API routes.
 */
export const ENDPOINTS = {
  auth: {
    login: 'login',
    googleLogin: 'auth/google',
    refresh: 'refresh',
    logout: 'logout',
    me: 'auth/me',
  },
  profile: {
    get: 'profile',
    update: 'profile/update',
    // Multipart upload/remove for the profile photo (field `profile_image`).
    // Upload: send the file. Remove: send an empty string. NOT JSON.
    picture: 'upload-profile-image',
  },
  directory: {
    list: 'employees',
    detail: (id: string | number) => `employees/${id}`,
  },
  // Full bitpoint + incentive history (newest first). Bearer auth. One endpoint
  // feeds both screens — each row carries the bitpoints and incentives values.
  bitpoints: {
    list: 'bitpoints',
  },
} as const
