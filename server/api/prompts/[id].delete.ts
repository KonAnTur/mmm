import { prisma } from '~/server/utils/prisma'
import { defineAuthenticatedEventHandler } from '~/server/extensions/auth'

export default defineAuthenticatedEventHandler(async (event, userData: any) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID промпта обязателен'
      })
    }
    
    // Проверяем существование промпта
    const existingPrompt = await prisma.prompt.findUnique({
      where: { id, user: String(userData.id) }
    })
    
    if (!existingPrompt) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Промпт не найден'
      })
    }
    
    await prisma.prompt.delete({
      where: { id, user: String(userData.id) }
    })
    
    return {
      success: true,
      message: 'Промпт успешно удален'
    }
  } catch (error: any) {
    console.error('Ошибка при удалении промпта:', error)
    
    if (error.statusCode === 404) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Внутренняя ошибка сервера при удалении промпта'
    })
  }
}) 