import { apifyService } from '~/server/services/apify'
import { prisma } from '~/server/utils/prisma'

/**
 * Разбивает массив на чанки заданного размера
 */
function chunked<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Конвертирует строку продолжительности в секунды (аналог Python функции)
 */
function convertDurationToSeconds(durationStr: string): number {
  if (!durationStr) return 0
  
  try {
    // Формат может быть "MM:SS" или "HH:MM:SS"
    const parts = durationStr.split(':').map(Number)
    
    if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    
    return 0
  } catch (error) {
    console.error(`❌ Ошибка конвертации продолжительности "${durationStr}":`, error)
    return 0
  }
}

/**
 * Определяет является ли видео YouTube Shorts (≤60 секунд)
 */
function isYouTubeShorts(video: any): boolean {
  // Проверяем по URL (содержит /shorts/)
  if (video.url && video.url.includes('/shorts/')) {
    return true
  }
  
  // Проверяем по продолжительности
  if (video.duration) {
    const durationSec = convertDurationToSeconds(video.duration)
    return durationSec > 0 && durationSec <= 60
  }
  
  return false
}

/**
 * Фильтрует ТОЛЬКО YouTube Shorts видео
 */
function prioritizeYouTubeShorts(videos: YoutubeVideoData[]): YoutubeVideoData[] {
  // ТОЛЬКО Shorts - исключаем обычные видео
  const shorts: YoutubeVideoData[] = []
  
  videos.forEach(video => {
    if (isYouTubeShorts(video)) {
      shorts.push(video)
    }
  })
  
  // Сортируем Shorts по популярности (просмотры)
  shorts.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
  
  console.log(`🎯 Фильтрация: ${shorts.length} ТОЛЬКО Shorts из ${videos.length} видео`)
  
  // Ограничиваем до 150 Shorts максимум
  const result = shorts.slice(0, 150)
  
  console.log(`📊 Итоговый отбор: ${result.length} ТОЛЬКО Shorts`)
  
  return result
}

/**
 * Декодирует URL-кодированную строку (аналог Python unquote)
 */
function decodeUrlString(str: string): string {
  if (!str) return str
  
  try {
    // Декодируем URL-кодированную строку
    return decodeURIComponent(str)
  } catch (error) {
    console.error(`❌ Ошибка декодирования URL строки "${str}":`, error)
    return str
  }
}

/**
 * Структура профиля Instagram из Apify
 */
interface InstagramProfileData {
  username?: string
  fullName?: string
  biography?: string
  followersCount?: number
  followsCount?: number
  profilePicUrl?: string
  isPrivate?: boolean
  isVerified?: boolean
  postsCount?: number
  [key: string]: any
}

/**
 * Структура поста Instagram из Apify
 */
interface InstagramPostData {
  id: string
  username?: string
  ownerUsername?: string
  caption?: string
  type?: string
  url?: string
  timestamp?: number | string
  likesCount?: number
  videoPlayCount?: number
  commentsCount?: number
  videoDuration?: number
  duration?: string
  [key: string]: any
}

/**
 * Структура YouTube канала из Apify
 */
interface YoutubeChannelData {
  channelUsername?: string
  channelName?: string
  channelUrl?: string
  channelId?: string
  numberOfSubscribers?: number
  channelTotalVideos?: number
  channelTotalViews?: number
  isChannelVerified?: boolean
  channelDescription?: string
  channelAvatarUrl?: string
  [key: string]: any
}

/**
 * Структура YouTube видео из Apify
 */
interface YoutubeVideoData {
  id: string
  title?: string
  url?: string
  viewCount?: number
  likes?: number
  commentsCount?: number
  date?: string
  duration?: string
  channelUsername?: string
  channelName?: string
  channelId?: string
  text?: string
  [key: string]: any
}

export class ParserService {
  private static readonly BATCH_SIZE = 20
  private static readonly POSTS_LIMIT = 500

  /**
   * Парсит Instagram профили через Apify и сохраняет в БД
   * Аналог Python функции parse_instagram_profiles
   */
  static async parseInstagramProfiles(
    profileUrls: string[], 
    isPublic: boolean = true
  ): Promise<void> {
    if (profileUrls.length === 0) {
      console.log('🔍 Нет профилей для парсинга')
      return
    }

    console.log(`🚀 Начинаю парсинг ${profileUrls.length} Instagram профилей (public: ${isPublic})`)
    console.log(`📋 Профили для парсинга:`, profileUrls)

    try {
      // 1. Парсим детали профилей
      const allProfileItems: InstagramProfileData[] = []
      const chunks = chunked(profileUrls, this.BATCH_SIZE)

      console.log(`📦 Разбито на ${chunks.length} чанков по ${this.BATCH_SIZE} профилей`)

      for (const chunk of chunks) {
        console.log(`📊 Обрабатываю чанк из ${chunk.length} профилей:`, chunk)
        
        try {
          // Парсим профили по одному, используя готовый метод
          for (const profileUrl of chunk) {
            try {
              console.log(`🔍 Парсю профиль: ${profileUrl}`)
              const profileData = await apifyService.parseInstagramProfile(profileUrl)
              allProfileItems.push(profileData as InstagramProfileData)
              console.log(`✅ Получен профиль: ${profileData.username} (${profileData.followersCount} подписчиков)`)
            } catch (error) {
              console.error(`❌ Ошибка при парсинге профиля ${profileUrl}:`, error)
              continue
            }
          }
        } catch (error) {
          console.error(`❌ Ошибка при парсинге чанка профилей:`, error)
          continue
        }
      }

      // 2. Сохраняем профили в БД
      console.log(`💾 Сохраняю ${allProfileItems.length} профилей в БД`)
      await this.upsertProfiles(allProfileItems, isPublic)

      // 3. Если профили публичные, парсим их посты
      if (isPublic && allProfileItems.length > 0) {
        console.log(`📸 Профили публичные (${isPublic}) и успешно спарсены (${allProfileItems.length}), начинаю парсинг постов`)
        await this.parseProfilePosts(profileUrls)
      } else {
        if (!isPublic) {
          console.log(`🔒 Профили не публичные, пропускаю парсинг постов`)
        } else {
          console.log(`⚠️ Нет успешно спарсенных профилей, пропускаю парсинг постов`)
        }
      }

      console.log(`🎉 Парсинг завершен успешно!`)
    } catch (error) {
      console.error(`❌ Критическая ошибка при парсинге профилей:`, error)
      throw error
    }
  }

  /**
   * Парсит посты профилей через новый метод ApifyService
   */
  private static async parseProfilePosts(profileUrls: string[]): Promise<void> {
    console.log(`📸 Начинаю парсинг постов для ${profileUrls.length} профилей`)
    const allPosts: InstagramPostData[] = []
    const chunks = chunked(profileUrls, this.BATCH_SIZE)

    console.log(`📦 Разбито на ${chunks.length} чанков для парсинга постов`)

    for (const chunk of chunks) {
      console.log(`📸 Парсю посты для ${chunk.length} профилей:`, chunk)
      
      try {
        // Используем новый метод ApifyService для парсинга постов профилей
        console.log(`🚀 Вызываю apifyService.parseInstagramProfilePosts с лимитом ${this.POSTS_LIMIT}`)
        const posts = await apifyService.parseInstagramProfilePosts(chunk, this.POSTS_LIMIT)
        
        console.log(`📊 Получено ${posts.length} постов из Apify`)
        
        if (posts.length > 0) {
          console.log(`🔍 Примеры полученных постов:`)
          posts.slice(0, 3).forEach((post: any, index: number) => {
            console.log(`  ${index + 1}. ID: ${post.id}, type: ${post.type}, username: ${post.username || post.ownerUsername}`)
          })
        }
        
        // Фильтруем только видео
        const videoPosts = posts.filter((post: any) => post.type === 'Video')
        allPosts.push(...(videoPosts as InstagramPostData[]))
        
        console.log(`✅ Отфильтровано ${videoPosts.length} видео-постов из ${posts.length} постов`)

      } catch (error) {
        console.error(`❌ Ошибка при парсинге постов для чанка:`, error)
        continue
      }
    }

    // Сохраняем посты в БД
    if (allPosts.length > 0) {
      console.log(`💾 Найдено ${allPosts.length} видео-постов, начинаю сохранение в БД`)
      await this.upsertPosts(allPosts, 'profiles')
    } else {
      console.log(`⚠️ Не найдено видео-постов для сохранения`)
    }
  }

  /**
   * Сохраняет профили в БД (аналог Python upsert_profiles)
   */
  private static async upsertProfiles(
    items: InstagramProfileData[], 
    isPublic: boolean
  ): Promise<void> {
    const chunks = chunked(items, 100)
    
    for (const chunk of chunks) {
      const profileData = chunk.map(profile => ({
        platform: 'instagram',
        username: profile.username || '',
        displayName: profile.fullName || null,
        profilePic: profile.profilePicUrl || null,
        profileBio: profile.biography || null,
        followers: profile.followersCount || 0,
        following: profile.followsCount || 0,
        latestVideo: null,
        comments: 0,
        public: isPublic,
        updatedAt: new Date()
      }))

      // Используем Prisma для batch upsert
      for (const profile of profileData) {
        try {
          await prisma.profiles.upsert({
            where: {
              platform_username: {
                platform: profile.platform,
                username: profile.username
              }
            },
            create: {
              ...profile,
              createdAt: new Date()
            },
            update: {
              displayName: profile.displayName,
              profilePic: profile.profilePic,
              profileBio: profile.profileBio,
              followers: profile.followers,
              following: profile.following,
              public: profile.public,
              updatedAt: profile.updatedAt
            }
          })
        } catch (error) {
          console.error(`❌ Ошибка при сохранении профиля ${profile.username}:`, error)
        }
      }
    }
    
    console.log(`✅ Обновлено/создано ${items.length} профилей`)
  }

  /**
   * Сохраняет посты в БД (аналог Python upsert_posts)
   */
  private static async upsertPosts(
    items: InstagramPostData[], 
    searchType: string,
    hashtag?: string
  ): Promise<void> {
    console.log(`📝 Начинаю сохранение ${items.length} постов в БД`)
    const chunks = chunked(items, 100)
    
    for (const chunk of chunks) {
      console.log(`💾 Сохраняю чанк из ${chunk.length} постов`)
      
      const postsData = chunk.map(post => {
        console.log(`🔍 Обрабатываю пост ID: ${post.id}, username: ${post.username || post.ownerUsername}, type: ${post.type}, videoPlayCount: ${post.videoPlayCount || 0}`)
        
        // Преобразуем timestamp
        let takenAt: Date | null = null
        if (post.timestamp) {
          if (typeof post.timestamp === 'number') {
            takenAt = new Date(post.timestamp * 1000)
          } else if (typeof post.timestamp === 'string') {
            takenAt = new Date(post.timestamp.replace('Z', '+00:00'))
          }
        }

        // Вычисляем продолжительность видео в секундах
        let durationSec: number | null = null
        if (post.videoDuration) {
          durationSec = post.videoDuration
        } else if (post.duration) {
          durationSec = convertDurationToSeconds(post.duration)
        }

        console.log(`📏 Продолжительность видео: ${durationSec} сек (из: videoDuration=${post.videoDuration}, duration="${post.duration}")`)

        return {
          id: post.id,
          platform: 'instagram',
          searchType: searchType,
          username: post.username || post.ownerUsername || '',
          hashtag: hashtag || null, // 🏷️ Сохраняем хештег в отдельном поле
          url: post.url || null,
          caption: post.caption || null,
          postType: post.type || 'Video',
          takenAt: takenAt,
          likes: BigInt(post.likesCount || 0),
          videoPlayCount: BigInt(post.videoPlayCount || 0),
          comments: BigInt(post.commentsCount || 0),
          durationSec: durationSec,
          raw: post as any,
          timestamp: takenAt,
          scrapedAt: new Date()
        }
      })

      // Сохраняем посты
      for (const post of postsData) {
        try {
          await prisma.posts.upsert({
            where: { id: post.id },
            create: post,
            update: {
              caption: post.caption,
              hashtag: post.hashtag, // 🏷️ Обновляем хештег
              likes: post.likes,
              videoPlayCount: post.videoPlayCount,
              comments: post.comments,
              durationSec: post.durationSec,
              raw: post.raw,
              scrapedAt: post.scrapedAt
            }
          })
          console.log(`✅ Сохранен пост ${post.id} для пользователя ${post.username} (${post.durationSec} сек, ${post.videoPlayCount} просмотров)`)
        } catch (error) {
          console.error(`❌ Ошибка при сохранении поста ${post.id}:`, error)
        }
      }
    }
    
    console.log(`🎯 Завершено сохранение: обновлено/создано ${items.length} постов`)
  }

  /**
   * Получает профили, которые есть в постах хештегов, но не спарсены как профили
   * Аналог Python get_not_public_profiles_instagram
   */
  static async getNotPublicProfiles(platform: string = 'instagram'): Promise<string[]> {
    try {
      const profiles = await prisma.posts.findMany({
        where: {
          platform: platform,
          searchType: 'hashtags',
          postType: 'Video',
          username: {
            not: ''
          }
        },
        select: {
          username: true
        },
        distinct: ['username']
      })

      const usernames = [...new Set(profiles.map(p => p.username).filter(Boolean))]
      console.log(`📊 Найдено ${usernames.length} недопарсенных профилей из хештегов`)
      return usernames
    } catch (error) {
      console.error('❌ Ошибка при получении недопарсенных профилей:', error)
      return []
    }
  }

  /**
   * Парсит недопарсенные профили (которые были найдены в хештегах)
   * Аналог Python parse_instagram_profiles с public=False
   */
  static async parseNotPublicProfiles(): Promise<void> {
    console.log('🔍 Ищу недопарсенные профили из хештегов')
    
    try {
      const usernames = await this.getNotPublicProfiles('instagram')
      
      if (usernames.length === 0) {
        console.log('📝 Нет недопарсенных профилей для обработки')
        return
      }

      console.log(`📊 Найдено ${usernames.length} недопарсенных профилей для парсинга`)
      
      const profileUrls = usernames.map(username => `https://www.instagram.com/${username}/`)
      await this.parseInstagramProfiles(profileUrls, false) // public=false
      
    } catch (error) {
      console.error('❌ Ошибка при парсинге недопарсенных профилей:', error)
    }
  }

  /**
   * Запускает парсинг хештега в фоновом режиме при сохранении
   */
  static async parseHashtagOnSave(
    platform: string,
    hashtag: string
  ): Promise<void> {
    try {
      if (platform === 'instagram') {
        console.log(`🔄 Автоматический парсинг Instagram хештега #${hashtag} запущен в фоне`)
        
        // Запускаем парсинг в фоне, не блокируя основной поток
        this.parseInstagramHashtags([hashtag]).then(async () => {
          // После парсинга хештега парсим недопарсенные профили
          console.log(`🔍 Запускаю парсинг недопарсенных профилей после обработки хештега #${hashtag}`)
          await this.parseNotPublicProfiles()
        }).catch(error => {
          console.error(`❌ Фоновый парсинг Instagram хештега #${hashtag} завершился с ошибкой:`, error)
        })
        
      } else if (platform === 'youtub') {
        console.log(`🔄 Автоматический парсинг YouTube хештега #${hashtag} запущен в фоне`)
        
        // Запускаем парсинг YouTube хештега в фоне
        this.parseYoutubeHashtags([hashtag]).catch(error => {
          console.error(`❌ Фоновый парсинг YouTube хештега #${hashtag} завершился с ошибкой:`, error)
        })
        
      } else {
        console.log(`⚠️ Парсинг хештегов для платформы ${platform} пока не поддерживается`)
      }
    } catch (error) {
      console.error(`❌ Ошибка запуска автоматического парсинга хештега:`, error)
      // Не прерываем выполнение, если парсинг не удался
    }
  }

  /**
   * Запускает парсинг профилей в фоновом режиме при сохранении
   */
  static async parseProfileOnSave(
    platform: string,
    username: string, 
    isPublic: boolean = true
  ): Promise<void> {
    try {
      if (platform === 'instagram') {
        const profileUrl = `https://www.instagram.com/${username}/`
        
        console.log(`🔄 Автоматический парсинг Instagram профиля ${username} запущен в фоне`)
        
        // Запускаем парсинг в фоне, не блокируя основной поток
        this.parseInstagramProfiles([profileUrl], isPublic).catch(error => {
          console.error(`❌ Фоновый парсинг Instagram профиля ${username} завершился с ошибкой:`, error)
        })
        
      } else if (platform === 'youtub') {
        const channelUrl = `https://www.youtube.com/@${username}`
        
        console.log(`🔄 Автоматический парсинг YouTube канала ${username} запущен в фоне`)
        
        // Запускаем парсинг YouTube канала в фоне
        this.parseYoutubeChannels([channelUrl], isPublic).catch(error => {
          console.error(`❌ Фоновый парсинг YouTube канала ${username} завершился с ошибкой:`, error)
        })
        
      } else {
        console.log(`⚠️ Парсинг для платформы ${platform} пока не поддерживается`)
      }
    } catch (error) {
      console.error(`❌ Ошибка запуска автоматического парсинга:`, error)
      // Не прерываем выполнение, если парсинг не удался
    }
  }

  /**
   * Парсит Instagram хештеги через Apify и сохраняет в БД
   * Аналог Python функции parse_instagram_hashtags
   */
  static async parseInstagramHashtags(hashtags: string[]): Promise<void> {
    if (hashtags.length === 0) {
      console.log('🔍 Нет хештегов для парсинга')
      return
    }

    console.log(`🏷️ Начинаю парсинг ${hashtags.length} Instagram хештегов`)
    console.log(`📋 Хештеги для парсинга:`, hashtags)

    try {
      // 1. Парсим детали хештегов
      const allHashtagDetails: any[] = []
      const chunks = chunked(hashtags, this.BATCH_SIZE)

      console.log(`📦 Разбито на ${chunks.length} чанков по ${this.BATCH_SIZE} хештегов`)

      for (const chunk of chunks) {
        console.log(`📊 Обрабатываю чанк хештегов:`, chunk)
        
        try {
          // Парсим детали хештегов через метод для хештегов
          for (const hashtag of chunk) {
            try {
              console.log(`🔍 Парсю детали хештега: #${hashtag}`)
              
              // Используем специальный метод для парсинга хештегов
              const hashtagPosts = await apifyService.parseInstagramHashtag(hashtag, 150)
              
              // Создаем объект деталей хештега
              const hashtagDetails = {
                id: `hashtag_${hashtag}`,
                name: hashtag, // Сохраняем оригинальное имя без кодирования
                firstSeen: new Date().toISOString(),
                postsCount: hashtagPosts.length,
                raw: { originalName: hashtag, posts: hashtagPosts.length }
              }
              
              allHashtagDetails.push(hashtagDetails)
              console.log(`✅ Получены детали хештега: #${hashtag} (${hashtagDetails.postsCount} постов найдено)`)
            } catch (error) {
              console.error(`❌ Ошибка при парсинге деталей хештега #${hashtag}:`, error)
              
              // Создаем базовую запись даже при ошибке
              const errorMessage = error instanceof Error ? error.message : String(error)
              const hashtagDetails = {
                id: `hashtag_${hashtag}`,
                name: hashtag,
                firstSeen: new Date().toISOString(),
                postsCount: 0,
                raw: { originalName: hashtag, error: errorMessage }
              }
              allHashtagDetails.push(hashtagDetails)
              continue
            }
          }
        } catch (error) {
          console.error(`❌ Ошибка при парсинге чанка хештегов:`, error)
          continue
        }
      }

      // 2. Сохраняем хештеги в БД
      console.log(`💾 Сохраняю ${allHashtagDetails.length} хештегов в БД`)
      await this.upsertHashtags(allHashtagDetails)

      // 3. Парсим посты по хештегам с привязкой к конкретным хештегам
      console.log(`📸 Начинаю парсинг постов для хештегов`)
              await this.parseHashtagPosts(hashtags)

      console.log(`🎉 Парсинг хештегов завершен успешно!`)
    } catch (error) {
      console.error(`❌ Критическая ошибка при парсинге хештегов:`, error)
      throw error
    }
  }

  /**
   * Парсит посты хештегов через новый метод ApifyService
   */
  private static async parseHashtagPosts(hashtags: string[]): Promise<void> {
    console.log(`📸 Начинаю парсинг постов для ${hashtags.length} хештегов`)
    const chunks = chunked(hashtags, this.BATCH_SIZE)

    console.log(`📦 Разбито на ${chunks.length} чанков для парсинга постов хештегов`)

    for (const chunk of chunks) {
      console.log(`🏷️ Парсю посты для хештегов:`, chunk)
      
      try {
        // Парсим посты по каждому хештегу с привязкой к конкретному хештегу
        for (const hashtag of chunk) {
          try {
            console.log(`🚀 Вызываю apifyService.parseInstagramHashtag для #${hashtag} с лимитом ${this.POSTS_LIMIT}`)
            const posts = await apifyService.parseInstagramHashtag(hashtag, this.POSTS_LIMIT)
            
            console.log(`📊 Получено ${posts.length} постов для хештега #${hashtag}`)
            
            if (posts.length > 0) {
              console.log(`🔍 Примеры полученных постов для #${hashtag}:`)
              posts.slice(0, 3).forEach((post: any, index: number) => {
                console.log(`  ${index + 1}. ID: ${post.id}, type: ${post.type}, username: ${post.username || post.ownerUsername}`)
              })
            }
            
            // Фильтруем только видео и берем их URLs
            const videoPosts = posts.filter((post: any) => post.type === 'Video')
            const videoUrls = videoPosts.map((post: any) => post.url).filter(Boolean)
            
            console.log(`✅ Отфильтровано ${videoPosts.length} видео-постов из ${posts.length} постов для #${hashtag}`)
            
            // Получаем детальную информацию о видео (включая videoPlayCount)
            if (videoUrls.length > 0) {
              console.log(`🔍 Получаю детальную информацию для ${videoUrls.length} видео-постов`)
              
              try {
                const detailedPosts = await apifyService.parseInstagramProfilePosts(videoUrls, this.POSTS_LIMIT)
                
                console.log(`📊 Получена детальная информация для ${detailedPosts.length} постов`)
                if (detailedPosts.length > 0) {
                  console.log(`🎬 Примеры с videoPlayCount:`)
                  detailedPosts.slice(0, 3).forEach((post: any, index: number) => {
                    console.log(`  ${index + 1}. ID: ${post.id}, videoPlayCount: ${post.videoPlayCount || 0}`)
                  })
                }
                
                // 🏷️ Сохраняем посты для каждого хештега отдельно с указанием конкретного хештега
                console.log(`💾 Сохраняю ${detailedPosts.length} Instagram видео для хештега #${hashtag}`)
                await this.upsertPosts(detailedPosts as InstagramPostData[], 'hashtags', hashtag)
                
              } catch (error) {
                console.error(`❌ Ошибка при получении детальной информации для постов #${hashtag}:`, error)
                // Если не удалось получить детали, сохраняем базовые данные
                console.log(`💾 Сохраняю ${videoPosts.length} Instagram видео (базовые данные) для хештега #${hashtag}`)
                await this.upsertPosts(videoPosts as InstagramPostData[], 'hashtags', hashtag)
              }
            }
            
          } catch (error) {
            console.error(`❌ Ошибка при парсинге постов хештега #${hashtag}:`, error)
            continue
          }
        }

      } catch (error) {
        console.error(`❌ Ошибка при парсинге постов для чанка хештегов:`, error)
        continue
      }
    }

    console.log(`🎯 Парсинг постов хештегов завершен`)
  }

  /**
   * Сохраняет хештеги в БД (аналог Python upsert_hashtags)
   */
  private static async upsertHashtags(items: any[]): Promise<void> {
    console.log(`📝 Начинаю сохранение ${items.length} хештегов в БД`)
    
    for (const hashtag of items) {
      try {
        // Декодируем имя хештега (аналог Python unquote)
        const decodedName = decodeUrlString(hashtag.name)
        console.log(`🔍 Декодирую хештег: "${hashtag.name}" → "${decodedName}"`)
        
        await prisma.hashtag.upsert({
          where: {
            platform_tag: {
              platform: 'instagram',
              tag: decodedName
            }
          },
          create: {
            platform: 'instagram',
            tag: decodedName,
            firstSeen: new Date(hashtag.firstSeen),
            totalPosts: hashtag.postsCount || 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          update: {
            totalPosts: hashtag.postsCount || 0,
            updatedAt: new Date()
          }
        })
        console.log(`✅ Сохранен хештег: #${decodedName} (${hashtag.postsCount} постов)`)
      } catch (error) {
        console.error(`❌ Ошибка при сохранении хештега #${hashtag.name}:`, error)
      }
    }
    
    console.log(`🎯 Завершено сохранение: обновлено/создано ${items.length} хештегов`)
  }

  /**
   * Исправляет URL-кодированные хештеги в БД
   * Декодирует имена хештегов, которые были сохранены в URL-кодированном виде
   */
  static async fixEncodedHashtags(): Promise<void> {
    console.log('🔧 Начинаю исправление URL-кодированных хештегов в БД')
    
    try {
      // Находим все хештеги, которые содержат URL-кодирование (символ %)
      const encodedHashtags = await prisma.hashtag.findMany({
        where: {
          platform: 'instagram',
          tag: {
            contains: '%'
          }
        }
      })

      console.log(`📊 Найдено ${encodedHashtags.length} URL-кодированных хештегов`)

      for (const hashtag of encodedHashtags) {
        try {
          const decodedTag = decodeUrlString(hashtag.tag)
          
          if (decodedTag !== hashtag.tag) {
            console.log(`🔍 Исправляю хештег: "${hashtag.tag}" → "${decodedTag}"`)
            
            // Проверяем, есть ли уже декодированная версия
            const existingDecoded = await prisma.hashtag.findUnique({
              where: {
                platform_tag: {
                  platform: 'instagram',
                  tag: decodedTag
                }
              }
            })

            if (existingDecoded) {
              // Если декодированная версия уже существует, удаляем кодированную
              console.log(`⚠️ Декодированная версия уже существует, удаляю кодированную`)
              await prisma.hashtag.delete({
                where: {
                  id: hashtag.id
                }
              })
            } else {
              // Обновляем запись с декодированным именем
              await prisma.hashtag.update({
                where: {
                  id: hashtag.id
                },
                data: {
                  tag: decodedTag,
                  updatedAt: new Date()
                }
              })
              console.log(`✅ Обновлен хештег: #${decodedTag}`)
            }
          }
        } catch (error) {
          console.error(`❌ Ошибка при исправлении хештега ${hashtag.tag}:`, error)
        }
      }

      console.log(`🎯 Исправление завершено: обработано ${encodedHashtags.length} хештегов`)
    } catch (error) {
      console.error('❌ Ошибка при исправлении URL-кодированных хештегов:', error)
    }
  }

  // =================== YouTube МЕТОДЫ ===================

  /**
   * Парсит YouTube каналы через Apify и сохраняет в БД
   * Аналог Python функции parse_youtube_profiles
   */
  static async parseYoutubeChannels(
    channelUrls: string[], 
    isPublic: boolean = true
  ): Promise<void> {
    if (channelUrls.length === 0) {
      console.log('🔍 Нет каналов для парсинга')
      return
    }

    console.log(`🚀 Начинаю парсинг ${channelUrls.length} YouTube каналов (public: ${isPublic})`)
    console.log(`📋 Каналы для парсинга:`, channelUrls)

    try {
      const allChannelItems: YoutubeChannelData[] = []
      const allPosts: YoutubeVideoData[] = []
      const chunks = chunked(channelUrls, this.BATCH_SIZE)

      console.log(`📦 Разбито на ${chunks.length} чанков по ${this.BATCH_SIZE} каналов`)

      for (const chunk of chunks) {
        console.log(`📊 Обрабатываю чанк из ${chunk.length} каналов:`, chunk)
        
        try {
          // Парсим каналы по одному
          for (const channelUrl of chunk) {
            try {
              console.log(`🔍 Парсю канал: ${channelUrl}`)
              const channelData = await apifyService.parseYoutubeChannel(channelUrl)
              
              if (channelData && channelData.length > 0) {
                const channelInfo = channelData[0]
                
                // Собираем информацию о канале
                const channel: YoutubeChannelData = {
                  channelUsername: channelInfo.channelUsername,
                  channelName: channelInfo.channelName,
                  channelUrl: channelInfo.channelUrl,
                  channelId: channelInfo.channelId,
                  numberOfSubscribers: channelInfo.numberOfSubscribers,
                  channelTotalVideos: channelInfo.channelTotalVideos,
                  channelTotalViews: channelInfo.channelTotalViews,
                  isChannelVerified: channelInfo.isChannelVerified,
                  channelDescription: channelInfo.channelDescription,
                  channelAvatarUrl: channelInfo.channelAvatarUrl
                }
                
                allChannelItems.push(channel)
                
                // Собираем посты из ответа
                const channelPosts: YoutubeVideoData[] = []
                channelData.forEach((video: any) => {
                  const post: YoutubeVideoData = {
                    id: String(video.id || ''),
                    title: typeof video.title === 'string' ? video.title : undefined,
                    url: typeof video.url === 'string' ? video.url : undefined,
                    viewCount: typeof video.viewCount === 'number' ? video.viewCount : undefined,
                    likes: typeof video.likes === 'number' ? video.likes : undefined,
                    commentsCount: typeof video.commentsCount === 'number' ? video.commentsCount : undefined,
                    date: typeof video.date === 'string' ? video.date : undefined,
                    duration: typeof video.duration === 'string' ? video.duration : undefined,
                    channelUsername: typeof video.channelUsername === 'string' ? video.channelUsername : undefined,
                    channelName: typeof video.channelName === 'string' ? video.channelName : undefined,
                    channelId: typeof video.channelId === 'string' ? video.channelId : undefined,
                    text: typeof video.text === 'string' ? video.text : undefined
                  }
                  channelPosts.push(post)
                })
                
                // 🎯 Фильтруем ТОЛЬКО YouTube Shorts при парсинге каналов
                const filteredShorts = prioritizeYouTubeShorts(channelPosts)
                allPosts.push(...filteredShorts)
                
                console.log(`✅ Получен канал: ${channel.channelName} (${channel.numberOfSubscribers} подписчиков, ${channelData.length} видео)`)
                console.log(`🎯 Отфильтровано ${filteredShorts.length} ТОЛЬКО Shorts из ${channelData.length} видео`)
              }
            } catch (error) {
              console.error(`❌ Ошибка при парсинге канала ${channelUrl}:`, error)
              continue
            }
          }
        } catch (error) {
          console.error(`❌ Ошибка при парсинге чанка каналов:`, error)
          continue
        }
      }

      // Сохраняем каналы в БД
      console.log(`💾 Сохраняю ${allChannelItems.length} каналов в БД`)
      await this.upsertYoutubeProfiles(allChannelItems, isPublic)

      // Сохраняем посты
      if (allPosts.length > 0) {
        console.log(`💾 Сохраняю ${allPosts.length} YouTube видео в БД`)
        await this.upsertYoutubePosts(allPosts, 'profiles')
      }

      console.log(`🎉 Парсинг YouTube каналов завершен успешно!`)
    } catch (error) {
      console.error(`❌ Критическая ошибка при парсинге YouTube каналов:`, error)
      throw error
    }
  }

  /**
   * Парсит YouTube хештеги через Apify и сохраняет в БД
   * Аналог Python функции parse_youtube_hashtags
   */
  static async parseYoutubeHashtags(hashtags: string[]): Promise<void> {
    if (hashtags.length === 0) {
      console.log('🔍 Нет хештегов для парсинга')
      return
    }

    console.log(`🏷️ Начинаю парсинг ${hashtags.length} YouTube хештегов`)
    console.log(`📋 Хештеги для парсинга:`, hashtags)

    try {
      const allHashtagDetails: any[] = []
      const channelsMap = new Map<string, YoutubeChannelData>()
      
      const chunks = chunked(hashtags, this.BATCH_SIZE)

      console.log(`📦 Разбито на ${chunks.length} чанков по ${this.BATCH_SIZE} хештегов`)

      for (const chunk of chunks) {
        console.log(`📊 Обрабатываю чанк хештегов:`, chunk)
        
        try {
          for (const hashtag of chunk) {
            try {
              console.log(`🔍 Парсю хештег: #${hashtag}`)
              const hashtagVideos = await apifyService.parseYoutubeHashtag(hashtag, this.POSTS_LIMIT) as any[]
              
              // Создаем объект деталей хештега
              const hashtagDetails = {
                id: `hashtag_${hashtag}`,
                name: hashtag,
                firstSeen: new Date().toISOString(),
                postsCount: hashtagVideos.length,
                raw: { originalName: hashtag, posts: hashtagVideos.length }
              }
              
              allHashtagDetails.push(hashtagDetails)
              
              // Обрабатываем видео с привязкой к конкретному хештегу
              const hashtagPosts: YoutubeVideoData[] = []
              hashtagVideos.forEach((video: any) => {
                // Собираем информацию о канале
                if (video.channelUsername) {
                  const channel: YoutubeChannelData = {
                    channelUsername: typeof video.channelUsername === 'string' ? video.channelUsername : undefined,
                    channelName: typeof video.channelName === 'string' ? video.channelName : undefined,
                    channelUrl: typeof video.channelUrl === 'string' ? video.channelUrl : undefined,
                    channelId: typeof video.channelId === 'string' ? video.channelId : undefined,
                    numberOfSubscribers: typeof video.numberOfSubscribers === 'number' ? video.numberOfSubscribers : undefined,
                    channelTotalVideos: typeof video.channelTotalVideos === 'number' ? video.channelTotalVideos : undefined,
                    channelTotalViews: typeof video.channelTotalViews === 'number' ? video.channelTotalViews : undefined,
                    isChannelVerified: typeof video.isChannelVerified === 'boolean' ? video.isChannelVerified : undefined,
                    channelDescription: typeof video.channelDescription === 'string' ? video.channelDescription : undefined,
                    channelAvatarUrl: typeof video.channelAvatarUrl === 'string' ? video.channelAvatarUrl : undefined
                  }
                  channelsMap.set(video.channelUsername, channel)
                }
                
                // Собираем пост с привязкой к хештегу
                const post: YoutubeVideoData = {
                  id: String(video.id || ''),
                  title: typeof video.title === 'string' ? video.title : undefined,
                  url: typeof video.url === 'string' ? video.url : undefined,
                  viewCount: typeof video.viewCount === 'number' ? video.viewCount : undefined,
                  likes: typeof video.likes === 'number' ? video.likes : undefined,
                  commentsCount: typeof video.commentsCount === 'number' ? video.commentsCount : undefined,
                  date: typeof video.date === 'string' ? video.date : undefined,
                  duration: typeof video.duration === 'string' ? video.duration : undefined,
                  channelUsername: typeof video.channelUsername === 'string' ? video.channelUsername : undefined,
                  channelName: typeof video.channelName === 'string' ? video.channelName : undefined,
                  channelId: typeof video.channelId === 'string' ? video.channelId : undefined,
                  text: typeof video.text === 'string' ? video.text : undefined
                }
                hashtagPosts.push(post)
              })
              
              // 🏷️ Сохраняем посты для каждого хештега отдельно с указанием конкретного хештега
              if (hashtagPosts.length > 0) {
                console.log(`💾 Сохраняю ${hashtagPosts.length} YouTube видео для хештега #${hashtag}`)
                await this.upsertYoutubePosts(hashtagPosts, 'hashtags', hashtag)
              }
              
              console.log(`✅ Получены данные хештега: #${hashtag} (${hashtagDetails.postsCount} видео найдено)`)
            } catch (error) {
              console.error(`❌ Ошибка при парсинге хештега #${hashtag}:`, error)
              continue
            }
          }
        } catch (error) {
          console.error(`❌ Ошибка при парсинге чанка хештегов:`, error)
          continue
        }
      }

      // Сохраняем хештеги в БД
      if (allHashtagDetails.length > 0) {
        console.log(`💾 Сохраняю ${allHashtagDetails.length} YouTube хештегов в БД`)
        await this.upsertYoutubeHashtags(allHashtagDetails)
      }

      // Сохраняем каналы (как недопарсенные профили)
      const uniqueChannels = Array.from(channelsMap.values())
      if (uniqueChannels.length > 0) {
        console.log(`💾 Сохраняю ${uniqueChannels.length} YouTube каналов как недопарсенные профили`)
        await this.upsertYoutubeProfiles(uniqueChannels, false)
      }

      console.log(`🎉 Парсинг YouTube хештегов завершен успешно!`)
    } catch (error) {
      console.error(`❌ Критическая ошибка при парсинге YouTube хештегов:`, error)
      throw error
    }
  }

  /**
   * Сохраняет YouTube каналы в БД как профили
   */
  private static async upsertYoutubeProfiles(
    items: YoutubeChannelData[], 
    isPublic: boolean
  ): Promise<void> {
    const chunks = chunked(items, 100)
    
    for (const chunk of chunks) {
      const profileData = chunk.map(channel => {
        // Декодируем URL-кодированный username (аналог Python unquote)
        const decodedUsername = decodeUrlString(channel.channelUsername || '')
        console.log(`🔍 Декодирую YouTube username: "${channel.channelUsername}" → "${decodedUsername}"`)
        
        return {
          platform: 'youtub',
          username: decodedUsername,
          displayName: channel.channelName || null,
          profilePic: channel.channelAvatarUrl || null,
          profileBio: channel.channelDescription || null,
          followers: channel.numberOfSubscribers || 0,
          following: 0, // YouTube не показывает подписки
          latestVideo: null,
          comments: 0,
          public: isPublic,
          updatedAt: new Date()
        }
      })

      // Используем Prisma для batch upsert
      for (const profile of profileData) {
        try {
          await prisma.profiles.upsert({
            where: {
              platform_username: {
                platform: profile.platform,
                username: profile.username
              }
            },
            create: {
              ...profile,
              createdAt: new Date()
            },
            update: {
              displayName: profile.displayName,
              profilePic: profile.profilePic,
              profileBio: profile.profileBio,
              followers: profile.followers,
              public: profile.public,
              updatedAt: profile.updatedAt
            }
          })
        } catch (error) {
          console.error(`❌ Ошибка при сохранении YouTube канала ${profile.username}:`, error)
        }
      }
    }
    
    console.log(`✅ Обновлено/создано ${items.length} YouTube каналов`)
  }

  /**
   * Сохраняет YouTube видео в БД как посты
   */
  private static async upsertYoutubePosts(
    items: YoutubeVideoData[], 
    searchType: string,
    hashtag?: string
  ): Promise<void> {
    console.log(`📝 Начинаю сохранение ${items.length} YouTube видео в БД`)
    const chunks = chunked(items, 100)
    
    for (const chunk of chunks) {
      console.log(`💾 Сохраняю чанк из ${chunk.length} видео`)
      
      const postsData = chunk.map(video => {
        console.log(`🔍 Обрабатываю видео ID: ${video.id}, канал: ${video.channelUsername}, просмотры: ${video.viewCount || 0}`)
        
        // Преобразуем timestamp
        let takenAt: Date | null = null
        if (video.date) {
          takenAt = new Date(video.date)
        }

        // Вычисляем продолжительность видео в секундах
        let durationSec: number | null = null
        if (video.duration) {
          durationSec = convertDurationToSeconds(video.duration)
        }

        const isShorts = isYouTubeShorts(video)
        console.log(`📏 Продолжительность видео: ${durationSec} сек (из: "${video.duration}") 🎯 SHORTS ONLY`)

        // Декодируем URL-кодированный username канала
        const decodedUsername = decodeUrlString(video.channelUsername || '')
        if (video.channelUsername && video.channelUsername !== decodedUsername) {
          console.log(`🔍 Декодирую YouTube username в посте: "${video.channelUsername}" → "${decodedUsername}"`)
        }

        return {
          id: video.id,
          platform: 'youtub',
          searchType: searchType,
          username: decodedUsername,
          hashtag: hashtag || null, // 🏷️ Сохраняем хештег в отдельном поле
          url: video.url || null,
          caption: video.title || null,
          postType: 'Video',
          takenAt: takenAt,
          likes: BigInt(video.likes || 0),
          videoPlayCount: BigInt(video.viewCount || 0),
          comments: BigInt(video.commentsCount || 0),
          durationSec: durationSec,
          raw: video as any,
          timestamp: takenAt,
          scrapedAt: new Date()
        }
      })

      // Сохраняем посты
      for (const post of postsData) {
        try {
          await prisma.posts.upsert({
            where: { id: post.id },
            create: post,
            update: {
              caption: post.caption,
              hashtag: post.hashtag, // 🏷️ Обновляем хештег
              likes: post.likes,
              videoPlayCount: post.videoPlayCount,
              comments: post.comments,
              durationSec: post.durationSec,
              raw: post.raw,
              scrapedAt: post.scrapedAt
            }
          })
          console.log(`✅ Сохранено YouTube видео ${post.id} канала ${post.username} (${post.durationSec} сек, ${post.videoPlayCount} просмотров)`)
        } catch (error) {
          console.error(`❌ Ошибка при сохранении YouTube видео ${post.id}:`, error)
        }
      }
    }
    
    console.log(`🎯 Завершено сохранение: обновлено/создано ${items.length} YouTube видео`)
  }

  /**
   * Сохраняет YouTube хештеги в БД
   */
  private static async upsertYoutubeHashtags(items: any[]): Promise<void> {
    console.log(`📝 Начинаю сохранение ${items.length} YouTube хештегов в БД`)
    
    for (const hashtag of items) {
      try {
        await prisma.hashtag.upsert({
          where: {
            platform_tag: {
              platform: 'youtub',
              tag: hashtag.name
            }
          },
          create: {
            platform: 'youtub',
            tag: hashtag.name,
            firstSeen: new Date(hashtag.firstSeen),
            totalPosts: hashtag.postsCount || 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          update: {
            totalPosts: hashtag.postsCount || 0,
            updatedAt: new Date()
          }
        })
        console.log(`✅ Сохранен YouTube хештег: #${hashtag.name} (${hashtag.postsCount} видео)`)
      } catch (error) {
        console.error(`❌ Ошибка при сохранении YouTube хештега #${hashtag.name}:`, error)
      }
    }
    
    console.log(`🎯 Завершено сохранение: обновлено/создано ${items.length} YouTube хештегов`)
  }
} 