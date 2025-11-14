import { Router } from 'express';
import { db } from '../database/schema.js';

const router = Router();

interface GalleryItem {
  id: number;
  title: string;
  video_path: string;
  thumbnail_path?: string;
  description?: string;
  display_order: number;
}

// Get all active gallery items (public endpoint)
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, title, video_path, thumbnail_path, description, display_order
      FROM gallery_items
      WHERE is_active = 1
      ORDER BY display_order ASC, created_at DESC
    `);

    const items = stmt.all() as GalleryItem[];

    const result = items.map(item => ({
      id: item.id,
      title: item.title,
      video_url: `/api/gallery/videos/${item.id}`,
      thumbnail_url: item.thumbnail_path ? `/api/gallery/thumbnails/${item.id}` : null,
      description: item.description,
    }));

    res.json({ items: result });
  } catch (error: any) {
    console.error('Error getting gallery items:', error);
    res.status(500).json({ error: 'Failed to get gallery items' });
  }
});

// Serve gallery video files
router.get('/videos/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const stmt = db.prepare('SELECT video_path FROM gallery_items WHERE id = ? AND is_active = 1');
    const item = stmt.get(itemId) as GalleryItem | undefined;

    if (!item || !item.video_path) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.sendFile(item.video_path, { root: '/' });
  } catch (error: any) {
    console.error('Error serving gallery video:', error);
    res.status(500).json({ error: 'Failed to serve video' });
  }
});

// Serve gallery thumbnail files
router.get('/thumbnails/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const stmt = db.prepare('SELECT thumbnail_path FROM gallery_items WHERE id = ? AND is_active = 1');
    const item = stmt.get(itemId) as GalleryItem | undefined;

    if (!item || !item.thumbnail_path) {
      return res.status(404).json({ error: 'Thumbnail not found' });
    }

    res.sendFile(item.thumbnail_path, { root: '/' });
  } catch (error: any) {
    console.error('Error serving gallery thumbnail:', error);
    res.status(500).json({ error: 'Failed to serve thumbnail' });
  }
});

export default router;
