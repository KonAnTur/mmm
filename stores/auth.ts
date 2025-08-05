import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null as string | null,
    user: null as any,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },

  actions: {
    async sendVerificationCode(email: string) {
      try {
        const { data } = await axios.post('/api/auth/send-code', { email })
        return data
      } catch (error: any) {
        throw new Error(error.response?.data?.statusMessage || 'Ошибка отправки кода')
      }
    },

    async verifyCodeAndLogin(email: string, code: string) {
      try {
        const { data } = await axios.post('/api/auth/verify-code', {
          email,
          code
        })

        this.accessToken = data.accessToken
        this.user = data.user
        localStorage.setItem('accessToken', data.accessToken)
        
        return data
      } catch (error: any) {
        throw new Error(error.response?.data?.statusMessage || 'Ошибка верификации кода')
      }
    },

    // Сохраняем старый метод для совместимости
    async login(email: string, password: string) {
      try {
        const { data } = await axios.post('/api/users/login', {
          username: email,
          password: password
        })

        this.accessToken = data.accessToken
        localStorage.setItem('accessToken', data.accessToken)
        
        return data
      } catch (error) {
        throw new Error('Ошибка аутентификации')
      }
    },

    async logout() {
      try {
        // Отправляем запрос на сервер для выхода
        await axios.post('/api/users/logout')
      } catch (error) {
        console.error('Ошибка при выходе:', error)
      } finally {
        // В любом случае очищаем локальные данные
        this.accessToken = null
        this.user = null
        localStorage.removeItem('accessToken')
      }
    },

    async checkAuth() {
      try {
        const token = localStorage.getItem('accessToken')
        if (token) {
          // Проверяем валидность токена
          const response = await axios.get('/api/users/me')
          this.accessToken = token
          this.user = response.data.data
          return response.data.data
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error)
        this.logout()
      }
      return null
    }
  }
}) 