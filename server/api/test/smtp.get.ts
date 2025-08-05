export default defineEventHandler(async (event) => {
  try {
    const results = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        isDocker: !!process.env.DOCKER_ENV || !!process.env.HOSTNAME?.startsWith('docker'),
        hostname: process.env.HOSTNAME
      },
      smtp: {
        host: process.env.SMTP_HOST || 'НЕ ЗАДАН',
        port: process.env.SMTP_PORT || 'НЕ ЗАДАН',
        user: process.env.SMTP_USER ? 'ЗАДАН' : 'НЕ ЗАДАН',
        pass: process.env.SMTP_PASS ? 'ЗАДАН' : 'НЕ ЗАДАН',
        skipVerify: process.env.SKIP_SMTP_VERIFY,
        connectionTest: null as any,
        connectionError: null as any
      },
      connectivity: {
        dnsResolution: null as any,
        pingResult: null as any
      }
    }

    // Тест DNS резолва
    if (process.env.SMTP_HOST) {
      try {
        const dns = await import('dns').then(m => m.promises)
        const addresses = await dns.lookup(process.env.SMTP_HOST)
        results.connectivity.dnsResolution = {
          success: true,
          host: process.env.SMTP_HOST,
          ip: addresses.address,
          family: addresses.family
        }
      } catch (dnsError: any) {
        results.connectivity.dnsResolution = {
          success: false,
          error: dnsError.message
        }
      }
    }

    // Тест сокет соединения
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      try {
        const net = await import('net')
        const host = process.env.SMTP_HOST
        const port = parseInt(process.env.SMTP_PORT)
        
        const socketTest = await new Promise((resolve, reject) => {
          const socket = new net.Socket()
          const timeout = setTimeout(() => {
            socket.destroy()
            reject(new Error('Connection timeout'))
          }, 5000)
          
          socket.connect(port, host, () => {
            clearTimeout(timeout)
            socket.destroy()
            resolve({ success: true, host, port })
          })
          
          socket.on('error', (err) => {
            clearTimeout(timeout)
            reject(err)
          })
        })
        
        results.connectivity.pingResult = socketTest
      } catch (pingError: any) {
        results.connectivity.pingResult = {
          success: false,
          error: pingError.message
        }
      }
    }

    // Краткий тест SMTP (если настроен)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const { emailService } = await import('~/server/services/email-service')
        const smtpTest = await emailService.testConnection()
        results.smtp.connectionTest = smtpTest
      } catch (emailError: any) {
        results.smtp.connectionTest = false
        results.smtp.connectionError = emailError.message
      }
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      diagnostics: results,
      recommendations: generateRecommendations(results)
    }
  } catch (error: any) {
    console.error('Ошибка диагностики SMTP:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})

function generateRecommendations(results: any): string[] {
  const recommendations = []
  
  if (!results.smtp.host || results.smtp.host === 'НЕ ЗАДАН') {
    recommendations.push('Добавьте SMTP_HOST в переменные окружения')
  }
  
  if (!results.connectivity.dnsResolution?.success) {
    recommendations.push('Проблема с DNS резолвом - проверьте сетевые настройки контейнера')
  }
  
  if (!results.connectivity.pingResult?.success) {
    recommendations.push('Нет доступа к SMTP порту - возможно блокируется файрволом')
    recommendations.push('Попробуйте добавить SKIP_SMTP_VERIFY=true в .env')
  }
  
  if (results.environment.isDocker) {
    recommendations.push('Docker обнаружен - добавьте --network=host если нужен доступ к localhost')
    recommendations.push('Для облачных провайдеров используйте SKIP_SMTP_VERIFY=true')
  }
  
  if (results.smtp.host?.includes('gmail') && results.smtp.port !== '587') {
    recommendations.push('Для Gmail рекомендуется SMTP_PORT=587 и SMTP_SECURE=false')
  }
  
  return recommendations
} 