import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const CLI_ENTRY = path.resolve(import.meta.dirname, '../src/index.ts');
const CLI_CWD = path.resolve(import.meta.dirname, '..');

function run(args: string[]): string {
  return execFileSync('npx', ['tsx', CLI_ENTRY, ...args], {
    encoding: 'utf-8',
    cwd: CLI_CWD,
    env: { ...process.env, DD_API_KEY: '', DD_APP_KEY: '', DD_SITE: '' },
  });
}

describe('list modes', () => {
  it('prints the three instrumentation modes', () => {
    const out = run(['list', 'modes']);
    expect(out).toContain('datadog');
    expect(out).toContain('ddot');
    expect(out).toContain('otel');
    expect(out).toMatch(/k8s only/i);
  });
});

describe('list features — Modes column', () => {
  it('includes supported_instrumentation_modes per feature', () => {
    const out = run(['list', 'features']);
    const line = out.split('\n').find(l => l.includes('ai:llmobs'));
    expect(line).toBeDefined();
    expect(line!).toContain('otel');
    const dbmLine = out.split('\n').find(l => l.includes('dbm:postgresql'));
    expect(dbmLine).toBeDefined();
    expect(dbmLine!).not.toContain('otel');
  });
});

describe('list backends — Modes column', () => {
  it('shows tier-1 backends as otel-supporting', () => {
    const out = run(['list', 'backends']);
    const nodeLine = out.split('\n').find(l => l.includes('node:express'));
    expect(nodeLine!).toContain('otel');
    const goLine = out.split('\n').find(l => l.includes('go:gin'));
    expect(goLine!).not.toContain('otel');
  });
});
