import { describe, it, expect, beforeEach } from 'vitest';
import { composeDockerCompose, composeK8s } from '../src/core/composer.js';
import { resolve } from '../src/core/resolver.js';
import { parseDeploy } from '../src/core/deploy.js';
import { loadManifest } from '../src/core/manifest.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.resolve(__dirname, '../../catalog');
const TEMPLATES_DIR = path.resolve(__dirname, '../src/templates');
const manifest = loadManifest(CATALOG_PATH);

describe('composeDockerCompose', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-scribe-test-'));
  });

  it('generates valid YAML with N services + agent + traffic', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 3,
      instrumentation: 'datadog',
    }, manifest);

    const outPath = path.join(tmpDir, 'docker-compose.yml');
    composeDockerCompose(plan, 'test-demo', TEMPLATES_DIR, outPath);

    const content = fs.readFileSync(outPath, 'utf-8');
    const parsed = YAML.parse(content);

    expect(parsed.services).toHaveProperty('datadog-agent');
    expect(parsed.services).toHaveProperty('service-1');
    expect(parsed.services).toHaveProperty('service-2');
    expect(parsed.services).toHaveProperty('service-3');
    expect(parsed.services).toHaveProperty('traffic');
    expect(parsed.services).not.toHaveProperty('frontend');
  });

  it('includes frontend when specified', () => {
    const plan = resolve({
      backends: ['java:spring'],
      frontend: 'react:vite',
      features: [],
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 3,
      instrumentation: 'datadog',
    }, manifest);

    const outPath = path.join(tmpDir, 'docker-compose.yml');
    composeDockerCompose(plan, 'test-demo', TEMPLATES_DIR, outPath);

    const content = fs.readFileSync(outPath, 'utf-8');
    const parsed = YAML.parse(content);
    expect(parsed.services).toHaveProperty('frontend');
  });

  it('includes PostgreSQL when dbm:postgresql feature is enabled', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: ['dbm:postgresql'],
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 3,
      instrumentation: 'datadog',
    }, manifest);

    const outPath = path.join(tmpDir, 'docker-compose.yml');
    composeDockerCompose(plan, 'test-demo', TEMPLATES_DIR, outPath);

    const content = fs.readFileSync(outPath, 'utf-8');
    const parsed = YAML.parse(content);
    expect(parsed.services).toHaveProperty('postgresql');
  });

  it('sets agent_env on datadog-agent when features have env vars', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: ['security:code'],
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 3,
      instrumentation: 'datadog',
    }, manifest);

    const outPath = path.join(tmpDir, 'docker-compose.yml');
    composeDockerCompose(plan, 'test-demo', TEMPLATES_DIR, outPath);

    const content = fs.readFileSync(outPath, 'utf-8');
    expect(content).toContain('DD_IAST_ENABLED');
  });

  it('assigns correct ports to services', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      deploy: 'compose',
      ddSite: 'datadoghq.com',
      serviceCount: 3,
      instrumentation: 'datadog',
    }, manifest);

    const outPath = path.join(tmpDir, 'docker-compose.yml');
    composeDockerCompose(plan, 'test-demo', TEMPLATES_DIR, outPath);

    const content = fs.readFileSync(outPath, 'utf-8');
    const parsed = YAML.parse(content);

    // First service gets exposed port
    expect(parsed.services['service-1'].ports).toContain('8080:8080');
  });
});

describe('composeK8s', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-scribe-test-'));
  });

  it('generates namespace.yaml with project namespace', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      deploy: 'k8s',
      ddSite: 'datadoghq.com',
      serviceCount: 2,
      instrumentation: 'datadog',
    }, manifest);

    const k8sDir = path.join(tmpDir, 'k8s');
    composeK8s(plan, 'test-demo', 'test-demo', 'test-demo-260407', TEMPLATES_DIR, k8sDir);

    const ns = fs.readFileSync(path.join(k8sDir, 'namespace.yaml'), 'utf-8');
    expect(ns).toContain('name: test-demo');
  });

  it('generates deployment and service per service', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      deploy: 'k8s',
      ddSite: 'datadoghq.com',
      serviceCount: 2,
      instrumentation: 'datadog',
    }, manifest);

    const k8sDir = path.join(tmpDir, 'k8s');
    composeK8s(plan, 'test-demo', 'test-demo', 'test-demo-260407', TEMPLATES_DIR, k8sDir);

    expect(fs.existsSync(path.join(k8sDir, 'services', 'service-1-deployment.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(k8sDir, 'services', 'service-1-service.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(k8sDir, 'services', 'service-2-deployment.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(k8sDir, 'services', 'service-2-service.yaml'))).toBe(true);
  });

  it('generates datadog Helm values', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      deploy: 'k8s',
      ddSite: 'datadoghq.com',
      serviceCount: 2,
      instrumentation: 'datadog',
    }, manifest);

    const k8sDir = path.join(tmpDir, 'k8s');
    composeK8s(plan, 'test-demo', 'test-demo', 'test-demo-260407', TEMPLATES_DIR, k8sDir);

    const values = fs.readFileSync(path.join(k8sDir, 'datadog', 'values.yaml'), 'utf-8');
    expect(values).toContain('apiKeyExistingSecret: datadog-secret');
    expect(values).toContain('datadoghq.com');
  });

  it('generates ingress.yaml', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: [],
      deploy: 'k8s',
      ddSite: 'datadoghq.com',
      serviceCount: 2,
      instrumentation: 'datadog',
    }, manifest);

    const k8sDir = path.join(tmpDir, 'k8s');
    composeK8s(plan, 'test-demo', 'test-demo', 'test-demo-260407', TEMPLATES_DIR, k8sDir);

    expect(fs.existsSync(path.join(k8sDir, 'ingress.yaml'))).toBe(true);
    const ingress = fs.readFileSync(path.join(k8sDir, 'ingress.yaml'), 'utf-8');
    expect(ingress).toContain('service-1');
  });

  it('generates dep manifests for postgresql', () => {
    const plan = resolve({
      backends: ['java:spring'],
      features: ['dbm:postgresql'],
      deploy: 'k8s',
      ddSite: 'datadoghq.com',
      serviceCount: 2,
      instrumentation: 'datadog',
    }, manifest);

    const k8sDir = path.join(tmpDir, 'k8s');
    composeK8s(plan, 'test-demo', 'test-demo', 'test-demo-260407', TEMPLATES_DIR, k8sDir);

    expect(fs.existsSync(path.join(k8sDir, 'deps', 'postgresql-deployment.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(k8sDir, 'deps', 'postgresql-service.yaml'))).toBe(true);
  });
});

describe('composeDockerCompose — otel mode', () => {
  it('emits otel-collector service and drops datadog-agent', () => {
    const out = path.join(os.tmpdir(), `d-scribe-compose-otel-${Date.now()}.yml`);
    composeDockerCompose(
      {
        services: [{ name: 'service-1', backend: 'node:express', backendPath: 'backends/node-express', language: 'node', port: 8080 }],
        frontend: null,
        features: [],
        deps: [],
        envVars: {},
        serviceEnvVars: {},
        deploy: parseDeploy('compose'),
        ddSite: 'datadoghq.com',
        instrumentation: 'otel',
      },
      'test-proj',
      path.resolve(import.meta.dirname, '../src/templates'),
      out,
    );
    const content = fs.readFileSync(out, 'utf-8');
    expect(content).toContain('otel-collector:');
    expect(content).not.toContain('datadog-agent:');
    expect(content).toContain('OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318');
    fs.rmSync(out);
  });
});
