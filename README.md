# 🎬 Live Bot - Telegram Mini App

Telegram Mini App для генерации видео из фотографий с использованием AI сервиса KLING.

## 🌟 Функционал

- 📸 **Загрузка фотографий** - загружайте любые изображения
- ✨ **AI генерация видео** - оживите свои фото с помощью KLING AI
- 💎 **Система кредитов** - покупка и использование кредитов для генерации
- 🎁 **Первая генерация бесплатно** - новые пользователи получают бесплатный кредит
- 🎨 **Галерея примеров** - смотрите примеры созданных видео
- 📜 **История генераций** - отслеживайте все свои созданные видео
- 🔑 **Ключевые слова** - добавляйте подсказки для более точной генерации

## 🏗 Архитектура

### Backend
- **Node.js** + **Express** + **TypeScript**
- **SQLite** база данных (легко заменить на PostgreSQL)
- **KLING API** интеграция для генерации видео
- **Telegram Bot API** для работы с ботом
- Multer для загрузки файлов
- Аутентификация через Telegram WebApp

### Frontend
- **React 18** + **TypeScript**
- **Vite** для быстрой разработки
- **Telegram WebApp SDK** для интеграции с Telegram
- Адаптивный дизайн под Telegram тему

## 📦 Установка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd Live-Bot-TG
```

### 2. Установка зависимостей

```bash
# Установка backend зависимостей
npm install

# Установка frontend зависимостей
cd client
npm install
cd ..
```

### 3. Настройка переменных окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Заполните необходимые данные:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_DOMAIN=https://yourdomain.com

# KLING API Configuration
KLING_API_KEY=your_kling_api_key_here
KLING_API_URL=https://api.kling.ai/v1

# Database
DATABASE_PATH=./data/database.sqlite

# Credits System
FREE_CREDITS_NEW_USER=1
CREDITS_PER_GENERATION=1
CREDITS_PACKAGES=10:100,50:450,100:850

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 4. Создание Telegram бота

1. Найдите [@BotFather](https://t.me/BotFather) в Telegram
2. Создайте нового бота командой `/newbot`
3. Получите токен и добавьте его в `.env` как `TELEGRAM_BOT_TOKEN`
4. Настройте Menu Button для вашего бота:
   - `/setmenubutton` → выберите вашего бота
   - Выберите "Configure menu button"
   - URL: ваш домен (например, `https://yourdomain.com`)
   - Text: "Open Live Bot" или "🚀 Открыть приложение"

### 5. Получение KLING API ключа

1. Зарегистрируйтесь на [KLING AI](https://klingai.com)
2. Получите API ключ
3. Добавьте его в `.env` как `KLING_API_KEY`

**ВАЖНО:** Проверьте актуальную документацию KLING API, так как эндпоинты могут измениться.

### 6. Инициализация базы данных

```bash
npm run db:migrate
```

Опционально, добавьте примеры в галерею:

```bash
npm run db:seed
```

## 🚀 Запуск

### Режим разработки

Запустить backend и frontend одновременно:

```bash
npm run dev
```

Или отдельно:

```bash
# Backend
npm run server:dev

# Frontend (в другом терминале)
npm run client:dev
```

Backend будет доступен на `http://localhost:3000`
Frontend будет доступен на `http://localhost:5173`

### Режим production

```bash
# Build проекта
npm run build

# Запуск
npm start
```

## 🌐 Деплой

### Настройка домена и HTTPS

Telegram Mini Apps требуют HTTPS. Используйте:
- **Nginx** с Let's Encrypt для SSL
- **Cloudflare** для прокси и SSL
- **VPS** или **Cloud** сервисы (AWS, DigitalOcean, Heroku, Railway, Render и т.д.)

### Пример конфигурации Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Настройка Telegram бота после деплоя

После деплоя обновите:
1. `TELEGRAM_WEBHOOK_DOMAIN` в `.env` на ваш реальный домен
2. Menu Button URL в BotFather

## 📁 Структура проекта

```
Live-Bot-TG/
├── server/                 # Backend код
│   ├── database/          # Схема БД и миграции
│   ├── models/            # Модели данных (User, Generation)
│   ├── routes/            # API endpoints
│   ├── services/          # Сервисы (KLING API)
│   ├── middleware/        # Middleware (auth)
│   ├── bot/               # Telegram bot
│   └── index.ts           # Главный файл сервера
├── client/                # Frontend код
│   ├── src/
│   │   ├── api/          # API клиент
│   │   ├── hooks/        # React hooks
│   │   ├── App.tsx       # Главный компонент
│   │   └── main.tsx      # Entry point
│   └── index.html
├── data/                  # SQLite база данных
├── uploads/               # Загруженные файлы и видео
├── .env                   # Переменные окружения
├── package.json
└── README.md
```

## 🔌 API Endpoints

### User
- `GET /api/user/profile` - Получить профиль пользователя
- `GET /api/user/credits` - Получить баланс кредитов
- `GET /api/user/credits/history` - История транзакций

### Generation
- `POST /api/generation/create` - Создать новую генерацию
- `GET /api/generation/:id` - Получить статус генерации
- `GET /api/generation` - История генераций пользователя

### Gallery
- `GET /api/gallery` - Получить примеры из галереи
- `GET /api/gallery/videos/:id` - Получить видео из галереи

### Payment
- `GET /api/payment/packages` - Получить доступные пакеты кредитов
- `POST /api/payment/create-invoice` - Создать счет для оплаты
- `POST /api/payment/webhook` - Webhook для обработки платежей

## 💳 Интеграция платежей

Проект поддерживает **Telegram Stars** для покупки кредитов.

Настройка:
1. Настройте payment provider в BotFather
2. Обновите `CREDITS_PACKAGES` в `.env` (формат: `credits:price,credits:price`)
3. Реализуйте обработку платежей через Telegram Bot API

## 🎨 Добавление видео в галерею

1. Поместите видео файлы в `uploads/gallery/`
2. Обновите `server/database/seed.ts` с путями к видео
3. Запустите: `npm run db:seed`

Или добавьте вручную через SQL:

```sql
INSERT INTO gallery_items (title, video_path, description, display_order, is_active)
VALUES ('My Video', '/path/to/video.mp4', 'Description', 1, 1);
```

## 🛠 Разработка

### Команды

```bash
npm run dev              # Запуск dev режима (backend + frontend)
npm run server:dev       # Только backend
npm run client:dev       # Только frontend
npm run build           # Build production версии
npm run db:migrate      # Создать/обновить БД
npm run db:seed         # Добавить тестовые данные
```

### Тестирование локально без Telegram

Для тестирования без Telegram используйте инструменты:
- [Telegram WebApp Debug Tool](https://core.telegram.org/bots/webapps#debug-mode-for-mini-apps)
- Или создайте mock данные в коде

## 📝 TODO / Будущие улучшения

- [ ] Полная интеграция Telegram Stars платежей
- [ ] Уведомления о завершении генерации
- [ ] Поддержка различных форматов видео
- [ ] Улучшенная обработка ошибок
- [ ] Админ панель для управления
- [ ] Поддержка нескольких языков
- [ ] Rate limiting для предотвращения злоупотреблений
- [ ] Аналитика и статистика
- [ ] Возможность делиться результатами

## 🐛 Известные проблемы

- KLING API эндпоинты могут отличаться - проверьте документацию
- Требуется обновить `klingService.ts` под актуальный API
- Telegram Stars интеграция требует дополнительной настройки

## 📄 Лицензия

ISC

## 🤝 Поддержка

При возникновении проблем:
1. Проверьте `.env` конфигурацию
2. Убедитесь, что KLING API ключ валиден
3. Проверьте логи сервера
4. Создайте issue в репозитории

## 👨‍💻 Автор

Создано для Telegram Mini Apps Contest

---

**Важно:** Перед использованием в production обязательно:
- Настройте правильную аутентификацию
- Добавьте rate limiting
- Настройте мониторинг
- Сделайте backup базы данных
- Проверьте безопасность загрузки файлов
