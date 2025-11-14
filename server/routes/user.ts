import { Router } from 'express';
import { UserModel } from '../models/User.js';
import { authenticateTelegramUser } from '../middleware/auth.js';

const router = Router();

// Get or create user profile
router.get('/profile', authenticateTelegramUser, (req, res) => {
  try {
    const telegramUser = (req as any).telegramUser;

    const user = UserModel.findOrCreate({
      telegram_id: telegramUser.id,
      username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
    });

    res.json({
      id: user.id,
      telegram_id: user.telegram_id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      credits: user.credits,
      created_at: user.created_at,
    });
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Get user credits
router.get('/credits', authenticateTelegramUser, (req, res) => {
  try {
    const telegramUser = (req as any).telegramUser;
    const user = UserModel.findByTelegramId(telegramUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      credits: user.credits,
    });
  } catch (error: any) {
    console.error('Error getting credits:', error);
    res.status(500).json({ error: 'Failed to get credits' });
  }
});

// Get credit transaction history
router.get('/credits/history', authenticateTelegramUser, (req, res) => {
  try {
    const telegramUser = (req as any).telegramUser;
    const user = UserModel.findByTelegramId(telegramUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const history = UserModel.getCreditHistory(user.id, limit);

    res.json({ history });
  } catch (error: any) {
    console.error('Error getting credit history:', error);
    res.status(500).json({ error: 'Failed to get credit history' });
  }
});

export default router;
