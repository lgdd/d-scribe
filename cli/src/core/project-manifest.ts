import path from 'node:path';
import fs from 'node:fs';

const FILENAME = '.d-scribe.json';

export interface ProjectManifest {
  backends: string[];
  frontend: string | null;
  features: string[];
  deploy: string;
  services: number;
}

export function readProjectManifest(projectDir: string): ProjectManifest {
  const filePath = path.join(projectDir, FILENAME);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Not a d-scribe project. Run "d-scribe init demo" first.`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function writeProjectManifest(projectDir: string, manifest: ProjectManifest): void {
  const filePath = path.join(projectDir, FILENAME);
  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
}
