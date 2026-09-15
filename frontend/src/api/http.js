const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
export const ACCESS_TOKEN_KEY = 'emr_access_token'
export const REFRESH_TOKEN_KEY = 'emr_refresh_token'

let refreshRequest = null

export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refresh) throw new ApiError('Phien dang nhap da het han.', 401)

  if (!refreshRequest) {
    refreshRequest = fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok || !data.access) {
          clearAuthTokens()
          throw new ApiError(data.detail || 'Phien dang nhap da het han.', 401)
        }

        localStorage.setItem(ACCESS_TOKEN_KEY, data.access)
        if (data.refresh) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh)
        }
        return data.access
      })
      .finally(() => {
        refreshRequest = null
      })
  }

  return refreshRequest
}

export async function apiRequest(path, options = {}, canRetry = true) {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  const headers = new Headers(options.headers)

  if (
    options.body
    && !(options.body instanceof FormData)
    && !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => ({}))
  if (
    response.status === 401
    && canRetry
    && path !== '/auth/login/'
    && path !== '/auth/logout/'
  ) {
    await refreshAccessToken()
    return apiRequest(path, options, false)
  }

  if (!response.ok) {
    throw new ApiError(
      data.detail || 'Không thể kết nối đến hệ thống. Vui lòng thử lại.',
      response.status,
      data,
    )
  }

  return data
}

export async function apiFileRequest(path, options = {}, canRetry = true) {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401 && canRetry) {
    await refreshAccessToken()
    return apiFileRequest(path, options, false)
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(
      data.detail || 'Không thể tải tệp. Vui lòng thử lại.',
      response.status,
      data,
    )
  }

  return response.blob()
}
