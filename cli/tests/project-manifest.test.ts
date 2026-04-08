import { describe, it, expect, beforeEach } from 'vitest';
import { readProjectManifest, writeProjectManifest } from '../src/core/project-manifest.js';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

describe('writeProjectManifest + readProjectManifest', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-scribe-pm-'));
  });

  it('round-trips a manifest through write and read', () => {
    const manifest = {
      backends: ['java:spring'],
      frontend: 'react:vite' as string | null,
      features: ['dbm:postgresql'],
      deploy: 'compose',
      services: 4,
    };

    writeProjectManifest(tmpDir, manifest);
    const result = readProjectManifest(tmpDir);

    expect(result).toEqual(manifest);
  });

  it('writes .d-scribe.json with readable formatting', () => {
    writeProjectManifest(tmpDir, {
      backends: ['java:spring'],
      frontend: null,
      features: [],
      deploy: 'compose',
      services: 2,
    });

    const raw = fs.readFileSync(path.join(tmpDir, '.d-scribe.json'), 'utf-8');
    expect(raw).toContain('\n'); // formatted, not single-line
  });

  it('handles null frontend', () => {
    const manifest = {
      backends: ['python:flask'],
      frontend: null,
      features: [],
      deploy: 'k8s',
      services: 3,
    };

    writeProjectManifest(tmpDir, manifest);
    const result = readProjectManifest(tmpDir);

    expect(result.frontend).toBeNull();
  });
});

describe('readProjectManifest errors', () => {
  it('throws when .d-scribe.json does not exist', () => {
    expect(() => readProjectManifest('/nonexistent-dir')).toThrow(/not a d-scribe project/i);
  });
});
