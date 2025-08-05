# 🏷️ Исправление отображения виральности видео найденных по хештегам (V2)

## 📋 Проблема
При парсинге видео с хештегов посты сохранялись в БД, но не отображались на сайте с виральностью, потому что:
1. Не было отдельного поля для хранения хештега
2. Не было связи с хештегами конкретного пользователя
3. Показывались все видео вместо только пользовательских хештегов

## 🔧 Решение

### 1. Добавлено поле `hashtag` в таблицу Posts

**Обновленная схема:**
```prisma
model Posts {
  id             String   @id
  platform       String
  searchType     String
  username       String
  hashtag        String?   // 🏷️ Хештег по которому найден пост
  url            String?
  caption        String?
  // ... остальные поля
}
```

**SQL миграция:**
```sql
ALTER TABLE "Posts" ADD COLUMN "hashtag" TEXT;
CREATE INDEX "Posts_hashtag_idx" ON "Posts"("hashtag");
CREATE INDEX "Posts_platform_hashtag_idx" ON "Posts"("platform", "hashtag");
```

### 2. Обновлена логика парсинга

**Изменения в `front/server/utils/parser.ts`:**

#### Метод `upsertPosts` теперь принимает хештег:
```typescript
private static async upsertPosts(
  items: InstagramPostData[], 
  searchType: string,
  hashtag?: string  // 🏷️ Новый параметр
): Promise<void>
```

#### Сохранение хештега в отдельном поле:
```typescript
return {
  id: post.id,
  platform: 'instagram',
  searchType: searchType,
  username: post.username || post.ownerUsername || '',
  hashtag: hashtag || null, // 🏷️ Сохраняем хештег в отдельном поле
  // ... остальные поля
}
```

#### Вызов с указанием конкретного хештега:
```typescript
// Для каждого хештега отдельно
await this.upsertPosts(detailedPosts, 'hashtags', hashtag)
```

### 3. Обновлен API для фильтрации по пользовательским хештегам

**Файл:** `front/server/api/[platform]/[searchType]/videos.get.ts`

#### Получение хештегов пользователя:
```typescript
const usersRelationHashtags = await prisma.usersRelationHashtag.findMany({
    where: {
        userId: String(userData.id),
        platform: platform
    }
})
```

#### Фильтрация только по пользовательским хештегам:
```typescript
if (searchType === 'hashtags') {
    const userHashtags = usersRelationHashtags.map(h => h.tag)
    
    if (userHashtags.length === 0) {
        // Если у пользователя нет хештегов, возвращаем пустой массив
        return JSON.parse(JSON.stringify([], bigIntReplacer))
    }

    whereCondition = {
        ...whereCondition,
        hashtag: {
            in: userHashtags  // 🏷️ Только хештеги пользователя
        }
    }
}
```

#### Использование поля hashtag в ответе:
```typescript
const hashtag = video.hashtag || null  // 🏷️ Прямо из поля
```

## 📊 Структура данных

### Таблица Posts теперь содержит:
```json
{
  "id": "video123",
  "platform": "instagram",
  "searchType": "hashtags",
  "username": "fashion_blogger",
  "hashtag": "мода",  // 🏷️ Хештег в отдельном поле
  "caption": "Крутой образ",
  "videoPlayCount": 5000,
  // ... остальные поля
}
```

### Таблица UsersRelationHashtag связывает пользователей и хештеги:
```json
{
  "userId": "user123",
  "platform": "instagram", 
  "tag": "мода"
}
```

## 🎯 Результат

### До исправления:
- ❌ Видео парсились, но не отображались на странице виральности
- ❌ Показывались все видео по всем хештегам
- ❌ Не было связи с хештегами конкретного пользователя

### После исправления:
- ✅ Видео отображаются только по хештегам пользователя
- ✅ Каждое видео знает по какому хештегу найдено
- ✅ Быстрый поиск благодаря индексам
- ✅ Персонализированный контент для каждого пользователя

## 🚀 Использование

### Для пользователя с хештегами ["мода", "стиль"]:
```
GET /api/instagram/hashtags/videos
```

**Вернет только видео найденные по хештегам #мода и #стиль**

### API ответ включает хештег:
```json
{
  "id": "video123",
  "username": "fashion_blogger",
  "virality": "15%",
  "hashtag": "мода",  // 🏷️ По какому хештегу найдено
  "videoPlayCount": 5000,
  // ... остальные поля
}
```

## 📝 Инструкции по применению

### 1. Запустите миграцию БД:
```bash
cd front
# Выполните SQL из файла: front/prisma/migrations/add_hashtag_to_posts.sql
```

### 2. Сгенерируйте Prisma клиент:
```bash
npx prisma generate
```

### 3. Перезапустите сервер:
```bash
npm run dev
```

## 🔄 Совместимость

- ✅ Существующие посты без хештега продолжат работать
- ✅ Новые посты автоматически получат хештег
- ✅ API поддерживает оба варианта (с хештегом и без)
- ✅ Обратная совместимость со старым форматом searchType

## 🎉 Преимущества нового подхода

1. **Персонализация:** Каждый пользователь видит только свои хештеги
2. **Производительность:** Индексы обеспечивают быстрый поиск
3. **Масштабируемость:** Легко добавлять новые хештеги пользователям
4. **Аналитика:** Можно отслеживать эффективность каждого хештега
5. **UX:** Понятно какое видео от какого хештега 