import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultPath = fileURLToPath(new URL('../data/tracey.sqlite', import.meta.url));

export function openDatabase(path = process.env.TRACEY_DB || defaultPath) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  try {
    const version = db.prepare('PRAGMA user_version').get().user_version;
    if (version > 1) throw new Error('This database uses a newer schema than this app.');
    db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}
