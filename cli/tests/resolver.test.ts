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
      deploy: 'compose',
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
      deploy: 'compose',
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
      deploy: 'compose',
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
      deploy: 'compose',
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
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 4,
    }, manifest);

    expect(plan.frontend).toMatchObject({ key: 'react:vite', label: 'React (Vite)' });
  });

  it('resolves transitive deps from features', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: ['dbm:postgresql'],
      deploy: 'compose',
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
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 4,
    }, manifest);

    expect(plan.deps).toHaveLength(1);
    expect(plan.deps[0].key).toBe('db:postgresql');
  });

  it('collects agent_env from features', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: ['security:code', 'apm:profiling'],
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 4,
    }, manifest);

    expect(plan.envVars).toMatchObject({
      DD_IAST_ENABLED: 'true',
      DD_PROFILING_ENABLED: 'true',
    });
    expect(plan.envVars).not.toHaveProperty('DD_ASM_ENABLED');
  });

  it('includes backendPath with service-template for each service', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 2,
    }, manifest);

    expect(plan.services[0].backendPath).toBe('backends/java-spring');
    expect(plan.services[1].backendPath).toBe('backends/java-spring');
  });

  it('throws on unknown backend', () => {
    expect(() => resolve({
      backends: ['unknown:backend'],
      features: [],
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 4,
    }, manifest)).toThrow(/unknown backend.*unknown:backend/i);
  });

  it('throws on unknown feature', () => {
    expect(() => resolve({
      backends: ['java:spring'],
      features: ['unknown:feature'],
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 4,
    }, manifest)).toThrow(/unknown feature.*unknown:feature/i);
  });

  it('resolves deploy target into plan', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      deploy: 'k8s',
      ddSite: 'datadoghq.com',
      serviceCount: 2,
    }, manifest);

    expect(plan.deploy).toEqual({ stack: 'k8s', provider: 'local', service: 'minikube' });
  });

  it('resolves compose deploy target', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 2,
    }, manifest);

    expect(plan.deploy).toEqual({ stack: 'compose', provider: 'local', service: null });
  });

  it('resolves aws deploy target', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      deploy: 'k8s:aws:ec2',
      ddSite: 'datadoghq.com',
      serviceCount: 2,
    }, manifest);

    expect(plan.deploy).toEqual({ stack: 'k8s', provider: 'aws', service: 'ec2' });
  });

  it('infers db:postgresql for ai:llmobs when dbm:mongodb is not selected', () => {
    const plan = resolve({
      backends: ['python:flask'],
      features: ['ai:llmobs'],
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 2,
    }, manifest);

    expect(plan.deps.some(d => d.key === 'db:postgresql')).toBe(true);
    expect(plan.deps.some(d => d.key === 'db:mongodb')).toBe(false);
  });

  it('infers db:mongodb for ai:llmobs when dbm:mongodb is also selected', () => {
    const plan = resolve({
      backends: ['python:flask'],
      features: ['ai:llmobs', 'dbm:mongodb'],
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 2,
    }, manifest);

    expect(plan.deps.some(d => d.key === 'db:mongodb')).toBe(true);
  });

  it('resolves delivery:feature-flags and injects all three agent env vars', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: ['delivery:feature-flags'],
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 1,
    }, manifest);

    expect(plan.features[0].key).toBe('delivery:feature-flags');
    expect(plan.envVars).toMatchObject({
      DD_REMOTE_CONFIG_ENABLED: 'true',
      DD_EXPERIMENTAL_FLAGGING_PROVIDER_ENABLED: 'true',
      DD_METRICS_OTEL_ENABLED: 'true',
    });
    expect(plan.deps).toHaveLength(0);
  });
});
