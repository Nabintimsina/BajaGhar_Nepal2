import i18n from '../i18n/config'

const isLocalhostHost = (hostname) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'

const resolveApiUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

  if (configuredUrl) {
    try {
      const configuredHost = new URL(configuredUrl).hostname
      if (!isLocalhostHost(window.location.hostname) && isLocalhostHost(configuredHost)) {
        return `${window.location.origin}/api`
      }

      return configuredUrl
    } catch {
      return configuredUrl
    }
  }

  // During local development, default to the backend running on port 8000
  // This avoids proxying problems when the frontend dev server runs on 3000/5173
  if (import.meta.env.DEV && isLocalhostHost(window.location.hostname)) {
    return 'http://127.0.0.1:8000'
  }

  return `${window.location.origin}/api`
}

const API_URL = resolveApiUrl()
const AUTH_TOKEN_KEY = 'auth_token'

const getActiveLanguage = () => {
  const language = (i18n.language || localStorage.getItem('language') || 'en').toLowerCase()
  return language.startsWith('ne') ? 'ne' : 'en'
}

const buildUrl = (path, params) => {
  const cleanPath = path.replace(/^\/+/, '')
  const url = new URL(`${API_URL}/${cleanPath}`)
  const activeLanguage = getActiveLanguage()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all') {
        return
      }
      url.searchParams.set(key, value)
    })
  }

  if (!url.searchParams.has('lang')) {
    url.searchParams.set('lang', activeLanguage)
  }

  return url.toString()
}

const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY)

const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  }
}

const clearAuthToken = () => localStorage.removeItem(AUTH_TOKEN_KEY)

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token')
  
  if (!refreshToken) {
    clearAuthToken()
    return null
  }

  try {
    const response = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken })
    })

    if (!response.ok) {
      clearAuthToken()
      localStorage.removeItem('refresh_token')
      return null
    }

    const data = await response.json()
    
    if (data?.access) {
      setAuthToken(data.access)
      if (data?.refresh) {
        localStorage.setItem('refresh_token', data.refresh)
      }
      return data.access
    }

    clearAuthToken()
    return null
  } catch {
    clearAuthToken()
    localStorage.removeItem('refresh_token')
    return null
  }
}

const extractErrorMessage = async (response) => {
  const fallbackMessage = response.statusText || 'Request failed'

  try {
    const payload = await response.json()

    if (typeof payload === 'string') {
      return payload
    }

    if (Array.isArray(payload)) {
      return payload.join(' ')
    }

    if (payload?.detail) {
      return payload.detail
    }

    if (payload?.error) {
      return payload.error
    }

    if (payload?.non_field_errors) {
      return Array.isArray(payload.non_field_errors)
        ? payload.non_field_errors.join(' ')
        : String(payload.non_field_errors)
    }

    const fieldMessages = Object.entries(payload || {})
      .filter(([key]) => key !== 'detail' && key !== 'error' && key !== 'non_field_errors')
      .flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((message) => `${key}: ${message}`)
        }

        if (value && typeof value === 'object') {
          return [`${key}: ${JSON.stringify(value)}`]
        }

        return [`${key}: ${String(value)}`]
      })

    if (fieldMessages.length > 0) {
      return fieldMessages.join(' ')
    }
  } catch {
    return fallbackMessage
  }

  return fallbackMessage
}

const request = async (path, options = {}) => {
  const { params, body, headers, method = 'GET' } = options
  const url = buildUrl(path, params)
  let authToken = getAuthToken()
  const isFormData = body instanceof FormData

  const requestHeaders = {
    ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...headers
  }

  let response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined
  })

  // If 401 Unauthorized, try to refresh token and retry
  if (response.status === 401 && authToken) {
    const newToken = await refreshAccessToken()
    
    if (newToken) {
      // Retry request with new token
      const retryHeaders = {
        ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${newToken}`,
        ...headers
      }

      response = await fetch(url, {
        method,
        headers: retryHeaders,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined
      })
    } else if (method === 'GET') {
      // Public reads should still work when an old login token is left in storage.
      response = await fetch(url, {
        method,
        headers: { ...headers },
      })
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      const authError = new Error('Your session has expired. Please log in again.')
      authError.code = 'AUTH_EXPIRED'
      throw authError
    }
    throw new Error(await extractErrorMessage(response))
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' })
}

export { API_URL, api, getAuthToken, setAuthToken, clearAuthToken, refreshAccessToken }
