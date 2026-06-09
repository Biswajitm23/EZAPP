import { axiosInstance } from './axiosInstance'

export interface ApiRequestParams {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  params?: any
  headers?: any
  timeout?: number
  signal?: AbortSignal
}

/**
 * Thin, generic wrapper around the axios instance.
 *
 * Every service call ultimately goes through here so logging, error shaping,
 * and the auth/timeout handling live in one place.
 */
export const apiRequest = async <T = any>({
  url,
  method = 'GET',
  body,
  params,
  headers,
  timeout,
  signal,
}: ApiRequestParams): Promise<T> => {
  try {
    if (__DEV__) {
      console.log(`API Request → ${method} ${url}`)
    }
    const res = await axiosInstance({
      url,
      method,
      data: body,
      params,
      headers,
      ...(timeout && { timeout }),
      ...(signal && { signal }),
    })
    if (__DEV__) {
      console.log(
        'API Response:\n' +
          JSON.stringify({ url, method, status: res.status, data: res.data }, null, 2)
      )
    }
    return res.data as T
  } catch (error: any) {
    if (__DEV__) {
      console.log(
        'API Error Response:\n' +
          JSON.stringify(
            {
              url,
              status: error?.response?.status,
              data: error?.response?.data,
              message: error?.message,
            },
            null,
            2
          )
      )
    }
    // Re-throw so callers (components / react-query) can handle it.
    throw error
  }
}
