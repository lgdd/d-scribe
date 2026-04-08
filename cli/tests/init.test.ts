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

describe('init demo (compose)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-scribe-init-'));
  });

  it('scaffolds a minimal project with correct directory structure', () => {
    run(['init', 'demo', '--backend', 'java:spring', '--services', '2'], tmpDir);

    // Service directories
    expect(fs.existsSync(path.join(tmpDir, 'services', 'service-1'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'services', 'service-2'))).toBe(true);

    // Traffic
    expect(fs.existsSync(path.join(tmpDir, 'traffic', 'locustfile.py'))).toBe(true);

    // Patterns copied to references
    expect(fs.existsSync(path.join(tmpDir, 'references', 'patterns', 'java-spring', 'index.md'))).toBe(true);

    // Generated config files
    expect(fs.existsSync(path.join(tmpDir, 'docker-compose.yml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'README.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.env'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.env.example'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.gitignore'))).toBe(true);

    // Skills copied
    expect(fs.existsSync(path.join(tmpDir, 'skills', 'dd-scaffold-demo', 'SKILL.md'))).toBe(true);
  });

  it('generates valid docker-compose YAML with expected services', () => {
    run(['init', 'demo', '--backend', 'java:spring', '--services', '3'], tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, 'docker-compose.yml'), 'utf-8');
    const parsed = YAML.parse(content);

    expect(parsed.services).toHaveProperty('datadog-agent');
    expect(parsed.services).toHaveProperty('service-1');
    expect(parsed.services).toHaveProperty('service-2');
    expect(parsed.services).toHaveProperty('service-3');
    expect(parsed.services).toHaveProperty('traffic');
  });

  it('copies service-template files into each service directory', () => {
    run(['init', 'demo', '--backend', 'java:spring', '--services', '2'], tmpDir);

    // java-spring service-template contains pom.xml and Dockerfile
    expect(fs.existsSync(path.join(tmpDir, 'services', 'service-1', 'Dockerfile'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'services', 'service-1', 'pom.xml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'services', 'service-2', 'Dockerfile'))).toBe(true);
  });

  it('includes frontend when --frontend is specified', () => {
    run(['init', 'demo', '--backend', 'java:spring', '--frontend', 'react:vite', '--services', '2'], tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'frontend', 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'frontend', 'Dockerfile'))).toBe(true);

    // Frontend patterns copied
    expect(fs.existsSync(path.join(tmpDir, 'references', 'patterns', 'react-vite', 'index.md'))).toBe(true);

    // docker-compose includes frontend service
    const parsed = YAML.parse(fs.readFileSync(path.join(tmpDir, 'docker-compose.yml'), 'utf-8'));
    expect(parsed.services).toHaveProperty('frontend');
  });

  it('includes dep files when features require them', () => {
    run(['init', 'demo', '--backend', 'java:spring', '--features', 'dbm:postgresql', '--services', '2'], tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'deps', 'postgresql', 'init.sql'))).toBe(true);
  });

  it('scaffolds polyglot services with round-robin backends', () => {
    run(['init', 'demo', '--backend', 'java:spring,python:flask', '--services', '4'], tmpDir);

    // java-spring services have pom.xml
    expect(fs.existsSync(path.join(tmpDir, 'services', 'service-1', 'pom.xml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'services', 'service-3', 'pom.xml'))).toBe(true);

    // python-flask services have requirements.txt
    expect(fs.existsSync(path.join(tmpDir, 'services', 'service-2', 'requirements.txt'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'services', 'service-4', 'requirements.txt'))).toBe(true);

    // Patterns for both backends
    expect(fs.existsSync(path.join(tmpDir, 'references', 'patterns', 'java-spring', 'index.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'references', 'patterns', 'python-flask', 'index.md'))).toBe(true);
  });

  it('writes .env with empty DD keys when host env is unset', () => {
    run(['init', 'demo', '--backend', 'java:spring', '--services', '2'], tmpDir);

    const env = fs.readFileSync(path.join(tmpDir, '.env'), 'utf-8');
    expect(env).toContain('DD_API_KEY=');
    expect(env).toContain('DD_SITE=');
  });

  it('writes .d-scribe.json project manifest', () => {
    run(['init', 'demo', '--backend', 'java:spring', '--frontend', 'react:vite', '--features', 'profiling', '--services', '3'], tmpDir);

    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.d-scribe.json'), 'utf-8'));
    expect(manifest).toEqual({
      backends: ['java:spring'],
      frontend: 'react:vite',
      features: ['profiling'],
      deploy: 'compose',
      services: 3,
    });
  });
});

describe('init demo (k8s)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-scribe-init-k8s-'));
  });

  it('generates k8s manifests and build-only docker-compose', () => {
    run(['init', 'demo', '--backend', 'java:spring', '--services', '2', '--deploy', 'k8s'], tmpDir);

    // K8s manifests
    expect(fs.existsSync(path.join(tmpDir, 'k8s', 'namespace.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'k8s', 'services', 'service-1-deployment.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'k8s', 'services', 'service-1-service.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'k8s', 'ingress.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'k8s', 'datadog', 'values.yaml'))).toBe(true);

    // Build-only docker-compose for image building
    expect(fs.existsSync(path.join(tmpDir, 'docker-compose.yml'))).toBe(true);
    const compose = fs.readFileSync(path.join(tmpDir, 'docker-compose.yml'), 'utf-8');
    expect(compose).toContain('service-1');
  });
});

describe('init demo (aws)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-scribe-init-aws-'));
  });

  it('generates terraform files for compose:aws target', () => {
    run(['init', 'demo', '--backend', 'java:spring', '--services', '2', '--deploy', 'compose:aws'], tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'terraform', 'main.tf'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'terraform', 'variables.tf'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'terraform', 'outputs.tf'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'terraform', 'deploy.sh'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'terraform', '.gitignore'))).toBe(true);

    // deploy.sh should be executable
    const stat = fs.statSync(path.join(tmpDir, 'terraform', 'deploy.sh'));
    expect(stat.mode & 0o111).toBeGreaterThan(0);

    // .gitignore should include terraform entries
    const gitignore = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf-8');
    expect(gitignore).toContain('terraform/.terraform/');
  });
});
