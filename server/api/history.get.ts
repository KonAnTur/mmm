import { prisma } from '~/server/utils/prisma'
import { defineAuthenticatedEventHandler } from '~/server/extensions/auth'

export default defineAuthenticatedEventHandler(async (event, userData: any) => {
  try {
    const query = getQuery(event)
    const type = query.type as string // 'transcription' или 'reprocessing'
    
    const whereClause: any = { user: String(userData.id) }
    if (type) {
      whereClause.type = type
    }
    
    const history = await (prisma as any).requestHistory.findMany({
      where: whereClause,
      include: {
        prompt: {
          select: {
            id: true,
            name: true,
            text: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Ограничиваем до 50 записей
    })
    
    return {
      success: true,
      data: history
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении истории запросов: ' + error.message
    })
  }
}) 