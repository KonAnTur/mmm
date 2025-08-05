export default defineEventHandler(async (event) => {
  try {
    // В данной реализации logout просто возвращает успешный ответ
    // JWT токены stateless, поэтому серверная деактивация не требуется
    // Клиент сам удаляет токен из localStorage
    
    return {
      success: true,
      message: 'Выход выполнен успешно'
    }
  } catch (error: any) {
    console.error('Ошибка при выходе:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Внутренняя ошибка сервера'
    })
  }
}) 