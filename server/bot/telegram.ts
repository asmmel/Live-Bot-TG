import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set');
  process.exit(1);
}

export const bot = new TelegramBot(token, { polling: true });

const WEBAPP_URL = process.env.TELEGRAM_WEBHOOK_DOMAIN || 'https://yourdomain.com';

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || 'there';

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🚀 Open Live Bot',
          web_app: { url: WEBAPP_URL },
        },
      ],
    ],
  };

  bot.sendMessage(
    chatId,
    `👋 Hello, ${firstName}!\n\n` +
    `Welcome to Live Bot - bring your photos to life with AI! 🎬\n\n` +
    `✨ Features:\n` +
    `• Upload any photo\n` +
    `• Add creative keywords\n` +
    `• Get amazing animated videos\n` +
    `• First generation is FREE! 🎁\n\n` +
    `Tap the button below to start creating!`,
    { reply_markup: keyboard }
  );
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    `📖 How to use Live Bot:\n\n` +
    `1️⃣ Open the app using /start command\n` +
    `2️⃣ Upload your photo\n` +
    `3️⃣ Add keywords (optional) to guide the animation\n` +
    `4️⃣ Click "Animate" and wait for magic! ✨\n\n` +
    `💳 Credits:\n` +
    `• First generation is FREE\n` +
    `• Each generation costs ${process.env.CREDITS_PER_GENERATION || '1'} credit\n` +
    `• Purchase more credits in the app\n\n` +
    `Need help? Contact @your_support_username`
  );
});

// Credits command
bot.onText(/\/credits/, (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '💰 View Balance',
          web_app: { url: WEBAPP_URL },
        },
      ],
    ],
  };

  bot.sendMessage(
    chatId,
    `💎 Credits Info:\n\n` +
    `Credits are used to generate videos from your photos.\n\n` +
    `📊 Pricing:\n` +
    `• ${process.env.CREDITS_PER_GENERATION || '1'} credit = 1 video generation\n\n` +
    `Open the app to check your balance and purchase more credits!`,
    { reply_markup: keyboard }
  );
});

// Gallery command
bot.onText(/\/gallery/, (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🎨 View Gallery',
          web_app: { url: `${WEBAPP_URL}#gallery` },
        },
      ],
    ],
  };

  bot.sendMessage(
    chatId,
    `🎨 Example Gallery\n\n` +
    `Check out amazing examples of what you can create with Live Bot!\n\n` +
    `Get inspired and start creating your own animated masterpieces! 🌟`,
    { reply_markup: keyboard }
  );
});

console.log('Telegram bot is running...');

// Handle errors
bot.on('polling_error', (error) => {
  console.error('Telegram bot polling error:', error);
});
