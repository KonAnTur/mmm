import { defineAuthenticatedEventHandler } from '~/server/extensions/auth'
import { prisma } from '~/server/utils/prisma'

export default defineAuthenticatedEventHandler(async (event, userData: any) => {
  try {
    // Получаем полную информацию о пользователе из БД
    const user = await prisma.users.findUnique({
      where: {
        id: userData.id
      },
      select: {
        id: true,
        username: true
        // password исключаем для безопасности
      }
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Пользователь не найден'
      })
    }

    return {
      success: true,
      data: user
    }
  } catch (error: any) {
    console.error('Ошибка при получении информации о пользователе:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Внутренняя ошибка сервера'
    })
  }
}) 