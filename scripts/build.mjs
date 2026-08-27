import { cpSync, mkdirSync } from 'node:fs';
mkdirSync('dist', { recursive: true });
cpSync('src', 'dist', { recursive: true, filter: path => !path.endsWith('.scss') });
