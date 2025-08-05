# YouTube Shorts ONLY: Переход на парсинг только коротких видео

## 📝 **Что изменено:**

Система переведена на парсинг **ТОЛЬКО YouTube Shorts** (≤60 сек). Обычные длинные видео исключены из всех процессов.

## 🔧 **Обновленные методы:**

### 1. `parseYoutubeVideo(videoUrl)`
**Было:** Парсит любые YouTube видео
**Стало:**
```typescript
// ТОЛЬКО Shorts - отклоняем обычные видео
if (!isShorts) {
  throw new Error('Поддерживаются только YouTube Shorts видео (длительность ≤60 сек)')
}

const runInput = {
  startUrls: [{ url: videoUrl }],
  maxResults: 0, // ТОЛЬКО Shorts - исключаем обычные видео
  maxResultsShorts: 1, // Только для Shorts
  maxResultStreams: 0,
  sortBy: "relevance"
}
```

### 2. `parseYoutubeChannel(channelUrl)`
**Было:** 70% Shorts + 30% обычных видео (5 + 20)
**Стало:**
```typescript
const runInput = {
  startUrls: [{ url: channelUrl }],
  maxResults: 0, // ТОЛЬКО Shorts - исключаем обычные видео
  maxResultsShorts: 25, // Увеличиваем количество Shorts
  maxResultStreams: 0,
  sortBy: "date"
}

// ТОЛЬКО Shorts - фильтруем обычные видео
const shorts = items.items.filter((item: any) => 
  item.type === 'shorts' || 
  (item.duration && this.parseDurationSeconds(item.duration) <= 60)
)

return shorts // Возвращаем только Shorts
```

### 3. `parseYoutubeHashtag(hashtag)`
**Было:** 70% Shorts + 30% обычных видео
**Стало:**
```typescript
const runInput = {
  startUrls: hashtagUrls.map(url => ({ url })),
  maxResults: 0, // ТОЛЬКО Shorts - исключаем обычные видео
  maxResultsShorts: limit, // 100% Shorts
  maxResultStreams: 0,
  sortBy: "viewCount"
}

// ТОЛЬКО Shorts - фильтруем обычные видео
const shorts = items.items.filter((item: any) => 
  item.type === 'shorts' || 
  (item.duration && this.parseDurationSeconds(item.duration) <= 60)
)

return limitedShorts // Возвращаем только Shorts
```

### 4. `prioritizeYouTubeShorts()` → `filterYouTubeShortsOnly()`
**Было:** Приоритизация 70% + 30%
**Стало:**
```typescript
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
  
  // Сортируем Shorts по популярности
  shorts.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
  
  // Ограничиваем до 150 Shorts максимум
  const result = shorts.slice(0, 150)
  
  return result
}
```

## 🚫 **Что исключено:**

### Apify параметры:
- ❌ `maxResults: 5` → `maxResults: 0`
- ❌ Обычные видео полностью исключены
- ✅ `maxResultsShorts: 25` - увеличено количество Shorts

### Фильтрация:
- ❌ Обычные видео (>60 сек) исключены из результатов
- ✅ Только Shorts (≤60 сек или `type === 'shorts'`)

### Video Scripts:
- ❌ Обычные YouTube видео будут отклонены с ошибкой
- ✅ Только Shorts будут обработаны

## 📊 **Новая логика определения Shorts:**

```typescript
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
```

## 🔄 **Обновленное логирование:**

### Каналы:
```
🚀 Запуск Apify актора для YouTube канала (прямой обход, ТОЛЬКО Shorts): @channel
📊 Получено результатов: 45 → отфильтровано: 23 ТОЛЬКО Shorts
✅ Получен канал: Channel Name (1.2M подписчиков, 45 видео)
🎯 Отфильтровано 23 ТОЛЬКО Shorts из 45 видео
```

### Хештеги:
```
🚀 Запуск Apify актора для YouTube хештега #hashtag (прямые URL, ТОЛЬКО Shorts)
📊 Получено результатов: 30 → отфильтровано: 25 ТОЛЬКО Shorts
```

### Видео:
```
📏 Продолжительность видео: 30 сек (из: "0:30") 🎯 SHORTS ONLY
```

## ✅ **Результат изменений:**

### 🎯 **Качество контента:**
- ✅ 100% YouTube Shorts
- ✅ Максимальная релевантность для коротких видео
- ✅ Быстрый и вирусный контент

### ⚡ **Производительность:**
- ✅ Меньше данных для обработки
- ✅ Быстрее парсинг (нет длинных видео)
- ✅ Более точные результаты

### 🚫 **Ограничения:**
- ❌ Video Scripts: Обычные YouTube видео будут отклонены
- ❌ Парсинг каналов: Только Shorts из каналов
- ❌ Хештеги: Только короткие видео по хештегам

## 🚀 **Автоматическое применение:**

Изменения действуют во всех процессах:
- **Добавление YouTube канала** → парсятся только Shorts
- **Добавление YouTube хештега** → находятся только Shorts
- **Video Scripts анализ** → только YouTube Shorts видео
- **Автоматический парсинг** → только короткие видео в БД

## 💾 **Сохранение в БД:**

Все данные сохраняются с платформой `'youtub'` и содержат:
- ✅ Только Shorts видео (≤60 сек)
- ✅ Каналы с их Shorts контентом
- ✅ Хештеги с короткими видео
- ✅ Декодированные username

**Система полностью переведена на YouTube Shorts!** 🎯 