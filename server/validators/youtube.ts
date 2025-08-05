import { z } from 'zod'

// Схема для валидации YouTube URL (видео/shorts)
export const youtubeVideoSchema = z.object({
  url: z.string().url('Некорректный URL').refine(
    (url) => {
      // Расширенная поддержка YouTube Shorts и видео
      const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/
      const shortsRegex = /^https?:\/\/(www\.)?youtube\.com\/shorts\/[a-zA-Z0-9_-]{11}/
      const mobileRegex = /^https?:\/\/m\.youtube\.com\/(watch\?v=|shorts\/)[a-zA-Z0-9_-]{11}/
      
      return youtubeRegex.test(url) || shortsRegex.test(url) || mobileRegex.test(url)
    },
    'URL должен быть ссылкой на YouTube видео или Shorts'
  )
})

// Схема для валидации YouTube канала
export const youtubeChannelSchema = z.object({
  url: z.string().url('Некорректный URL').refine(
    (url) => {
      const youtubeChannelRegex = /^https?:\/\/(www\.)?youtube\.com\/(channel\/[a-zA-Z0-9_-]+|c\/[a-zA-Z0-9_-]+|user\/[a-zA-Z0-9_-]+|@[a-zA-Z0-9_.-]+)/
      return youtubeChannelRegex.test(url)
    },
    'URL должен быть ссылкой на YouTube канал'
  )
})

// Схема для валидации хештега YouTube
export const youtubeHashtagSchema = z.object({
  hashtag: z.string().min(1, 'Хештег не может быть пустым').max(50, 'Хештег слишком длинный'),
  limit: z.number().min(1).max(100).optional().default(15)
})

export type YoutubeVideoInput = z.infer<typeof youtubeVideoSchema>
export type YoutubeChannelInput = z.infer<typeof youtubeChannelSchema>
export type YoutubeHashtagInput = z.infer<typeof youtubeHashtagSchema> 