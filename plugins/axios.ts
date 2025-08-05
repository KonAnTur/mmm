import axios from 'axios'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  
  // Добавляем базовый URL из конфигурации
  axios.defaults.baseURL = config.public.apiBase

  // Добавляем токен к каждому запросу
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Обработка ответов
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        navigateTo('/login')
      }
      return Promise.reject(error)
    }
  )
}) 