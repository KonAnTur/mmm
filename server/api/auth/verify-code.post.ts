import { z } from 'zod'
import { emailAuthService } from '~/server/services/email-auth'
import { userService } from '~/server/services/users'

const VerifyCodeSchema = z.object({
  email: z.string().email('Некорректный email адрес'),
  code: z.string().length(6, 'Код должен содержать 6 цифр')
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, code } = VerifyCodeSchema.parse(body)

    // Проверяем код подтверждения
    const isCodeValid = await emailAuthService.verifyCode(email, code)

    if (!isCodeValid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Неверный или истёкший код подтверждения'
      })
    }

    // Находим или создаем пользователя
    const user = await emailAuthService.findOrCreateUser(email)

    if (!user) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Ошибка создания пользователя'
      })
    }

    // Генерируем токены
    const tokens = userService.createTokens({
      id: user.id,
      username: user.username,
      email: user.email
    })

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      ...tokens
    }
  } catch (error: any) {
    console.error('Ошибка верификации кода:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Ошибка валидации данных'
    })
  }
}) 