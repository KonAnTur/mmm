# Instagram Парсер API

Этот модуль предоставляет API эндпоинты для парсинга Instagram контента с помощью Apify.

## Установка зависимостей

```bash
cd front
npm install
```

## Настройка переменных окружения

Создайте файл `.env` в папке `front` и добавьте:

```env
APIFY_TOKEN=your_apify_token_here
```

## API Эндпоинты

### 1. Парсинг Instagram видео

**POST** `/api/instagram/video`

Парсит информацию о конкретном Instagram видео (пост, Reel, IGTV).

**Тело запроса:**
```json
{
  "url": "https://www.instagram.com/p/ABC123/"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "123456789",
    "type": "Video",
    "caption": "Описание видео",
    "url": "https://www.instagram.com/p/ABC123/",
    "videoUrl": "https://...",
    "thumbnailUrl": "https://...",
    "likes": 1000,
    "comments": 50,
    "views": 5000,
    "timestamp": "2024-01-01T00:00:00Z",
    "owner": {
      "username": "username",
      "fullName": "Full Name"
    }
  },
  "message": "Видео успешно обработано"
}
```

### 2. Парсинг Instagram профиля

**POST** `/api/instagram/profile`

Парсит информацию о профиле Instagram.

**Тело запроса:**
```json
{
  "url": "https://www.instagram.com/username/"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "123456789",
    "username": "username",
    "fullName": "Full Name",
    "biography": "Bio text",
    "followersCount": 10000,
    "followingCount": 500,
    "postsCount": 100,
    "profilePicUrl": "https://...",
    "isPrivate": false,
    "isVerified": true
  },
  "message": "Профиль успешно обработан"
}
```

### 3. Парсинг Instagram хештега

**POST** `/api/instagram/hashtag`

Парсит посты по хештегу.

**Тело запроса:**
```json
{
  "hashtag": "travel",
  "limit": 10
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "hashtag": "travel",
    "posts": [
      {
        "id": "123456789",
        "type": "Video",
        "caption": "Amazing travel video",
        "url": "https://www.instagram.com/p/ABC123/",
        "likes": 1000,
        "comments": 50,
        "owner": {
          "username": "traveler",
          "fullName": "Travel Blogger"
        }
      }
    ],
    "total": 10
  },
  "message": "Хештег успешно обработан"
}
```

## Веб-интерфейс

Для тестирования API доступна веб-страница по адресу:
```
http://localhost:3000/instagram-parser
```

## Обработка ошибок

API возвращает следующие HTTP коды:

- **200** - Успешный запрос
- **400** - Некорректные данные (ошибка валидации)
- **404** - Контент не найден или недоступен
- **500** - Внутренняя ошибка сервера

## Примеры использования

### cURL

```bash
# Парсинг видео
curl -X POST http://localhost:3000/api/instagram/video \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/p/ABC123/"}'

# Парсинг профиля
curl -X POST http://localhost:3000/api/instagram/profile \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/username/"}'

# Парсинг хештега
curl -X POST http://localhost:3000/api/instagram/hashtag \
  -H "Content-Type: application/json" \
  -d '{"hashtag": "travel", "limit": 10}'
```

### JavaScript

```javascript
// Парсинг видео
const response = await fetch('/api/instagram/video', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://www.instagram.com/p/ABC123/'
  })
})

const result = await response.json()
console.log(result)
```

## Ограничения

- Требуется действующий Apify токен
- Instagram может ограничивать доступ к некоторому контенту
- Частые запросы могут привести к временной блокировке
- Некоторые профили могут быть приватными

## Безопасность

- Все URL валидируются перед отправкой в Apify
- Используется прокси-конфигурация Apify для обхода ограничений
- Ошибки логируются для отладки 