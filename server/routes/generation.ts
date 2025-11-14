import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../models/User.js';
import { GenerationModel } from '../models/Generation.js';
import { authenticateTelegramUser } from '../middleware/auth.js';
import { klingService } from '../services/klingService.js';

const router = Router();

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadDir, 'images');
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// Create a new generation
router.post('/create', authenticateTelegramUser, upload.single('image'), async (req, res) => {
  try {
    const telegramUser = (req as any).telegramUser;
    const user = UserModel.findByTelegramId(telegramUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const keywords = req.body.keywords || '';
    const creditsRequired = parseInt(process.env.CREDITS_PER_GENERATION || '1');

    // Check if user has enough credits
    if (user.credits < creditsRequired) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(402).json({
        error: 'Insufficient credits',
        required: creditsRequired,
        available: user.credits,
      });
    }

    // Deduct credits
    const success = UserModel.deductCredits(user.id, creditsRequired, 'Video generation');
    if (!success) {
      fs.unlinkSync(req.file.path);
      return res.status(402).json({ error: 'Failed to deduct credits' });
    }

    // Create generation record
    const generation = GenerationModel.create({
      user_id: user.id,
      image_path: req.file.path,
      keywords,
      credits_spent: creditsRequired,
    });

    // Start generation process asynchronously
    processGeneration(generation.id).catch(error => {
      console.error(`Error processing generation ${generation.id}:`, error);
    });

    res.json({
      generation_id: generation.id,
      status: generation.status,
      message: 'Generation started',
    });
  } catch (error: any) {
    console.error('Error creating generation:', error);
    res.status(500).json({ error: 'Failed to create generation' });
  }
});

// Get generation status
router.get('/:id', authenticateTelegramUser, (req, res) => {
  try {
    const telegramUser = (req as any).telegramUser;
    const user = UserModel.findByTelegramId(telegramUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const generationId = parseInt(req.params.id);
    const generation = GenerationModel.findById(generationId);

    if (!generation) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    // Check ownership
    if (generation.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: generation.id,
      status: generation.status,
      video_url: generation.video_path ? `/api/videos/${path.basename(generation.video_path)}` : null,
      keywords: generation.keywords,
      created_at: generation.created_at,
      completed_at: generation.completed_at,
      error_message: generation.error_message,
    });
  } catch (error: any) {
    console.error('Error getting generation:', error);
    res.status(500).json({ error: 'Failed to get generation' });
  }
});

// Get user's generations history
router.get('/', authenticateTelegramUser, (req, res) => {
  try {
    const telegramUser = (req as any).telegramUser;
    const user = UserModel.findByTelegramId(telegramUser.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const generations = GenerationModel.findByUserId(user.id, limit);

    const result = generations.map(gen => ({
      id: gen.id,
      status: gen.status,
      video_url: gen.video_path ? `/api/videos/${path.basename(gen.video_path)}` : null,
      keywords: gen.keywords,
      created_at: gen.created_at,
      completed_at: gen.completed_at,
      credits_spent: gen.credits_spent,
    }));

    res.json({ generations: result });
  } catch (error: any) {
    console.error('Error getting generations:', error);
    res.status(500).json({ error: 'Failed to get generations' });
  }
});

// Process generation asynchronously
async function processGeneration(generationId: number) {
  try {
    const generation = GenerationModel.findById(generationId);
    if (!generation) {
      throw new Error('Generation not found');
    }

    // Update status to processing
    GenerationModel.updateStatus(generationId, 'processing');

    // Build prompt with keywords
    let prompt = 'Animate this image, bring it to life with natural movement';
    if (generation.keywords) {
      prompt += `, ${generation.keywords}`;
    }

    // Create KLING task
    const taskId = await klingService.createImageToVideoTask({
      imagePath: generation.image_path,
      prompt,
      duration: 5,
      aspectRatio: '16:9',
    });

    GenerationModel.updateStatus(generationId, 'processing', { kling_task_id: taskId });

    // Wait for completion
    const result = await klingService.waitForCompletion(taskId);

    if (result.status === 'completed' && result.video_url) {
      // Download video
      const videoDir = path.join(uploadDir, 'videos');
      if (!fs.existsSync(videoDir)) {
        fs.mkdirSync(videoDir, { recursive: true });
      }

      const videoPath = path.join(videoDir, `${uuidv4()}.mp4`);
      await klingService.downloadVideo(result.video_url, videoPath);

      GenerationModel.updateStatus(generationId, 'completed', { video_path: videoPath });
    } else {
      GenerationModel.updateStatus(generationId, 'failed', {
        error_message: result.error || 'Unknown error',
      });

      // Refund credits
      const gen = GenerationModel.findById(generationId);
      if (gen) {
        UserModel.addCredits(gen.user_id, gen.credits_spent, 'refund', 'Generation failed');
      }
    }
  } catch (error: any) {
    console.error(`Error processing generation ${generationId}:`, error);
    GenerationModel.updateStatus(generationId, 'failed', {
      error_message: error.message,
    });

    // Refund credits
    const gen = GenerationModel.findById(generationId);
    if (gen) {
      UserModel.addCredits(gen.user_id, gen.credits_spent, 'refund', 'Generation failed');
    }
  }
}

export default router;
