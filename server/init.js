import { openDatabase } from './database.js';

const db = openDatabase();
console.log('SQLite schema ready. Use npm run db:import to load the course CSV.');
db.close();
