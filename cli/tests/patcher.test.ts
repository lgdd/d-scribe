import { describe, it, expect, beforeEach } from 'vitest';
import { patchComposeAddService, patchComposeAddAgentEnv, getDepSpec, patchK8sForDep } from '../src/core/patcher.js';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import YAML from 'yaml';

// Minimal fixture that mirrors what init generates
const BASE_COMPOSE = `networks:
  dd-demo:
    driver: bridge

volumes:
  dd-agent-data:

services:
  datadog-agent:
    image: gcr.io/datadoghq/agent:7
    container_name: test-demo-datadog-agent
    environment:
      - DD_API_KEY=\${DD_API_KEY}
      - DD_SITE=datadoghq.com
      - DD_APM_ENABLED=true
    networks:
      - dd-demo

  service-1:
    build: ./services/service-1
    container_name: test-demo-service-1
    networks:
      - dd-demo

  traffic:
    build: ./traffic
    container_name: test-demo-traffic
    networks:
      - dd-demo
`;

describe('patchComposeAddService', () => {
  let tmpDir: string;
  let composePath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-scribe-patcher-'));
    composePath = path.join(tmpDir, 'docker-compose.yml');
    fs.writeFileSync(composePath, BASE_COMPOSE, 'utf-8');
  });

  it('adds postgresql service and volume', () => {
    const spec = getDepSpec('db:postgresql')!;
    patchComposeAddService(composePath, spec, 'test-demo');

    const parsed = YAML.parse(fs.readFileSync(composePath, 'utf-8'));
    expect(parsed.services).toHaveProperty('postgresql');
    expect(parsed.services.postgresql.image).toBe('postgres:16');
    expect(parsed.volumes).toHaveProperty('postgres-data');
  });

  it('adds redis service and volume', () => {
    const spec = getDepSpec('cache:redis')!;
    patchComposeAddService(composePath, spec, 'test-demo');

    const parsed = YAML.parse(fs.readFileSync(composePath, 'utf-8'));
    expect(parsed.services).toHaveProperty('redis');
    expect(parsed.services.redis.image).toBe('redis:7-alpine');
    expect(parsed.volumes).toHaveProperty('redis-data');
  });

  it('adds keycloak service', () => {
    const spec = getDepSpec('auth:keycloak')!;
    patchComposeAddService(composePath, spec, 'test-demo');

    const parsed = YAML.parse(fs.readFileSync(composePath, 'utf-8'));
    expect(parsed.services).toHaveProperty('keycloak');
    expect(parsed.services.keycloak.image).toBe('quay.io/keycloak/keycloak:latest');
    expect(parsed.services.keycloak.command).toContain('start-dev');
  });

  it('is idempotent — adding same service twice does not duplicate', () => {
    const spec = getDepSpec('db:postgresql')!;
    patchComposeAddService(composePath, spec, 'test-demo');
    patchComposeAddService(composePath, spec, 'test-demo');

    const parsed = YAML.parse(fs.readFileSync(composePath, 'utf-8'));
    // Only one postgresql service key
    expect(Object.keys(parsed.services).filter(k => k === 'postgresql')).toHaveLength(1);
  });

  it('preserves existing services', () => {
    const spec = getDepSpec('db:postgresql')!;
    patchComposeAddService(composePath, spec, 'test-demo');

    const parsed = YAML.parse(fs.readFileSync(composePath, 'utf-8'));
    expect(parsed.services).toHaveProperty('datadog-agent');
    expect(parsed.services).toHaveProperty('service-1');
    expect(parsed.services).toHaveProperty('traffic');
  });
});

describe('patchComposeAddAgentEnv', () => {
  let tmpDir: string;
  let composePath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-scribe-patcher-'));
    composePath = path.join(tmpDir, 'docker-compose.yml');
    fs.writeFileSync(composePath, BASE_COMPOSE, 'utf-8');
  });

  it('appends env vars to datadog-agent environment', () => {
    patchComposeAddAgentEnv(composePath, { DD_IAST_ENABLED: 'true', DD_ASM_ENABLED: 'true' });

    const content = fs.readFileSync(composePath, 'utf-8');
    expect(content).toContain('DD_IAST_ENABLED=true');
    expect(content).toContain('DD_ASM_ENABLED=true');
  });

  it('does not duplicate existing env vars', () => {
    patchComposeAddAgentEnv(composePath, { DD_APM_ENABLED: 'true' });

    const content = fs.readFileSync(composePath, 'utf-8');
    const matches = content.match(/DD_APM_ENABLED/g);
    expect(matches!.length).toBe(1);
  });

  it('is idempotent — adding same vars twice does not duplicate', () => {
    patchComposeAddAgentEnv(composePath, { DD_PROFILING_ENABLED: 'true' });
    patchComposeAddAgentEnv(composePath, { DD_PROFILING_ENABLED: 'true' });

    const content = fs.readFileSync(composePath, 'utf-8');
    const matches = content.match(/DD_PROFILING_ENABLED/g);
    expect(matches!.length).toBe(1);
  });
});

describe('getDepSpec', () => {
  it('returns spec for known dep key', () => {
    const spec = getDepSpec('db:postgresql');
    expect(spec).toBeDefined();
    expect(spec!.serviceName).toBe('postgresql');
  });

  it('returns undefined for unknown dep key', () => {
    expect(getDepSpec('unknown:dep')).toBeUndefined();
  });
});

describe('patchK8sForDep', () => {
  let tmpDir: string;
  let k8sDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-scribe-patcher-k8s-'));
    k8sDir = path.join(tmpDir, 'k8s');
    fs.mkdirSync(k8sDir, { recursive: true });
  });

  it('renders deployment and service YAMLs for postgresql', () => {
    const spec = getDepSpec('db:postgresql')!;
    const tplDir = path.resolve(import.meta.dirname, '../src/templates');
    patchK8sForDep(k8sDir, spec, 'test-demo', 'test-demo-260408', tplDir);

    expect(fs.existsSync(path.join(k8sDir, 'deps', 'postgresql-deployment.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(k8sDir, 'deps', 'postgresql-service.yaml'))).toBe(true);

    const deployment = fs.readFileSync(path.join(k8sDir, 'deps', 'postgresql-deployment.yaml'), 'utf-8');
    expect(deployment).toContain('postgres:16');
  });
});
