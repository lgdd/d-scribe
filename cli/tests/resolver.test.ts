import { describe, it, expect } from 'vitest';
import { resolve } from '../src/core/resolver.js';
import { loadManifest } from '../src/core/manifest.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.resolve(__dirname, '../../catalog');
const manifest = loadManifest(CATALOG_PATH);

describe('resolve', () => {
  it('creates N services with generic names (default 4)', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
      serviceCount: 4,
    }, manifest);

    expect(plan.services).toHaveLength(4);
    expect(plan.services.map(s => s.name)).toEqual(['service-1', 'service-2', 'service-3', 'service-4']);
    expect(plan.services.every(s => s.backend === 'java:spring')).toBe(true);
  });

  it('creates custom number of services', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
      serviceCount: 2,
    }, manifest);

    expect(plan.services).toHaveLength(2);
    expect(plan.services.map(s => s.name)).toEqual(['service-1', 'service-2']);
  });

  it('assigns dynamic ports starting at 8080', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
      serviceCount: 3,
    }, manifest);

    expect(plan.services[0].port).toBe(8080);
    expect(plan.services[1].port).toBe(8081);
    expect(plan.services[2].port).toBe(8082);
  });

  it('distributes services round-robin for polyglot', () => {
    const plan = resolve({
      backends: ['java:spring', 'python:flask'],
      features: [],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
      serviceCount: 4,
    }, manifest);

    expect(plan.services).toHaveLength(4);
    expect(plan.services[0]).toMatchObject({ name: 'service-1', backend: 'java:spring' });
    expect(plan.services[1]).toMatchObject({ name: 'service-2', backend: 'python:flask' });
    expect(plan.services[2]).toMatchObject({ name: 'service-3', backend: 'java:spring' });
    expect(plan.services[3]).toMatchObject({ name: 'service-4', backend: 'python:flask' });
  });

  it('resolves frontend', () => {
    const plan = resolve({
      backends: ['java:spring'],
      frontend: 'react:vite',
      features: [],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
      serviceCount: 4,
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
      serviceCount: 4,
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
      serviceCount: 4,
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
      serviceCount: 4,
    }, manifest);

    expect(plan.envVars).toMatchObject({
      DD_IAST_ENABLED: 'true',
      DD_ASM_ENABLED: 'true',
      DD_PROFILING_ENABLED: 'true',
    });
  });

  it('includes backendPath with service-template for each service', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
      serviceCount: 2,
    }, manifest);

    expect(plan.services[0].backendPath).toBe('backends/java-spring');
    expect(plan.services[1].backendPath).toBe('backends/java-spring');
  });

  it('throws on unknown backend', () => {
    expect(() => resolve({
      backends: ['ruby:rails'],
      features: [],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
      serviceCount: 4,
    }, manifest)).toThrow(/unknown backend.*ruby:rails/i);
  });

  it('throws on unknown feature', () => {
    expect(() => resolve({
      backends: ['java:spring'],
      features: ['unknown:feature'],
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
      serviceCount: 4,
    }, manifest)).toThrow(/unknown feature.*unknown:feature/i);
  });

  it('throws on unsupported stack', () => {
    expect(() => resolve({
      backends: ['java:spring'],
      features: [],
      stack: 'k8s',
      deploy: 'local',
      ddSite: 'datadoghq.com',
      serviceCount: 4,
    }, manifest)).toThrow(/k8s.*not supported/i);
  });
});
