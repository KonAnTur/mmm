# API Промптов

Этот модуль предоставляет полный CRUD API для управления промптами в базе данных и обработки сценариев с помощью LLM.

## API Эндпоинты

### 1. Получение всех промптов

**GET** `/api/prompts`

Возвращает список всех промптов, отсортированных по дате создания (новые первыми).

**Ответ:**
```json
[
  {
    "id": "uuid",
    "name": "Название промпта",
    "text": "Текст промпта",
    "user": "username",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

### 2. Создание нового промпта

**POST** `/api/prompts`

Создает новый промпт в базе данных.

**Тело запроса:**
```json
{
  "name": "Название промпта",
  "text": "Текст промпта"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Название промпта",
    "text": "Текст промпта",
    "user": "username",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Промпт успешно создан"
}
```

### 3. Получение промпта по ID

**GET** `/api/prompts/{id}`

Возвращает конкретный промпт по его ID.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Название промпта",
    "text": "Текст промпта",
    "user": "username",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4. Обновление промпта

**PUT** `/api/prompts/{id}`

Обновляет существующий промпт по его ID.

**Тело запроса:**
```json
{
  "name": "Обновленное название",
  "text": "Обновленный текст"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Обновленное название",
    "text": "Обновленный текст",
    "user": "username",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Промпт успешно обновлен"
}
```

### 5. Удаление промпта

**DELETE** `/api/prompts/{id}`

Удаляет промпт по его ID.

**Ответ:**
```json
{
  "success": true,
  "message": "Промпт успешно удален"
}
```

### 6. Обработка сценария под промпт

**POST** `/api/prompts/process-script`

Обрабатывает сценарий с помощью выбранного промпта и LLM (Google Gemini).

**Тело запроса:**
```json
{
  "promptId": "uuid-промпта",
  "script": "Текст сценария для обработки"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "originalScript": "Исходный сценарий",
    "processedScript": "Обработанный сценарий согласно промпту",
    "prompt": {
      "id": "uuid",
      "name": "Название промпта",
      "text": "Текст промпта"
    }
  },
  "message": "Сценарий успешно обработан"
}
```

## Валидация данных

### Создание и обновление промпта

- **name**: Обязательное поле, максимум 120 символов
- **text**: Обязательное поле, неограниченная длина

### Обработка сценария

- **promptId**: Обязательное поле, UUID существующего промпта
- **script**: Обязательное поле, текст сценария для обработки

## Обработка ошибок

API возвращает следующие HTTP коды:

- **200** - Успешный запрос
- **400** - Некорректные данные (ошибка валидации)
- **404** - Промпт не найден
- **500** - Внутренняя ошибка сервера

### Пример ошибки валидации:
```json
{
  "statusCode": 400,
  "statusMessage": "Некорректные данные",
  "data": {
    "errors": [
      {
        "code": "too_small",
        "minimum": 1,
        "type": "string",
        "inclusive": true,
        "exact": false,
        "message": "Название обязательно",
        "path": ["name"]
      }
    ]
  }
}
```

## Примеры использования

### cURL

```bash
# Получить все промпты
curl -X GET http://localhost:3000/api/prompts

# Создать новый промпт
curl -X POST http://localhost:3000/api/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Мой промпт",
    "text": "Перепиши сценарий в формате диалога"
  }'

# Получить промпт по ID
curl -X GET http://localhost:3000/api/prompts/uuid-here

# Обновить промпт
curl -X PUT http://localhost:3000/api/prompts/uuid-here \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Обновленный промпт",
    "text": "Новый текст промпта"
  }'

# Удалить промпт
curl -X DELETE http://localhost:3000/api/prompts/uuid-here

# Обработать сценарий
curl -X POST http://localhost:3000/api/prompts/process-script \
  -H "Content-Type: application/json" \
  -d '{
    "promptId": "uuid-промпта",
    "script": "Текст сценария для обработки"
  }'
```

### JavaScript

```javascript
// Получить все промпты
const prompts = await fetch('/api/prompts').then(r => r.json())

// Создать промпт
const newPrompt = await fetch('/api/prompts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Мой промпт',
    text: 'Перепиши сценарий в формате диалога'
  })
}).then(r => r.json())

// Обновить промпт
const updatedPrompt = await fetch(`/api/prompts/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Обновленный промпт',
    text: 'Новый текст промпта'
  })
}).then(r => r.json())

// Удалить промпт
await fetch(`/api/prompts/${id}`, { method: 'DELETE' })

// Обработать сценарий
const processedScript = await fetch('/api/prompts/process-script', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    promptId: 'uuid-промпта',
    script: 'Текст сценария для обработки'
  })
}).then(r => r.json())
```

## Веб-интерфейс

Для управления промптами и обработки сценариев доступна веб-страница по адресу:
```
http://localhost:3000/prompts
```

### Функции веб-интерфейса:

1. **Управление промптами**:
   - Создание новых промптов
   - Редактирование существующих
   - Удаление промптов
   - Просмотр списка всех промптов

2. **Обработка сценариев**:
   - Выбор промпта из списка
   - Вставка сценария для обработки
   - Получение обработанного результата
   - Копирование и скачивание результата

## Схема базы данных

```sql
CREATE TABLE "Prompt" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "user" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);
```

## Аутентификация

Все эндпоинты требуют аутентификации пользователя. Промпты привязаны к конкретному пользователю и доступны только их владельцу.

## LLM Интеграция

Для обработки сценариев используется Google Gemini 2.0 Flash. Требуется настройка переменной окружения:

```env
GOOGLE_API_KEY=your_google_api_key_here
``` 