import { initializeDatabase, closeDatabase } from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Running database migrations...');
initializeDatabase();
console.log('Migrations completed!');
closeDatabase();
