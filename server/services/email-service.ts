import nodemailer, { Transporter } from 'nodemailer';
import type { Options as SMTPTransportOptions } from 'nodemailer/lib/smtp-transport';

class EmailServiceReg {
  private transporter: Transporter<SMTPTransportOptions> | null = null;
  private isConfigured = false;

  constructor() {
    this.initTransporter();
  }

  /** Создаём SMTP-транспорт для REG.RU */
  private initTransporter() {
    const { REG_SMTP_HOST, REG_SMTP_PORT, REG_SMTP_USER } =
      process.env;

    const REG_SMTP_PASS = 'ROmdrkQaSMblMactg15l'

    if (!REG_SMTP_HOST || !REG_SMTP_PORT || !REG_SMTP_USER || !REG_SMTP_PASS) {
      console.error('❌ Не заданы переменные среды REG_SMTP_*');
      return;
    }
    console.log('Инициализация SMTP с параметрами:', {
      host: REG_SMTP_HOST,
      port: REG_SMTP_PORT,
      user: REG_SMTP_USER,
      secure: true
    });
    this.transporter = nodemailer.createTransport({
      host: '94.100.180.160',
      port: Number(REG_SMTP_PORT),  // конвертируем в число
      secure: true,                 // включаем для 465 порта
      tls: { servername: 'smtp.mail.ru' },
      auth: { user: REG_SMTP_USER, pass: REG_SMTP_PASS },
      logger: true, debug: true
    } as SMTPTransportOptions);

    this.isConfigured = true;
    console.log('✅ SMTP-транспорт REG.RU инициализирован');
  }

  /** Отправляем код подтверждения */
  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.error('❌ SMTP не настроен');
      return false;
    }

    try {
      const appName = process.env.APP_NAME || 'migom.ai';
      const from = `${process.env.REG_SMTP_USER}`;

      const info = await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Код подтверждения для входа',
        html: this.generateEmailHTML(code),
        text: this.generateEmailText(code),
      });

      console.log('✅ Письмо отправлено, id:', info.messageId);
      return true;
    } catch (err) {
      console.error('❌ Ошибка отправки:', err);
      return false;
    }
  }

  private generateEmailHTML(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Код подтверждения</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
            background-color: #f6f9fc; 
            margin: 0; 
            padding: 20px; 
            line-height: 1.6;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            padding: 40px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 1px solid #e1e8ed;
            padding-bottom: 20px;
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #4a90e2; 
            margin-bottom: 10px;
          }
          .subtitle {
            color: #666;
            font-size: 16px;
          }
          .code-container { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            border-radius: 12px; 
            padding: 30px; 
            text-align: center; 
            margin: 30px 0; 
          }
          .code { 
            font-size: 36px; 
            font-weight: bold; 
            color: white; 
            letter-spacing: 8px; 
            font-family: 'Courier New', monospace;
          }
          .code-label {
            color: rgba(255,255,255,0.8);
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .note { 
            background: #f8f9fa;
            border-left: 4px solid #4a90e2;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .note h3 {
            margin-top: 0;
            color: #333;
          }
          .note ul {
            margin-bottom: 0;
          }
          .note li {
            margin-bottom: 8px;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px;
            border-top: 1px solid #e1e8ed;
            color: #666; 
            font-size: 14px; 
          }
          .button {
            display: inline-block;
            background: #4a90e2;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">migom.ai</div>
            <div class="subtitle">Код подтверждения для входа</div>
          </div>
          
          <p>Здравствуйте!</p>
          <p>Для завершения входа в ваш аккаунт <strong>migom.ai</strong> введите код подтверждения:</p>
          
          <div class="code-container">
            <div class="code-label">Ваш код подтверждения</div>
            <div class="code">${code}</div>
          </div>
          
          <div class="note">
            <h3>⚠️ Важная информация:</h3>
            <ul>
              <li><strong>Код действителен 10 минут</strong> с момента отправки</li>
              <li>Никому не передавайте этот код</li>
              <li>Если вы не запрашивали код - проигнорируйте письмо</li>
              <li>При проблемах обратитесь в поддержку</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>С уважением,<br><strong>Команда migom.ai</strong></p>
            <p style="font-size: 12px; color: #999;">
              Это автоматическое письмо, не отвечайте на него
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateEmailText(code: string): string {
    return `
MIGOM.AI - Код подтверждения для входа

Здравствуйте!

Для завершения входа в ваш аккаунт введите код подтверждения:

КОД: ${code}

ВАЖНАЯ ИНФОРМАЦИЯ:
• Код действителен 10 минут с момента отправки
• Никому не передавайте этот код
• Если вы не запрашивали код - проигнорируйте письмо

С уважением,
Команда migom.ai

---
Это автоматическое письмо, не отвечайте на него.
    `.trim()
  }

  /** Быстрая проверка соединения */
  async testConnection(): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      await this.transporter.verify();
      console.log('✅ Соединение с SMTP REG.RU успешно');
      return true;
    } catch (e) {
      console.error('❌ Проверка не удалась:', e);
      return false;
    }
  }
}

export const emailService = new EmailServiceReg();