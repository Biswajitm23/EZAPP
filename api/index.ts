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

export type * from './types'
