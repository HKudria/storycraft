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

let refreshPromise: Promise<string> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true

      if (!refreshPromise) {
        refreshPromise = api.post('/auth/refresh')
          .then(({ data }) => {
            localStorage.setItem('accessToken', data.accessToken)
            return data.accessToken as string
          })
          .catch(() => {
            localStorage.removeItem('accessToken')
            window.location.href = '/login'
            throw error
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      const newToken = await refreshPromise
      error.config.headers.Authorization = `Bearer ${newToken}`
      return api(error.config)
    }
    return Promise.reject(error)
  }
)

export default api
