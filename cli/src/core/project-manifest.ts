import path from 'node:path';
import fs from 'node:fs';
import type { InstrumentationMode } from './manifest.js';

const FILENAME = '.d-scribe.json';

export interface ProjectManifest {
  backends: string[];
  frontend: string | null;
  features: string[];
  deploy: string;
  services: number;
  instrumentation: InstrumentationMode;
}

export function readProjectManifest(projectDir: string): ProjectManifest {
  const filePath = path.join(projectDir, FILENAME);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Not a d-scribe project. Run "d-scribe init demo" first.`);
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Partial<ProjectManifest>;
  return {
    backends: parsed.backends ?? [],
    frontend: parsed.frontend ?? null,
    features: parsed.features ?? [],
    deploy: parsed.deploy ?? 'compose',
    services: parsed.services ?? 1,
    instrumentation: parsed.instrumentation ?? 'datadog',
  };
}

export function writeProjectManifest(projectDir: string, manifest: ProjectManifest): void {
  const filePath = path.join(projectDir, FILENAME);
  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
}
