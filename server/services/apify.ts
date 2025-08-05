import { ApifyClient } from 'apify-client'

export class ApifyService {
  private client: ApifyClient
  private apifyToken: string

  constructor() {
    this.apifyToken = process.env.APIFY_TOKEN || 'apify_api_5cbyRGXIQnlWQqtdT8U0bWg5SZWuEi1Tp8fL'
    this.client = new ApifyClient({ token: this.apifyToken })
  }

  /**
   * Парсит Instagram видео по URL
   */
  async parseInstagramVideo(videoUrl: string) {
    try {
      const runInput = {
        directUrls: [videoUrl],
        resultsType: 'posts',
        resultsLimit: 1,
        proxyConfiguration: { useApifyProxy: true }
      }

      console.log('Запуск Apify актора для Instagram видео:', videoUrl)
      
      const run = await this.client.actor('apify/instagram-scraper').call(runInput)
      const items = await this.client.dataset(run.defaultDatasetId).listItems()
      
      console.log('Получено результатов:', items.items.length)
      
      if (items.items.length === 0) {
        throw new Error('Видео не найдено или недоступно')
      }

      return items.items[0]
    } catch (error) {
      console.error('Ошибка при парсинге Instagram видео:', error)
      throw error
    }
  }

  /**
   * Парсит профиль Instagram по URL
   */
  async parseInstagramProfile(profileUrl: string) {
    try {
      const runInput = {
        directUrls: [profileUrl],
        resultsType: 'details',
        resultsLimit: 1,
        proxyConfiguration: { useApifyProxy: true }
      }

      console.log('Запуск Apify актора для Instagram профиля:', profileUrl)
      
      const run = await this.client.actor('apify/instagram-scraper').call(runInput)
      const items = await this.client.dataset(run.defaultDatasetId).listItems()
      
      console.log('Получено результатов:', items.items.length)
      
      if (items.items.length === 0) {
        throw new Error('Профиль не найден или недоступен')
      }

      return items.items[0]
    } catch (error) {
      console.error('Ошибка при парсинге Instagram профиля:', error)
      throw error
    }
  }

  /**
   * Парсит посты профилей Instagram по URL
   */
  async parseInstagramProfilePosts(profileUrls: string[], limit: number = 150) {
    try {
      const runInput = {
        directUrls: profileUrls,
        resultsType: 'posts',
        resultsLimit: limit,
        proxyConfiguration: { useApifyProxy: true }
      }

      console.log('Запуск Apify актора для постов Instagram профилей:', profileUrls.length, 'профилей')
      
      const run = await this.client.actor('apify/instagram-scraper').call(runInput)
      const items = await this.client.dataset(run.defaultDatasetId).listItems()
      
      console.log('Получено постов:', items.items.length)
      
      return items.items
    } catch (error) {
      console.error('Ошибка при парсинге постов Instagram профилей:', error)
      throw error
    }
  }

  /**
   * Парсит посты по хештегу
   */
  async parseInstagramHashtag(hashtag: string, limit: number = 10) {
    try {
      const hashtagUrl = `https://www.instagram.com/explore/tags/${hashtag}/`
      const runInput = {
        directUrls: [hashtagUrl],
        resultsType: 'posts',
        resultsLimit: limit,
        proxyConfiguration: { useApifyProxy: true }
      }

      console.log('Запуск Apify актора для Instagram хештега:', hashtag)
      
      const run = await this.client.actor('apify/instagram-scraper').call(runInput)
      const items = await this.client.dataset(run.defaultDatasetId).listItems()
      
      console.log('Получено результатов:', items.items.length)
      return items.items
    } catch (error) {
      console.error('Ошибка при парсинге Instagram хештега:', error)
      throw error
    }
  }

  /**
   * Парсит YouTube видео по URL (включая Shorts)
   */
  async parseYoutubeVideo(videoUrl: string) {
    try {
      // Извлекаем ID видео из URL
      const videoId = this.extractYoutubeVideoId(videoUrl)
      if (!videoId) {
        throw new Error('Не удалось извлечь ID видео из URL')
      }

      // Определяем, является ли это Shorts
      const isShorts = videoUrl.includes('/shorts/')
      
      console.log(`Парсинг YouTube ${isShorts ? 'Shorts' : 'видео'}:`, videoUrl, `(ID: ${videoId})`)

      // ТОЛЬКО Shorts - отклоняем обычные видео
      if (!isShorts) {
        throw new Error('Поддерживаются только YouTube Shorts видео (длительность ≤60 сек)')
      }

      const runInput = {
        startUrls: [{ url: videoUrl }], // Прямой URL конкретного видео
        maxResults: 0, // ТОЛЬКО Shorts - исключаем обычные видео
        maxResultsShorts: 1, // Только для Shorts
        maxResultStreams: 0,
        // dateFilter убираем - для конкретного видео не нужен
        sortBy: "relevance"
      }

      console.log('Запуск Apify актора для YouTube:', runInput)
      
      const run = await this.client.actor('streamers/youtube-scraper').call(runInput)
      const items = await this.client.dataset(run.defaultDatasetId).listItems()
      
      console.log(`Получено результатов: ${items.items.length}`)
      
      if (items.items.length === 0) {
        // Попробуем альтернативный способ через поиск по ID
        console.log('Повторная попытка через поиск по ID...')
        const fallbackInput = {
          searchQueries: [videoId], // Fallback через поиск, если прямой URL не сработал
          maxResults: 0, // ТОЛЬКО Shorts
          maxResultsShorts: 1, // Только для Shorts
          maxResultStreams: 0,
          dateFilter: "year",
          sortBy: "relevance"
        }
        
        const fallbackRun = await this.client.actor('streamers/youtube-scraper').call(fallbackInput)
        const fallbackItems = await this.client.dataset(fallbackRun.defaultDatasetId).listItems()
        
        if (fallbackItems.items.length === 0) {
          throw new Error('Видео не найдено или недоступно')
        }
        
        return fallbackItems.items[0]
      }

      // Фильтруем результат по ID если получили несколько
      const exactMatch = items.items.find((item: any) => item.id === videoId)
      return exactMatch || items.items[0]
      
    } catch (error) {
      console.error('Ошибка при парсинге YouTube видео/Shorts:', error)
      throw error
    }
  }

  /**
   * Парсит YouTube канал по URL (приоритет Shorts)
   */
  async parseYoutubeChannel(channelUrl: string) {
    try {
      const runInput = {
        startUrls: [{ url: channelUrl }], // Прямое указание канала, а не поиск
        maxResults: 0, // ТОЛЬКО Shorts - исключаем обычные видео
        maxResultsShorts: 25, // Увеличиваем количество Shorts
        maxResultStreams: 0,
        // dateFilter убираем - для прямого обхода канала не нужен
        sortBy: "date" // Сначала новые
      }

      console.log('Запуск Apify актора для YouTube канала (прямой обход, ТОЛЬКО Shorts):', channelUrl)
      
      const run = await this.client.actor('streamers/youtube-scraper').call(runInput)
      const items = await this.client.dataset(run.defaultDatasetId).listItems()
      
      // ТОЛЬКО Shorts - фильтруем обычные видео
      const shorts = items.items.filter((item: any) => 
        item.type === 'shorts' || 
        (item.duration && this.parseDurationSeconds(item.duration) <= 60)
      )
      
      console.log(`Получено результатов: ${items.items.length} → отфильтровано: ${shorts.length} ТОЛЬКО Shorts`)
      
      return shorts
    } catch (error) {
      console.error('Ошибка при парсинге YouTube канала:', error)
      throw error
    }
  }

  /**
   * Парсит видео по хештегу YouTube (приоритет Shorts)
   */
  async parseYoutubeHashtag(hashtag: string, limit: number = 15) {
    try {
      // Формируем прямые URL для хештега YouTube
      const hashtagUrls = [
        `https://www.youtube.com/hashtag/${hashtag}`, // Основная страница хештега
        `https://www.youtube.com/results?search_query=%23${encodeURIComponent(hashtag)}` // Поиск по хештегу как fallback
      ]
      
      const runInput = {
        startUrls: hashtagUrls.map(url => ({ url })), // Прямые URL хештегов
        maxResults: 0, // ТОЛЬКО Shorts - исключаем обычные видео
        maxResultsShorts: limit, // 100% Shorts
        maxResultStreams: 0,
        // dateFilter убираем - для прямого обхода хештегов не нужен
        sortBy: "viewCount" // Сортируем по популярности
      }

      console.log(`Запуск Apify актора для YouTube хештега #${hashtag} (прямые URL, ТОЛЬКО Shorts):`, hashtagUrls)
      
      const run = await this.client.actor('streamers/youtube-scraper').call(runInput)
      const items = await this.client.dataset(run.defaultDatasetId).listItems()
      
      // ТОЛЬКО Shorts - фильтруем обычные видео
      const shorts = items.items.filter((item: any) => 
        item.type === 'shorts' || 
        (item.duration && this.parseDurationSeconds(item.duration) <= 60)
      )
      
      // Сортируем Shorts по просмотрам и ограничиваем лимитом
      shorts.sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0))
      const limitedShorts = shorts.slice(0, limit)
      
      console.log(`Получено результатов: ${items.items.length} → отфильтровано: ${limitedShorts.length} ТОЛЬКО Shorts`)
      
      return limitedShorts
    } catch (error) {
      console.error('Ошибка при парсинге YouTube хештега:', error)
      throw error
    }
  }

  /**
   * Извлекает ID видео из YouTube URL
   */
  private extractYoutubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }
    
    return null
  }

  /**
   * Парсит длительность видео в секундах
   */
  private parseDurationSeconds(duration: string): number {
    if (!duration) return 0
    
    // Формат может быть "MM:SS" или "HH:MM:SS" или "00:00:30"
    const parts = duration.split(':').map(Number)
    
    if (parts.length === 1) {
      return parts[0] // Только секунды
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1] // MM:SS
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2] // HH:MM:SS
    }
    
    return 0
  }
}

// Создаем синглтон экземпляр
export const apifyService = new ApifyService() 