import axios from 'axios'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000
})

// ── Request Interceptor: attach JWT ───────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response Interceptor: handle 401 globally ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

/**
 * Decodes the JWT payload from localStorage.
 * Returns null if no token or token is malformed.
 */
export function getCurrentUser() {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    // Check expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      localStorage.removeItem('token')
      return null
    }
    return payload // { id, username, email, iat, exp }
  } catch {
    return null
  }
}
