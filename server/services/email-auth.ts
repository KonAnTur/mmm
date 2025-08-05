import { prisma } from '~/server/utils/prisma'

class EmailAuthService {
  
  // Генерация 6-значного кода
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Отправка кода на email через Resend API
  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    try {
      const { emailService } = await import('./email-service')
      const result = await emailService.sendVerificationCode(email, code)
      
      if (!result) {
        console.error(`❌ Не удалось отправить код на ${email}`)
        return false
      }
      
      return true
    } catch (error) {
      console.error('❌ Ошибка отправки email:', error)
      return false
    }
  }

  // Создание или обновление кода подтверждения
  async createVerificationCode(email: string): Promise<{ code: string, success: boolean }> {
    try {
      const code = this.generateVerificationCode()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 минут

      // Деактивируем все предыдущие коды для этого email
      await prisma.verificationCode.updateMany({
        where: { 
          email: email,
          isUsed: false 
        },
        data: { isUsed: true }
      })

      // Создаем новый код
      await prisma.verificationCode.create({
        data: {
          email,
          code,
          expiresAt,
          isUsed: false
        }
      })

      // Отправляем код на email
      const emailSent = await this.sendVerificationCode(email, code)
      
      if (!emailSent) {
        // Если email не отправился, удаляем созданный код
        await prisma.verificationCode.updateMany({
          where: { 
            email: email,
            code: code,
            isUsed: false 
          },
          data: { isUsed: true }
        })
        
        return { code: '', success: false }
      }
      
      return { code, success: true }
    } catch (error) {
      console.error('❌ Ошибка создания кода подтверждения:', error)
      return { code: '', success: false }
    }
  }

  // Проверка кода подтверждения
  async verifyCode(email: string, code: string): Promise<boolean> {
    try {
      const verificationRecord = await prisma.verificationCode.findFirst({
        where: {
          email,
          code,
          isUsed: false,
          expiresAt: {
            gt: new Date() // код не истёк
          }
        }
      })

      if (!verificationRecord) {
        return false
      }

      // Помечаем код как использованный
      await prisma.verificationCode.update({
        where: { id: verificationRecord.id },
        data: { isUsed: true }
      })

      return true
    } catch (error) {
      console.error('❌ Ошибка проверки кода:', error)
      return false
    }
  }

  // Получение или создание пользователя по email
  async findOrCreateUser(email: string): Promise<any> {
    try {
      // Ищем существующего пользователя
      let user = await prisma.users.findUnique({
        where: { email }
      })

      // Если пользователя нет, создаем нового
      if (!user) {
        user = await prisma.users.create({
          data: {
            email,
            username: email.split('@')[0], // используем часть email как username
          }
        })
      }

      return user
    } catch (error) {
      console.error('❌ Ошибка при поиске/создании пользователя:', error)
      return null
    }
  }
}

export const emailAuthService = new EmailAuthService() 