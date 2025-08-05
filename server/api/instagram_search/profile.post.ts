import { apifyService } from '~/server/services/apify'
import { instagramProfileSchema } from '~/server/validators/instagram'

export default defineEventHandler(async (event) => {
  try {
    // Получаем тело запроса
    const body = await readBody(event)
    
    // Валидируем входящие данные
    const validatedData = instagramProfileSchema.parse(body)
    
    // Парсим профиль через Apify
    const profileData = await apifyService.parseInstagramProfile(validatedData.url)
    
    // Возвращаем результат
    return {
      success: true,
      data: profileData,
      message: 'Профиль успешно обработан'
    }
    
  } catch (error: any) {
    console.error('Ошибка при обработке Instagram профиля:', error)
    
    // Если ошибка валидации
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректные данные',
        data: {
          errors: error.errors
        }
      })
    }
    
    // Если ошибка от Apify
    if (error.message?.includes('не найден') || error.message?.includes('недоступен')) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Профиль не найден или недоступен'
      })
    }
    
    // Общая ошибка сервера
    throw createError({
      statusCode: 500,
      statusMessage: 'Внутренняя ошибка сервера при обработке профиля'
    })
  }
}) 