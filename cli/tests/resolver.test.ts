import { describe, it, expect } from 'vitest';
import { resolve } from '../src/core/resolver.js';
import { loadManifest } from '../src/core/manifest.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.resolve(__dirname, '../../catalog');
const manifest = loadManifest(CATALOG_PATH);

describe('resolve', () => {
  it('resolves a single backend with no features', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
    }, manifest);

    expect(plan.services).toHaveLength(4);
    expect(plan.services.every(s => s.backend === 'java:spring')).toBe(true);
    expect(plan.frontend).toBeNull();
    expect(plan.deps).toEqual([]);
    expect(plan.features).toEqual([]);
  });

  it('distributes services round-robin for polyglot', () => {
    const plan = resolve({
      backends: ['java:spring', 'python:flask'],
      features: [],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
    }, manifest);

    expect(plan.services).toHaveLength(4);
    // Alphabetical: api-gateway, project-service, task-service, user-service
    // Round-robin: java, python, java, python
    expect(plan.services[0]).toMatchObject({ name: 'api-gateway', backend: 'java:spring' });
    expect(plan.services[1]).toMatchObject({ name: 'project-service', backend: 'python:flask' });
    expect(plan.services[2]).toMatchObject({ name: 'task-service', backend: 'java:spring' });
    expect(plan.services[3]).toMatchObject({ name: 'user-service', backend: 'python:flask' });
  });

  it('resolves frontend', () => {
    const plan = resolve({
      backends: ['java:spring'],
      frontend: 'react:vite',
      features: [],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
    }, manifest);

    expect(plan.frontend).toMatchObject({ key: 'react:vite', label: 'React (Vite)' });
  });

  it('resolves transitive deps from features', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: ['dbm:postgresql'],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
    }, manifest);

    expect(plan.features).toHaveLength(1);
    expect(plan.features[0].key).toBe('dbm:postgresql');
    expect(plan.deps).toHaveLength(1);
    expect(plan.deps[0].key).toBe('db:postgresql');
  });

  it('deduplicates deps when multiple features require the same dep', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: ['dbm:postgresql'],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
    }, manifest);

    expect(plan.deps).toHaveLength(1);
    expect(plan.deps[0].key).toBe('db:postgresql');
  });

  it('collects agent_env from features', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: ['security:code', 'profiling'],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
    }, manifest);

    expect(plan.envVars).toMatchObject({
      DD_IAST_ENABLED: 'true',
      DD_ASM_ENABLED: 'true',
      DD_PROFILING_ENABLED: 'true',
    });
  });

  it('throws on unknown backend', () => {
    expect(() => resolve({
      backends: ['ruby:rails'],
      features: [],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
    }, manifest)).toThrow(/unknown backend.*ruby:rails/i);
  });

  it('throws on unknown feature', () => {
    expect(() => resolve({
      backends: ['java:spring'],
      features: ['unknown:feature'],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
    }, manifest)).toThrow(/unknown feature.*unknown:feature/i);
  });

  it('throws on unsupported stack', () => {
    expect(() => resolve({
      backends: ['java:spring'],
      features: [],
      stack: 'k8s',
      deploy: 'local',
      ddSite: 'datadoghq.com',
    }, manifest)).toThrow(/k8s.*not supported/i);
  });
});
