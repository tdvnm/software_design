import { cpSync, mkdirSync, rmSync } from 'node:fs';
// dist contains only generated copies; the browser runs the source unchanged.
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('src', 'dist', { recursive: true });
