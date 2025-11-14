# 🎬 Live Bot - Telegram Mini App

[English](./README.md) | Русский

Telegram Mini App для оживления фотографий с помощью искусственного интеллекта KLING.

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+ и npm
- Telegram Bot Token (получить у [@BotFather](https://t.me/BotFather))
- KLING AI API ключ

### Установка

```bash
# 1. Установка зависимостей
npm install
cd client && npm install && cd ..

# 2. Настройка .env
cp .env.example .env
# Отредактируйте .env файл

# 3. Инициализация БД
npm run db:migrate

# 4. Запуск
npm run dev
```

## 🎯 Основные возможности

### Для пользователей
- 📸 Загрузка фотографии
- 🎬 Генерация видео с помощью AI
- 🔑 Добавление ключевых слов для управления анимацией
- 💎 Система кредитов (первая генерация бесплатно!)
- 📜 История всех генераций
- 🎨 Галерея с примерами

### Технические особенности
- ✅ Полная интеграция с Telegram Mini Apps
- ✅ Адаптация под темную/светлую тему Telegram
- ✅ Безопасная аутентификация через Telegram
- ✅ Асинхронная обработка генерации
- ✅ Автоматический возврат кредитов при ошибке

## 📱 Как использовать

1. Найдите вашего бота в Telegram
2. Нажмите `/start`
3. Откройте Mini App
4. Загрузите фото
5. Добавьте ключевые слова (опционально)
6. Нажмите "Оживить"
7. Дождитесь результата в разделе "История"

## 🔧 Конфигурация

### Основные настройки (.env)

```env
# Порт сервера
PORT=3000

# Токен бота
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...

# KLING API
KLING_API_KEY=your_key_here
KLING_API_URL=https://api.kling.ai/v1

# Система кредитов
FREE_CREDITS_NEW_USER=1        # Бесплатные кредиты для новых
CREDITS_PER_GENERATION=1       # Стоимость одной генерации
CREDITS_PACKAGES=10:100,50:450,100:850  # Пакеты credits:price
```

### Настройка Telegram бота

1. Создайте бота через [@BotFather](https://t.me/BotFather):
   ```
   /newbot
   ```

2. Настройте Menu Button:
   ```
   /setmenubutton
   ```
   - URL: `https://yourdomain.com`
   - Text: "🚀 Открыть приложение"

3. Опционально - установите описание и изображение:
   ```
   /setdescription
   /setuserpic
   ```

## 🌐 Деплой

### Вариант 1: VPS (Ubuntu)

```bash
# 1. Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Клонирование и настройка
git clone <repo-url>
cd Live-Bot-TG
npm install
cd client && npm install && cd ..

# 3. Настройка .env для production
nano .env

# 4. Build
npm run build

# 5. Запуск с PM2
npm install -g pm2
pm2 start dist/server/index.js --name live-bot
pm2 startup
pm2 save
```

### Вариант 2: Docker

```dockerfile
# Создайте Dockerfile:
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t live-bot .
docker run -d -p 3000:3000 --env-file .env live-bot
```

### Вариант 3: Cloud сервисы

- **Railway**: Подключите GitHub → Деплой автоматически
- **Render**: Выберите репозиторий → Настройте env vars
- **Heroku**: `heroku create` → `git push heroku main`

### Настройка Nginx + SSL

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Получение SSL сертификата:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🎨 Добавление примеров в галерею

### Способ 1: Через SQL

```sql
INSERT INTO gallery_items (title, video_path, description, display_order, is_active)
VALUES (
  'Танцующий портрет',
  '/full/path/to/uploads/gallery/dancing.mp4',
  'Портрет оживает с танцевальными движениями',
  1,
  1
);
```

### Способ 2: Через seed script

Отредактируйте `server/database/seed.ts` и запустите:

```bash
npm run db:seed
```

## 💳 Настройка платежей Telegram Stars

1. Настройте провайдера в BotFather:
   ```
   /mybots → выберите бота → Payments
   ```

2. Используйте Telegram Stars (XTR) как валюту

3. Обновите frontend для создания инвойсов через Bot API

4. Обрабатывайте webhook платежей в `/api/payment/webhook`

## 🔍 API KLING - Важное замечание

⚠️ **ВАЖНО**: Текущая реализация в `server/services/klingService.ts` является примером.
Вам нужно обновить её согласно актуальной документации KLING API.

Типичные эндпоинты могут выглядеть так:
- `POST /v1/videos/image2video` - создание задачи
- `GET /v1/videos/image2video/:taskId` - проверка статуса

Проверьте официальную документацию: [KLING AI Docs](https://klingai.com/docs)

## 📊 База данных

### Структура таблиц

- **users** - пользователи и их кредиты
- **credit_transactions** - история транзакций
- **generations** - задачи генерации видео
- **gallery_items** - примеры для галереи
- **payment_orders** - заказы на покупку

### Миграция на PostgreSQL

Замените SQLite на PostgreSQL для production:

```bash
npm install pg
```

Обновите `server/database/schema.ts`:
```typescript
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

## 🐛 Troubleshooting

### Проблема: "Invalid Telegram init data"

**Решение**:
- Убедитесь, что `TELEGRAM_BOT_TOKEN` правильный
- Проверьте, что запускаете через Telegram (не браузер напрямую)

### Проблема: "Failed to create KLING task"

**Решение**:
- Проверьте `KLING_API_KEY`
- Убедитесь, что эндпоинты API актуальны
- Проверьте логи сервера для деталей

### Проблема: Загрузка файлов не работает

**Решение**:
- Проверьте права на папку `uploads/`
- Убедитесь, что `MAX_FILE_SIZE` достаточный
- Проверьте логи на ошибки multer

### Проблема: База данных не создается

**Решение**:
```bash
# Создайте директорию вручную
mkdir -p data

# Запустите миграцию
npm run db:migrate

# Проверьте права
chmod 755 data
```

## 🔒 Безопасность

Перед production:

1. ✅ Измените все секретные ключи
2. ✅ Настройте rate limiting
3. ✅ Добавьте валидацию файлов
4. ✅ Используйте HTTPS обязательно
5. ✅ Регулярно делайте backup БД
6. ✅ Настройте мониторинг ошибок

## 📈 Мониторинг

Рекомендуемые инструменты:
- **PM2** - для управления процессом
- **Sentry** - для отслеживания ошибок
- **Grafana** - для метрик
- **New Relic** - для производительности

## 🎓 Дополнительные ресурсы

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [KLING AI](https://klingai.com)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 📞 Контакты и поддержка

Возникли вопросы?
- Создайте Issue в GitHub
- Проверьте FAQ в Wiki
- Свяжитесь с автором

---

Сделано с ❤️ для Telegram Mini Apps
