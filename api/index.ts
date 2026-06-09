/**
 * API barrel — single import surface for the data layer.
 *
 *   import { apiRequest, useApi, ENDPOINTS, authService, profileService } from '@/api'
 */

export { axiosInstance } from './axiosInstance'
export { apiRequest } from './apiRequest'
export type { ApiRequestParams } from './apiRequest'
export { refreshAccessToken, requestRefresh, saveRotatedTokens } from './refreshToken'
export { useApi } from './useApi'
export { ENDPOINTS } from './endpoints'

export { authService } from './services/authService'
export { profileService } from './services/profileService'
export { bitpointsService } from './services/bitpointsService'
<<<<<<< HEAD
export { collaborationService } from './services/collaborationService'
export { dashboardService } from './services/dashboardService'
=======
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43

export type * from './types'
