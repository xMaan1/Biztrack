import axios from 'axios'

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
  timeout: 30000,
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(process.env.NEXT_PUBLIC_TOKEN_KEY || 'access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem(
        process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || 'refresh_token'
      )

      if (refreshToken) {
        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v1/auth/refresh`,
            { refresh_token: refreshToken }
          )

          if (response.data?.data?.access_token) {
            const { access_token } = response.data.data
            localStorage.setItem(
              process.env.NEXT_PUBLIC_TOKEN_KEY || 'access_token',
              access_token
            )
            originalRequest.headers.Authorization = `Bearer ${access_token}`
            return apiClient(originalRequest)
          }
        } catch {
          // Refresh failed - just reject, let calling code handle
        }
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient