# Декодирование URL-кодированных YouTube Username

## 🚨 **Проблема:**

После парсинга YouTube хештегов в БД попадали URL-кодированные username:
- **Кодированный**: `%D0%90%D0%BD%D1%82%D0%BE%D0%BD%D0%92%D0%B8%D1%82%D1%86%D0%B5%D1%80`
- **Декодированный**: `АнтонВитцер`

## ✅ **Решение:**

### 1. **Автоматическое декодирование при сохранении**

Обновлены методы в `front/server/utils/parser.ts`:

**upsertYoutubeProfiles():**
```typescript
// Декодируем URL-кодированный username (аналог Python unquote)
const decodedUsername = decodeUrlString(channel.channelUsername || '')
console.log(`🔍 Декодирую YouTube username: "${channel.channelUsername}" → "${decodedUsername}"`)

return {
  platform: 'youtub',
  username: decodedUsername, // Сохраняем декодированный
  displayName: channel.channelName || null,
  // ...
}
```

**upsertYoutubePosts():**
```typescript
// Декодируем URL-кодированный username канала
const decodedUsername = decodeUrlString(video.channelUsername || '')
if (video.channelUsername && video.channelUsername !== decodedUsername) {
  console.log(`🔍 Декодирую YouTube username в посте: "${video.channelUsername}" → "${decodedUsername}"`)
}

return {
  id: video.id,
  platform: 'youtub',
  username: decodedUsername, // Сохраняем декодированный
  // ...
}
```

### 2. **API для исправления существующих записей**

**Эндпоинт для миграции:**
```
POST /api/fix-encoded-youtube-usernames
```

**Что исправляет:**
- ✅ **Профили**: Таблица `Profiles` с `platform: 'youtub'`
- ✅ **Посты**: Таблица `Posts` с `platform: 'youtub'`
- ✅ **Дедубликация**: Удаляет дубли при наличии декодированной версии

**Пример ответа:**
```json
{
  "success": true,
  "message": "Исправление URL-кодированных YouTube username завершено успешно",
  "results": {
    "profiles": 15,
    "posts": 450,
    "errors": []
  },
  "totalFixed": 465,
  "examples": [
    {
      "encoded": "%D0%90%D0%BD%D1%82%D0%BE%D0%BD%D0%92%D0%B8%D1%82%D1%86%D0%B5%D1%80",
      "decoded": "АнтонВитцер"
    }
  ]
}
```

## 🔧 **Использованная функция:**

```typescript
function decodeUrlString(str: string): string {
  if (!str) return str
  
  try {
    return decodeURIComponent(str) // JavaScript аналог Python unquote
  } catch (error) {
    console.error(`❌ Ошибка декодирования URL строки "${str}":`, error)
    return str
  }
}
```

## 🚀 **Автоматическое применение:**

Декодирование происходит автоматически при:
- **Парсинге YouTube хештегов** → находятся каналы с кодированными username
- **Сохранении профилей** в `upsertYoutubeProfiles()`
- **Сохранении постов** в `upsertYoutubePosts()`

## 📊 **Результат:**

- ✅ Все новые YouTube username сохраняются декодированными
- ✅ Кириллические username корректно отображаются
- ✅ API для исправления старых записей
- ✅ Автоматическое логирование процесса декодирования
- ✅ Дедубликация при миграции 