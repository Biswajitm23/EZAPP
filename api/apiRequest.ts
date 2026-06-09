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
<<<<<<< HEAD
    if (__DEV__) {
      console.log(`API Request → ${method} ${url}`)
    }
=======
    console.log(`API Request → ${method} ${url}`)
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
    const res = await axiosInstance({
      url,
      method,
      data: body,
      params,
      headers,
      ...(timeout && { timeout }),
      ...(signal && { signal }),
    })
<<<<<<< HEAD
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
=======
    console.log(
      'API Response:\n' +
        JSON.stringify({ url, method, status: res.status, data: res.data }, null, 2)
    )
    return res.data as T
  } catch (error: any) {
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
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
    // Re-throw so callers (components / react-query) can handle it.
    throw error
  }
}
