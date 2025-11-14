# 🌐 Деплой на BEGET VPS

## Вариант 1: VPS на BEGET (Рекомендуется)

Если у вас VPS на BEGET - это идеальный вариант для production.

### Шаг 1: Подключение к VPS

```bash
# Подключитесь по SSH
ssh root@your-server-ip
# или
ssh username@your-server-ip
```

### Шаг 2: Установка Node.js на Ubuntu/Debian

```bash
# Обновите систему
sudo apt update
sudo apt upgrade -y

# Установите Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Проверьте установку
node --version
npm --version

# Установите PM2 для управления процессом
sudo npm install -g pm2
```

### Шаг 3: Клонирование проекта

```bash
# Создайте директорию для проекта
cd /var/www
sudo mkdir live-bot
sudo chown $USER:$USER live-bot
cd live-bot

# Клонируйте репозиторий
git clone https://github.com/your-repo/Live-Bot-TG.git .

# Установите зависимости
npm install
cd client
npm install
cd ..
```

### Шаг 4: Настройка .env

```bash
# Создайте .env файл
nano .env
```

**Production конфигурация:**

```env
PORT=3000
NODE_ENV=production

# Ваш реальный домен на BEGET
TELEGRAM_BOT_TOKEN=your_real_bot_token
TELEGRAM_WEBHOOK_DOMAIN=https://yourdomain.ru

# KLING API
KLING_API_KEY=your_kling_api_key
KLING_API_URL=https://api.kling.ai/v1

# База данных
DATABASE_PATH=/var/www/live-bot/data/database.sqlite

# Кредиты
FREE_CREDITS_NEW_USER=1
CREDITS_PER_GENERATION=1
CREDITS_PACKAGES=10:100,50:450,100:850

# Файлы
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/var/www/live-bot/uploads

# Frontend URL
FRONTEND_URL=https://yourdomain.ru
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 5: Инициализация базы данных

```bash
# Создайте директории
mkdir -p data uploads/images uploads/videos uploads/gallery

# Инициализируйте БД
npm run db:migrate

# Опционально - добавьте примеры
npm run db:seed
```

### Шаг 6: Build проекта

```bash
npm run build
```

### Шаг 7: Запуск с PM2

```bash
# Запустите приложение
pm2 start dist/server/index.js --name live-bot

# Автозапуск при перезагрузке сервера
pm2 startup
pm2 save

# Проверьте статус
pm2 status
pm2 logs live-bot
```

### Шаг 8: Настройка Nginx

```bash
# Установите Nginx
sudo apt install -y nginx

# Создайте конфигурацию
sudo nano /etc/nginx/sites-available/live-bot
```

**Конфигурация Nginx:**

```nginx
server {
    listen 80;
    server_name yourdomain.ru www.yourdomain.ru;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.ru www.yourdomain.ru;

    # SSL сертификаты (после установки Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.ru/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Логи
    access_log /var/log/nginx/live-bot-access.log;
    error_log /var/log/nginx/live-bot-error.log;

    # Основной прокси
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }

    # Статические файлы (видео, изображения)
    location /api/videos {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # Увеличенный лимит для загрузки файлов
    client_max_body_size 20M;
}
```

Сохраните и выйдите.

```bash
# Активируйте конфигурацию
sudo ln -s /etc/nginx/sites-available/live-bot /etc/nginx/sites-enabled/

# Удалите дефолтную конфигурацию
sudo rm /etc/nginx/sites-enabled/default

# Проверьте конфигурацию
sudo nginx -t

# Не перезагружайте пока - сначала настроим SSL
```

### Шаг 9: Установка SSL сертификата (Let's Encrypt)

```bash
# Установите Certbot
sudo apt install -y certbot python3-certbot-nginx

# Временно измените конфигурацию для получения сертификата
sudo nano /etc/nginx/sites-available/live-bot
```

**Временная конфигурация (закомментируйте SSL строки):**

```nginx
server {
    listen 80;
    server_name yourdomain.ru www.yourdomain.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
# Перезапустите Nginx
sudo systemctl restart nginx

# Получите сертификат
sudo certbot --nginx -d yourdomain.ru -d www.yourdomain.ru

# Certbot автоматически настроит SSL!
# Выберите опцию 2 (Redirect HTTP to HTTPS)

# Проверьте авто-обновление
sudo certbot renew --dry-run
```

### Шаг 10: Настройка домена на BEGET

В панели управления BEGET:

1. **Домены** → Выберите ваш домен
2. **DNS записи** → Добавьте:
   - **A запись**: `@` → IP вашего VPS
   - **A запись**: `www` → IP вашего VPS

Подождите 5-30 минут для распространения DNS.

### Шаг 11: Обновление Telegram бота

1. Откройте [@BotFather](https://t.me/BotFather)
2. `/setmenubutton`
3. Выберите бота
4. **URL**: `https://yourdomain.ru`
5. **Text**: `🚀 Открыть приложение`

### Шаг 12: Тестирование

```bash
# Проверьте, что всё работает
curl http://localhost:3000/api/health

# Проверьте через домен
curl https://yourdomain.ru/api/health

# Откройте бота в Telegram и протестируйте!
```

## 🔄 Управление приложением

```bash
# Просмотр логов
pm2 logs live-bot

# Перезапуск
pm2 restart live-bot

# Остановка
pm2 stop live-bot

# Удаление из PM2
pm2 delete live-bot

# Обновление кода
cd /var/www/live-bot
git pull
npm install
cd client && npm install && cd ..
npm run build
pm2 restart live-bot
```

## 🔒 Безопасность

```bash
# Настройте firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Создайте отдельного пользователя (опционально)
sudo adduser livebot
sudo usermod -aG sudo livebot

# Ограничьте доступ к .env
chmod 600 /var/www/live-bot/.env
```

## 📊 Мониторинг

```bash
# Установите monitoring dashboard для PM2
pm2 install pm2-logrotate

# Настройте логи
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Просмотр ресурсов
pm2 monit
```

## 🐛 Troubleshooting

### Ошибка: "Port 3000 already in use"

```bash
# Найдите процесс
sudo lsof -i :3000

# Убейте процесс
sudo kill -9 <PID>
```

### Ошибка: "Permission denied" для базы данных

```bash
# Установите права
sudo chown -R $USER:$USER /var/www/live-bot/data
chmod 755 /var/www/live-bot/data
chmod 644 /var/www/live-bot/data/database.sqlite
```

### Nginx не запускается

```bash
# Проверьте конфигурацию
sudo nginx -t

# Просмотрите логи
sudo tail -f /var/log/nginx/error.log
```

### SSL сертификат не выдаётся

```bash
# Проверьте, что домен указывает на ваш IP
dig yourdomain.ru

# Убедитесь, что порт 80 открыт
sudo ufw status

# Попробуйте снова
sudo certbot --nginx -d yourdomain.ru
```

---

## Вариант 2: Виртуальный хостинг BEGET (ограничения)

⚠️ **Не рекомендуется** для Node.js приложений

На обычном виртуальном хостинге BEGET (не VPS):
- ❌ Нельзя запустить Node.js сервер
- ❌ Нет SSH доступа
- ❌ Только PHP/MySQL

**Решение**: Используйте VPS на BEGET или другом провайдере.

---

## 💡 Альтернативы BEGET VPS

Если нет VPS на BEGET, можно использовать:

- **DigitalOcean** - от $6/месяц
- **Hetzner** - от €4.5/месяц
- **Timeweb** (РФ) - от 200₽/месяц
- **VDSina** (РФ) - от 150₽/месяц
- **REG.RU VPS** - от 200₽/месяц

Все провайдеры предоставляют Ubuntu VPS, инструкции выше подойдут для любого.

---

## 📝 Чек-лист запуска

- [ ] VPS настроен, SSH доступ есть
- [ ] Node.js 18+ установлен
- [ ] Проект склонирован
- [ ] .env настроен с реальными токенами
- [ ] База данных инициализирована
- [ ] Проект собран (npm run build)
- [ ] PM2 запущен и работает
- [ ] Nginx установлен и настроен
- [ ] SSL сертификат получен
- [ ] DNS записи настроены
- [ ] Домен доступен через HTTPS
- [ ] BotFather обновлён с новым URL
- [ ] Протестировано в Telegram

**Готово! Ваш бот работает на production!** 🚀
