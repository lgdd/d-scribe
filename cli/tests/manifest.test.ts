import { describe, it, expect } from 'vitest';
import { loadManifest } from '../src/core/manifest.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.resolve(__dirname, '../../catalog');

describe('loadManifest', () => {
  it('loads and parses manifest.json from catalog path', () => {
    const manifest = loadManifest(CATALOG_PATH);
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.backends).toHaveProperty('java:spring');
    expect(manifest.backends).toHaveProperty('python:flask');
  });

  it('has features with requires_deps arrays', () => {
    const manifest = loadManifest(CATALOG_PATH);
    expect(manifest.features['dbm:postgresql'].requires_deps).toContain('db:postgresql');
    expect(manifest.features['security:code'].requires_deps).toEqual([]);
  });

  it('has backends with paths', () => {
    const manifest = loadManifest(CATALOG_PATH);
    expect(manifest.backends['java:spring'].path).toBe('backends/java-spring');
  });

  it('throws on missing manifest', () => {
    expect(() => loadManifest('/nonexistent')).toThrow();
  });
});
