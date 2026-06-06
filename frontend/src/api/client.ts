import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

function forceLogout() {
  localStorage.removeItem('accessToken')
  refreshPromise = null
  window.location.href = '/login'
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (originalRequest.url === '/auth/refresh') {
      forceLogout()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (!refreshPromise) {
      refreshPromise = api.post('/auth/refresh')
        .then(({ data }) => {
          const token = data.accessToken as string
          localStorage.setItem('accessToken', token)
          return token
        })
        .catch(() => {
          forceLogout()
          return null
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    const newToken = await refreshPromise

    if (!newToken) {
      return Promise.reject(error)
    }

    originalRequest.headers.Authorization = `Bearer ${newToken}`
    return api(originalRequest)
  }
)

export default api
