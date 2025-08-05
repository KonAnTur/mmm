export default defineNuxtRouteMiddleware(async (to) => {
    const authStore = useAuthStore()
    
    // Если токен есть в localStorage, но store не инициализован, проверяем
    if (!authStore.isAuthenticated && process.client) {
        const token = localStorage.getItem('accessToken')
        if (token) {
            await authStore.checkAuth()
        }
    }

    if (!authStore.isAuthenticated) {
        return navigateTo('/login')
    }
}) 