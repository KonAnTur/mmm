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
    
    const prompt = await prisma.prompt.findUnique({
      where: { id, user: String(userData.id) }
    })
    
    if (!prompt) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Промпт не найден'
      })
    }
    
    return {
      success: true,
      data: prompt
    }
  } catch (error: any) {
    console.error('Ошибка при получении промпта:', error)
    
    if (error.statusCode === 404) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Внутренняя ошибка сервера при получении промпта'
    })
  }
}) 