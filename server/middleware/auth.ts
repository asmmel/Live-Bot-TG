import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Verify Telegram Mini App init data
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramWebAppData(initData: string, botToken: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    if (!hash) {
      return null;
    }

    // Sort parameters alphabetically
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return null;
    }

    // Parse user data
    const userJson = params.get('user');
    if (!userJson) {
      return null;
    }

    const user = JSON.parse(userJson);
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      photo_url: user.photo_url,
      auth_date: parseInt(params.get('auth_date') || '0'),
      hash,
    };
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return null;
  }
}

/**
 * Middleware to authenticate Telegram Mini App requests
 */
export function authenticateTelegramUser(req: Request, res: Response, next: NextFunction) {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (!initData) {
    return res.status(401).json({ error: 'Missing Telegram init data' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const user = verifyTelegramWebAppData(initData, botToken);

  if (!user) {
    return res.status(401).json({ error: 'Invalid Telegram init data' });
  }

  // Check auth_date is not too old (24 hours)
  const now = Math.floor(Date.now() / 1000);
  if (now - user.auth_date > 86400) {
    return res.status(401).json({ error: 'Init data is too old' });
  }

  // Attach user to request
  (req as any).telegramUser = user;
  next();
}
