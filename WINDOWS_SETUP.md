# 🪟 Запуск на Windows для разработки

## Предварительные требования

1. **Node.js 18+** - https://nodejs.org/
2. **Git** - https://git-scm.com/download/win
3. **Telegram аккаунт** для создания бота

## Шаг 1: Установка

```powershell
# Откройте PowerShell или Command Prompt

# Клонируйте репозиторий (или скачайте ZIP)
git clone https://github.com/your-repo/Live-Bot-TG.git
cd Live-Bot-TG

# Установите зависимости
npm install
cd client
npm install
cd ..
```

## Шаг 2: Создание Telegram бота

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям и получите токен
4. Сохраните токен - он понадобится в `.env`

## Шаг 3: Настройка .env

```powershell
# Скопируйте пример
copy .env.example .env

# Откройте в блокноте
notepad .env
```

**Минимальная конфигурация для локального тестирования:**

```env
PORT=3000
NODE_ENV=development

# Ваш токен от BotFather
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Пока оставьте пустыми или заглушки
KLING_API_KEY=your_key_here
KLING_API_URL=https://api.kling.ai/v1

DATABASE_PATH=./data/database.sqlite

# Кредиты
FREE_CREDITS_NEW_USER=1
CREDITS_PER_GENERATION=1

MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Для локальной разработки
FRONTEND_URL=http://localhost:5173
```

## Шаг 4: Инициализация базы данных

```powershell
npm run db:migrate
```

Вы должны увидеть: "Database initialized successfully"

## Шаг 5: Запуск в режиме разработки

### Вариант A: Запустить всё сразу

```powershell
npm run dev
```

Это запустит:
- Backend на http://localhost:3000
- Frontend на http://localhost:5173

### Вариант B: Запустить отдельно (в двух терминалах)

**Терминал 1 - Backend:**
```powershell
npm run server:dev
```

**Терминал 2 - Frontend:**
```powershell
cd client
npm run dev
```

## Шаг 6: Настройка HTTPS для Telegram (ngrok)

Telegram Mini Apps требуют HTTPS. Используйте ngrok:

### Установка ngrok

1. Скачайте: https://ngrok.com/download
2. Распакуйте в любую папку (например, `C:\ngrok`)
3. Зарегистрируйтесь на сайте и получите authtoken
4. Выполните: `ngrok config add-authtoken YOUR_TOKEN`

### Использование

```powershell
# В новом терминале
ngrok http 3000
```

Вы получите URL типа: `https://abc123.ngrok-free.app`

### Обновите .env

```env
TELEGRAM_WEBHOOK_DOMAIN=https://abc123.ngrok-free.app
FRONTEND_URL=https://abc123.ngrok-free.app
```

Перезапустите сервер после изменения .env

## Шаг 7: Настройка Menu Button в BotFather

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/setmenubutton`
3. Выберите вашего бота
4. Нажмите "Configure menu button"
5. Введите:
   - **URL**: `https://abc123.ngrok-free.app` (ваш ngrok URL)
   - **Text**: `🚀 Открыть приложение`

## Шаг 8: Тестирование

1. Найдите вашего бота в Telegram
2. Отправьте `/start`
3. Нажмите кнопку внизу или кнопку Menu
4. Должно открыться Mini App!

## 🐛 Troubleshooting

### Ошибка: "Module not found"

```powershell
# Удалите node_modules и переустановите
rmdir /s node_modules
rmdir /s client\node_modules
npm install
cd client
npm install
cd ..
```

### Ошибка: "Port 3000 already in use"

```powershell
# Найдите процесс на порту 3000
netstat -ano | findstr :3000

# Убейте процесс (замените PID на номер из вывода выше)
taskkill /PID <PID> /F

# Или измените порт в .env
PORT=3001
```

### Ошибка: "Cannot find module 'tsx'"

```powershell
npm install -g tsx
```

### Проблемы с ngrok

- **Бесплатный план**: ngrok URL меняется при каждом запуске
- **Решение**: Используйте платный план ($8/мес) для постоянного URL
- **Альтернатива**: localtunnel - `npm install -g localtunnel && lt --port 3000`

### "Invalid Telegram init data"

- Убедитесь, что `TELEGRAM_BOT_TOKEN` правильный
- Проверьте, что открываете через Telegram, а не браузер напрямую
- Убедитесь, что ngrok URL совпадает с URL в BotFather

## 🎨 Тестирование без Telegram

Если хотите просто посмотреть интерфейс:

1. Откройте http://localhost:5173 в браузере
2. Увидите ошибку аутентификации, но интерфейс будет виден
3. Для полного тестирования нужен настоящий Telegram

## 📝 Разработка без KLING API

Если у вас пока нет KLING API ключа:

1. Можете тестировать интерфейс и загрузку фото
2. Генерация видео будет выдавать ошибку
3. Позже добавите реальный API ключ

Можно создать mock сервис для тестирования:

`server/services/klingService.mock.ts`:
```typescript
export class MockKlingService {
  async createImageToVideoTask(): Promise<string> {
    console.log('MOCK: Creating task...');
    return 'mock-task-id-' + Date.now();
  }

  async getTaskStatus(taskId: string) {
    console.log('MOCK: Checking status...');
    // Симулируем завершение через 10 секунд
    return {
      task_id: taskId,
      status: 'completed',
      video_url: 'https://example.com/video.mp4'
    };
  }
}
```

## 🚀 Следующие шаги

После успешного запуска на Windows:

1. ✅ Протестируйте все функции локально
2. ✅ Получите KLING API ключ
3. ✅ Настройте платежи (опционально)
4. ✅ Добавьте видео в галерею
5. ✅ Задеплойте на реальный сервер для production

## 💡 Полезные команды

```powershell
# Проверить версию Node.js
node --version

# Проверить версию npm
npm --version

# Очистить кеш npm
npm cache clean --force

# Пересобрать проект
npm run build

# Запустить production версию локально
npm start

# Посмотреть логи
# Логи будут в консоли, где запущен сервер

# Остановить сервер
# Нажмите Ctrl+C в терминале
```

## 🌐 Переход на production сервер

Когда всё протестировано локально:

1. Арендуйте VPS (DigitalOcean, AWS, Hetzner)
2. Установите Ubuntu/Debian
3. Следуйте инструкциям из README.md для деплоя
4. Настройте Nginx + Let's Encrypt для постоянного HTTPS
5. Обновите URL в BotFather на постоянный

---

**Готово!** Теперь можете разрабатывать и тестировать на Windows 🎉
