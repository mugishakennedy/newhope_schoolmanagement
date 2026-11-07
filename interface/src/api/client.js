import axios from 'axios'

export const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8000'

export const TOKEN_KEY = 'nh_token'
export const ROLE_KEY = 'nh_role'
export const USER_KEY = 'nh_user'

const authEndpoints = [
  '/students/login',
  '/students/register',
  '/auth/token',
  '/auth/refresh',
  '/dos/auth/token',
  '/dos/auth/refresh',
]

function isAuthEndpoint(url = '') {
  return authEndpoints.some((endpoint) => url.includes(endpoint))
}

let refreshPromise = null

function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(USER_KEY)
}

function redirectToLogin() {
  clearStoredSession()
  const path = window.location.pathname
  if (path !== '/login' && path !== '/register') {
    const redirect = encodeURIComponent(path + window.location.search)
    window.location.assign(`/login?expired=1&redirect=${redirect}`)
  }
}

function refreshSession() {
  const role = localStorage.getItem(ROLE_KEY)
  if (!role) {
    return Promise.reject(new Error('No active session'))
  }

  if (!refreshPromise) {
    const endpoint = role === 'dos' ? '/dos/auth/refresh' : '/auth/refresh'
    refreshPromise = axios
      .post(`${API_URL}${endpoint}`, null, { withCredentials: true })
      .then((response) => {
        localStorage.setItem(TOKEN_KEY, response.data.access_token)
        return response.data.access_token
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    if (
      status === 401 &&
      original &&
      !original._retried &&
      !isAuthEndpoint(original.url)
    ) {
      original._retried = true
      try {
        const token = await refreshSession()
        original.headers = {
          ...(original.headers || {}),
          Authorization: `Bearer ${token}`,
        }
        return api(original)
      } catch (refreshError) {
        redirectToLogin()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)

export function apiErrorMessage(error, fallback = 'Something went wrong') {
  const detail = error?.response?.data?.detail

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg || item.message)
      .filter(Boolean)
      .join(', ')
  }

  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Make sure the API is running.'
  }

  return error?.message || fallback
}

export default api
