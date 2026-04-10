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
    expect(manifest.features['apm:profiling']).toBeDefined();
    expect(manifest.features['security:siem']).toBeDefined();
  });

  it('has backends with paths', () => {
    const manifest = loadManifest(CATALOG_PATH);
    expect(manifest.backends['java:spring'].path).toBe('backends/java-spring');
  });

  it('has deploy targets with labels and defaults', () => {
    const manifest = loadManifest(CATALOG_PATH);
    expect(manifest.infra.deploy).toHaveProperty('compose:local');
    expect(manifest.infra.deploy['compose:local'].label).toBe('Docker Compose (local)');
    expect(manifest.infra.defaults).toHaveProperty('compose');
    expect(manifest.infra.defaults['compose']).toBe('compose:local');
  });

  it('has features with optional supported_backends arrays', () => {
    const manifest = loadManifest(CATALOG_PATH);
    // dbm:postgresql has no supported_backends (means all)
    expect(manifest.features['dbm:postgresql'].supported_backends).toBeUndefined();
  });

  it('has all 13 features defined', () => {
    const manifest = loadManifest(CATALOG_PATH);
    const keys = Object.keys(manifest.features);
    expect(keys).toHaveLength(13);
    expect(keys).toContain('dbm:postgresql');
    expect(keys).toContain('dbm:mysql');
    expect(keys).toContain('dbm:mongodb');
    expect(keys).toContain('apm:profiling');
    expect(keys).toContain('security:code');
    expect(keys).toContain('security:sast');
    expect(keys).toContain('security:app-protection');
    expect(keys).toContain('security:workload-protection');
    expect(keys).toContain('security:siem');
    expect(keys).toContain('ai:llmobs');
    expect(keys).toContain('djm:spark');
    expect(keys).toContain('djm:airflow');
    expect(keys).toContain('dsm:kafka');
  });

  it('throws on missing manifest', () => {
    expect(() => loadManifest('/nonexistent')).toThrow();
  });
});
