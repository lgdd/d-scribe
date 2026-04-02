import { describe, it, expect, beforeEach } from 'vitest';
import { composeDockerCompose } from '../src/core/composer.js';
import { resolve } from '../src/core/resolver.js';
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
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
      serviceCount: 3,
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
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
      serviceCount: 3,
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
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
      serviceCount: 3,
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
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
      serviceCount: 3,
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
      stack: 'compose',
      deploy: 'local',
      ddSite: 'datadoghq.com',
      serviceCount: 3,
    }, manifest);

    const outPath = path.join(tmpDir, 'docker-compose.yml');
    composeDockerCompose(plan, 'test-demo', TEMPLATES_DIR, outPath);

    const content = fs.readFileSync(outPath, 'utf-8');
    const parsed = YAML.parse(content);

    // First service gets exposed port
    expect(parsed.services['service-1'].ports).toContain('8080:8080');
  });
});
