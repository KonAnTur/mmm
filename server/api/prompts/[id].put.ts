import { prisma } from '~/server/utils/prisma'
import { z } from 'zod'
import { defineAuthenticatedEventHandler } from '~/server/extensions/auth'

// Схема валидации для обновления промпта
const updatePromptSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(120, 'Название не может быть длиннее 120 символов'),
  text: z.string().min(1, 'Текст промпта обязателен')
})

export default defineAuthenticatedEventHandler(async (event, userData: any) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID промпта обязателен'
      })
    }
    
    const body = await readBody(event)
    const validatedData = updatePromptSchema.parse(body)
    
    // Проверяем существование промпта
    const existingPrompt = await prisma.prompt.findUnique({
      where: { id }
    })
    
    if (!existingPrompt) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Промпт не найден'
      })
    }
    
    const prompt = await prisma.prompt.update({
      where: { id },
      data: {
        name: validatedData.name,
        text: validatedData.text,
        user: String(userData.id)
      }
    })
    
    return {
      success: true,
      data: prompt,
      message: 'Промпт успешно обновлен'
    }
  } catch (error: any) {
    console.error('Ошибка при обновлении промпта:', error)
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректные данные',
        data: {
          errors: error.errors
        }
      })
    }
    
    if (error.statusCode === 404) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Внутренняя ошибка сервера при обновлении промпта'
    })
  }
}) 