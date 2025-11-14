import { Router } from 'express';
import { UserModel } from '../models/User.js';
import { authenticateTelegramUser } from '../middleware/auth.js';
import { db } from '../database/schema.js';

const router = Router();

interface PaymentPackage {
  credits: number;
  price: number;
  currency: string;
}

// Get available credit packages
router.get('/packages', (req, res) => {
  try {
    // Parse packages from env: "10:100,50:450,100:850"
    const packagesStr = process.env.CREDITS_PACKAGES || '10:100,50:450,100:850';
    const packages: PaymentPackage[] = packagesStr.split(',').map(pkg => {
      const [credits, price] = pkg.split(':').map(Number);
      return {
        credits,
        price,
        currency: 'XTR', // Telegram Stars
      };
    });

    res.json({ packages });
  } catch (error: any) {
    console.error('Error getting packages:', error);
    res.status(500).json({ error: 'Failed to get packages' });
  }
});

// Create payment invoice (to be called from Telegram)
router.post('/create-invoice', authenticateTelegramUser, (req, res) => {
  try {
    const telegramUser = (req as any).telegramUser;
    const user = UserModel.findByTelegramId(telegramUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { credits, price } = req.body;

    if (!credits || !price) {
      return res.status(400).json({ error: 'Missing credits or price' });
    }

    // Create payment order
    const stmt = db.prepare(`
      INSERT INTO payment_orders (user_id, credits_amount, price_amount, currency, status)
      VALUES (?, ?, ?, 'XTR', 'pending')
    `);

    const result = stmt.run(user.id, credits, price);

    res.json({
      order_id: result.lastInsertRowid,
      credits,
      price,
      currency: 'XTR',
    });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Webhook for successful payments (called by Telegram)
router.post('/webhook', async (req, res) => {
  try {
    const { order_id, telegram_payment_charge_id, provider_payment_charge_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'Missing order_id' });
    }

    // Get payment order
    const orderStmt = db.prepare('SELECT * FROM payment_orders WHERE id = ?');
    const order: any = orderStmt.get(order_id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order already processed' });
    }

    // Update order status
    const updateStmt = db.prepare(`
      UPDATE payment_orders
      SET status = 'completed',
          telegram_payment_charge_id = ?,
          provider_payment_charge_id = ?,
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateStmt.run(telegram_payment_charge_id, provider_payment_charge_id, order_id);

    // Add credits to user
    UserModel.addCredits(
      order.user_id,
      order.credits_amount,
      'purchase',
      `Purchased ${order.credits_amount} credits`
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error processing payment webhook:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

export default router;
