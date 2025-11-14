import { db } from './schema.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('Seeding database with sample data...');

// Add sample gallery items
const galleryItems = [
  {
    title: 'Dancing Portrait',
    description: 'A portrait brought to life with dancing movements',
    display_order: 1,
  },
  {
    title: 'Waving Hand',
    description: 'A person waving at the camera',
    display_order: 2,
  },
  {
    title: 'Smiling Face',
    description: 'Natural smile animation',
    display_order: 3,
  },
];

const stmt = db.prepare(`
  INSERT INTO gallery_items (title, video_path, description, display_order, is_active)
  VALUES (?, ?, ?, ?, 1)
`);

galleryItems.forEach((item) => {
  // You need to replace these paths with actual video files
  const videoPath = path.join(__dirname, '../../uploads/gallery', `${item.title.toLowerCase().replace(/ /g, '-')}.mp4`);

  try {
    stmt.run(item.title, videoPath, item.description, item.display_order);
    console.log(`Added gallery item: ${item.title}`);
  } catch (error) {
    console.log(`Gallery item already exists or error: ${item.title}`);
  }
});

console.log('Seeding completed!');
