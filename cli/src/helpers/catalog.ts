import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDir(name: string): string {
  // In dist: tsup bundles to dist/index.js, __dirname IS dist/.
  // Postbuild copies catalog/, skills/ into dist/.
  const distDir = path.resolve(__dirname, name);
  if (fs.existsSync(distDir)) return distDir;
  // In dev (tsx): running from src/helpers/, dirs are at repo root (3 levels up)
  return path.resolve(__dirname, '..', '..', '..', name);
}

export function catalogPath(): string {
  return resolveDir('catalog');
}

export function skillsPath(): string {
  return resolveDir('skills');
}

export function templatesPath(): string {
  // In dist: __dirname is dist/, templates copied to dist/templates/
  const distDir = path.resolve(__dirname, 'templates');
  if (fs.existsSync(distDir)) return distDir;
  // In dev: running from src/helpers/, templates are at src/templates/ (1 level up)
  return path.resolve(__dirname, '..', 'templates');
}
