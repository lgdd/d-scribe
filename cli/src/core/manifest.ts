import fs from 'node:fs';
import path from 'node:path';

export interface FeatureEntry {
  label: string;
  requires_deps: string[];
  datadog_products: string[];
  agent_env?: Record<string, string>;
  agent_config?: string;
}

export interface BackendEntry {
  label: string;
  path: string;
}

export interface FrontendEntry {
  label: string;
  path: string;
}

export interface DepEntry {
  path: string;
}

export interface InfraConfig {
  stacks: string[];
  deploy: string[];
}

export interface Manifest {
  version: string;
  features: Record<string, FeatureEntry>;
  backends: Record<string, BackendEntry>;
  frontends: Record<string, FrontendEntry>;
  deps: Record<string, DepEntry>;
  infra: InfraConfig;
}

export function loadManifest(catalogPath: string): Manifest {
  const manifestPath = path.join(catalogPath, 'manifest.json');
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  return JSON.parse(raw) as Manifest;
}
