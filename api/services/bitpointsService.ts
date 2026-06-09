import { apiRequest } from '../apiRequest'
import { ENDPOINTS } from '../endpoints'
import type { BitpointsResponse } from '../types'

/**
 * Bitpoints / incentives service.
 */
export const bitpointsService = {
  /**
   * Full bitpoint + incentive history for the signed-in user.
   *
   * GET /bitpoints — Bearer auth, any logged-in role. Returns
   * { status, count, bitpoints: [...] } with rows newest-first; each row carries
   * both the bitpoints and incentives values, so this one call feeds both the
   * Bitpoints and Incentives screens. Throws on 401 (handled by the interceptor).
   */
  getBitpoints: (signal?: AbortSignal): Promise<BitpointsResponse> =>
    apiRequest<BitpointsResponse>({
      url: ENDPOINTS.bitpoints.list,
      method: 'GET',
      signal,
    }),
}