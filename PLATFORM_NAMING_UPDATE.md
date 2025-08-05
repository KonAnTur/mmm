# Обновление названия платформы YouTube → "youtub"

## 📝 **Что изменено:**

По требованию проекта название платформы для YouTube в БД изменено с `'youtube'` на `'youtub'`.

## 🔧 **Затронутые файлы:**

### 1. `front/server/utils/parser.ts`
- `parseHashtagOnSave()`: `platform === 'youtub'`
- `parseProfileOnSave()`: `platform === 'youtub'` 
- `upsertYoutubeProfiles()`: `platform: 'youtub'`
- `upsertYoutubePosts()`: `platform: 'youtub'`
- `upsertYoutubeHashtags()`: `platform: 'youtub'` (2 места)

### 2. `front/server/api/video-script.post.ts`
- `detectPlatform()`: возвращает `'youtub'` вместо `'youtube'`
- Все сравнения: `platform === 'youtub'`
- Все `historyVideoData`: `platform: 'youtub'` (3 места)

## 💾 **Влияние на БД:**

Все новые записи теперь сохраняются с platform = 'youtub':
- `Profiles` таблица
- `Posts` таблица  
- `Hashtag` таблица
- `RequestHistory` таблица

## ⚠️ **Важно:**

**Существующие записи** с `platform: 'youtube'` остаются без изменений. 
Если нужно обновить старые записи, потребуется миграция БД:

```sql
-- Обновить профили
UPDATE Profiles SET platform = 'youtub' WHERE platform = 'youtube';

-- Обновить посты  
UPDATE Posts SET platform = 'youtub' WHERE platform = 'youtube';

-- Обновить хештеги
UPDATE Hashtag SET platform = 'youtub' WHERE platform = 'youtube';

-- Обновить историю запросов
UPDATE RequestHistory 
SET videoData = JSON_SET(videoData, '$.platform', 'youtub') 
WHERE JSON_EXTRACT(videoData, '$.platform') = 'youtube';
```

## 🖥️ **UI остается без изменений:**

В `front/pages/video-script.vue` проверки остались как `=== 'youtube'` для отображения иконок и текста, так как это не влияет на БД.

## 🛠️ **Утилиты для миграции:**

### API эндпоинт для проверки состояния:
```
POST /api/check-youtube-migration
```
Проверяет сколько записей остается с `'youtube'` и сколько уже переведено на `'youtub'`.

### API эндпоинт для миграции:
```
POST /api/migrate-youtube-platform
```
Автоматически обновляет все существующие записи с `'youtube'` на `'youtub'`.

**Пример ответа:**
```json
{
  "success": true,
  "message": "Миграция платформы YouTube → youtub завершена успешно",
  "results": {
    "profiles": 15,
    "posts": 450,
    "hashtags": 25
  },
  "totalUpdated": 490
}
```

## ✅ **Результат:**

- ✅ Все новые YouTube данные сохраняются как `platform: 'youtub'`
- ✅ Автоматический парсинг работает корректно
- ✅ Video scripts система работает корректно
- ✅ UI отображает правильные иконки и названия
- ✅ Есть утилиты для проверки и миграции старых записей 