export default defineNuxtRouteMiddleware((to, from) => {
  // TODO: Здесь будет проверка аутентификации
  // Если пользователь уже авторизован, перенаправляем на главную страницу
  const isAuthenticated = false // Это нужно будет заменить на реальную проверку

  if (isAuthenticated) {
    return navigateTo('/')
  }
}) 