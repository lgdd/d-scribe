import { describe, it, expect, beforeEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import YAML from 'yaml';

const CLI_ENTRY = path.resolve(import.meta.dirname, '../src/index.ts');

function run(args: string[], dest: string): string {
  return execFileSync('npx', ['tsx', CLI_ENTRY, ...args, '--dest', dest], {
    encoding: 'utf-8',
    cwd: path.resolve(import.meta.dirname, '..'),
    env: { ...process.env, DD_API_KEY: '', DD_APP_KEY: '', DD_SITE: '' },
  });
}

function initProject(dest: string, extraArgs: string[] = []): void {
  run(['init', 'demo', '--backend', 'java:spring', '--services', '2', ...extraArgs], dest);
}

describe('add feature (compose)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-scribe-add-'));
    initProject(tmpDir);
  });

  it('adds dbm:postgresql — copies deps, patches compose, updates manifest', () => {
    run(['add', 'feature', 'dbm:postgresql'], tmpDir);

    // Dep files copied
    expect(fs.existsSync(path.join(tmpDir, 'deps', 'postgresql', 'init.sql'))).toBe(true);

    // docker-compose patched
    const parsed = YAML.parse(fs.readFileSync(path.join(tmpDir, 'docker-compose.yml'), 'utf-8'));
    expect(parsed.services).toHaveProperty('postgresql');
    expect(parsed.volumes).toHaveProperty('postgres-data');

    // Manifest updated
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.d-scribe.json'), 'utf-8'));
    expect(manifest.features).toContain('dbm:postgresql');
  });

  it('adds apm:profiling — patches agent env vars, no deps', () => {
    run(['add', 'feature', 'apm:profiling'], tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, 'docker-compose.yml'), 'utf-8');
    expect(content).toContain('DD_PROFILING_ENABLED=true');

    // No new dep dirs
    expect(fs.existsSync(path.join(tmpDir, 'deps'))).toBe(false);

    // Manifest updated
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.d-scribe.json'), 'utf-8'));
    expect(manifest.features).toContain('apm:profiling');
  });

  it('adds security:code — patches agent env vars', () => {
    run(['add', 'feature', 'security:code'], tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, 'docker-compose.yml'), 'utf-8');
    expect(content).toContain('DD_IAST_ENABLED=true');
  });

  it('is idempotent — adding same feature twice does not error', () => {
    run(['add', 'feature', 'apm:profiling'], tmpDir);
    const output = run(['add', 'feature', 'apm:profiling'], tmpDir);

    expect(output).toContain('already');

    // Only listed once in manifest
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.d-scribe.json'), 'utf-8'));
    expect(manifest.features.filter((f: string) => f === 'apm:profiling')).toHaveLength(1);
  });

  it('errors on unknown feature', () => {
    expect(() => run(['add', 'feature', 'unknown:thing'], tmpDir)).toThrow();
  });
});

describe('add feature (no project)', () => {
  it('errors when .d-scribe.json is missing', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-scribe-add-empty-'));
    expect(() => run(['add', 'feature', 'apm:profiling'], tmpDir)).toThrow();
  });
});

describe('add feature (k8s)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-scribe-add-k8s-'));
    initProject(tmpDir, ['--deploy', 'k8s']);
  });

  it('adds dbm:postgresql — creates k8s dep manifests', () => {
    run(['add', 'feature', 'dbm:postgresql'], tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'k8s', 'deps', 'postgresql-deployment.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'k8s', 'deps', 'postgresql-service.yaml'))).toBe(true);

    // Dep files also copied
    expect(fs.existsSync(path.join(tmpDir, 'deps', 'postgresql', 'init.sql'))).toBe(true);
  });
});
