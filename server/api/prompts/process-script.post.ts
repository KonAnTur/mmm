import { prisma } from '~/server/utils/prisma'
import { z } from 'zod'
import { defineAuthenticatedEventHandler } from '~/server/extensions/auth'

import {
    GoogleGenAI,
    createUserContent,
} from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// Схема валидации для обработки сценария
const processScriptSchema = z.object({
  promptId: z.string().min(1, 'ID промпта обязателен'),
  script: z.string().min(1, 'Сценарий обязателен')
})

export default defineAuthenticatedEventHandler(async (event, userData: any) => {
  const startTime = Date.now()
  try {
    const body = await readBody(event)
    const validatedData = processScriptSchema.parse(body)
    
    // Получаем промпт пользователя
    const prompt = await prisma.prompt.findUnique({
      where: { 
        id: validatedData.promptId,
        user: String(userData.id)
      }
    })
    
    if (!prompt) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Промпт не найден'
      })
    }
    
    // Формируем запрос к LLM
    const llmPrompt = `${prompt.text}\n\nСценарий для обработки:\n${validatedData.script}\n\nПожалуйста, обработайте этот сценарий согласно инструкциям в промпте выше.`
    
    // Отправляем запрос к Google GenAI
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: createUserContent([llmPrompt]),
    });
    
    const processedScript = response.text;
    const processingTime = Date.now() - startTime
    
    // Сохраняем результат в историю
    try {
      console.log('Сохраняю в историю переработку для пользователя:', userData.id)
      await (prisma as any).requestHistory.create({
        data: {
          type: 'reprocessing',
          user: String(userData.id),
          originalScript: validatedData.script,
          promptId: prompt.id,
          result: processedScript,
          processingTime: processingTime,
          status: 'success'
        }
      })
      console.log('Успешно сохранено в историю')
    } catch (dbError) {
      console.error('Ошибка при сохранении в историю:', dbError)
      // Не прерываем выполнение, если не удалось сохранить в БД
    }
    
    return {
      success: true,
      data: {
        originalScript: validatedData.script,
        processedScript: processedScript,
        prompt: {
          id: prompt.id,
          name: prompt.name,
          text: prompt.text
        }
      },
      message: 'Сценарий успешно обработан'
    }
    
  } catch (error: any) {
    console.error('Ошибка при обработке сценария:', error)
    
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
      statusMessage: 'Внутренняя ошибка сервера при обработке сценария'
    })
  }
}) 