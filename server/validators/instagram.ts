import { z } from 'zod'

// Схема для валидации Instagram URL
export const instagramVideoSchema = z.object({
  url: z.string().url('Некорректный URL').refine(
    (url) => {
      const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[a-zA-Z0-9_-]+\/?/
      return instagramRegex.test(url)
    },
    'URL должен быть ссылкой на Instagram пост, Reel или IGTV'
  )
})

// Схема для валидации Instagram профиля
export const instagramProfileSchema = z.object({
  url: z.string().url('Некорректный URL').refine(
    (url) => {
      const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/
      return instagramRegex.test(url)
    },
    'URL должен быть ссылкой на Instagram профиль'
  )
})

// Схема для валидации хештега
export const instagramHashtagSchema = z.object({
  hashtag: z.string().min(1, 'Хештег не может быть пустым').max(50, 'Хештег слишком длинный'),
  limit: z.number().min(1).max(100).optional().default(10)
})

export type InstagramVideoInput = z.infer<typeof instagramVideoSchema>
export type InstagramProfileInput = z.infer<typeof instagramProfileSchema>
export type InstagramHashtagInput = z.infer<typeof instagramHashtagSchema> 