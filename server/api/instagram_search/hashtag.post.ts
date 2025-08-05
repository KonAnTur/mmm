import { apifyService } from '~/server/services/apify'
import { instagramHashtagSchema } from '~/server/validators/instagram'

export default defineEventHandler(async (event) => {
  try {
    // Получаем тело запроса
    const body = await readBody(event)
    
    // Валидируем входящие данные
    const validatedData = instagramHashtagSchema.parse(body)
    
    // Парсим хештег через Apify
    const postsData = await apifyService.parseInstagramHashtag(
      validatedData.hashtag, 
      validatedData.limit
    )
    
    // Возвращаем результат
    return {
      success: true,
      data: {
        hashtag: validatedData.hashtag,
        posts: postsData,
        total: postsData.length
      },
      message: 'Хештег успешно обработан'
    }
    
  } catch (error: any) {
    console.error('Ошибка при обработке Instagram хештега:', error)
    
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
    
    // Общая ошибка сервера
    throw createError({
      statusCode: 500,
      statusMessage: 'Внутренняя ошибка сервера при обработке хештега'
    })
  }
}) 