import { z } from 'zod'
import { emailAuthService } from '~/server/services/email-auth'

const SendCodeSchema = z.object({
  email: z.string().email('Некорректный email адрес')
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email } = SendCodeSchema.parse(body)

    // Создаем и отправляем код подтверждения
    const result = await emailAuthService.createVerificationCode(email)

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Ошибка отправки кода подтверждения'
      })
    }

    return {
      success: true,
      message: 'Код подтверждения отправлен на ваш email'
    }
  } catch (error: any) {
    console.error('Ошибка отправки кода:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Ошибка валидации данных'
    })
  }
}) 