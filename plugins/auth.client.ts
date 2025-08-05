import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  
  // Проверяем авторизацию при загрузке приложения
  if (process.client) {
    await authStore.checkAuth()
  }
}) 