import { prisma } from '~/server/utils/prisma'
import { z } from 'zod'
import { defineAuthenticatedEventHandler } from '~/server/extensions/auth'

// Схема валидации для создания промпта
const createPromptSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(120, 'Название не может быть длиннее 120 символов'),
  text: z.string().min(1, 'Текст промпта обязателен')
})

export default defineAuthenticatedEventHandler(async (event, userData: any) => {
  try {
    const body = await readBody(event)
    const validatedData = createPromptSchema.parse(body)
    
    const prompt = await prisma.prompt.create({
      data: {
        name: validatedData.name,
        text: validatedData.text,
        user: String(userData.id)
      }
    })
    
    return {
      success: true,
      data: prompt,
      message: 'Промпт успешно создан'
    }
  } catch (error: any) {
    console.error('Ошибка при создании промпта:', error)
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректные данные',
        data: {
          errors: error.errors
        }
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Внутренняя ошибка сервера при создании промпта'
    })
  }
}) 