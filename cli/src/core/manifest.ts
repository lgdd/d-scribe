import fs from 'node:fs';
import path from 'node:path';

export type InstrumentationMode = 'datadog' | 'ddot' | 'otel';

export interface FeatureEntry {
  label: string;
  requires_deps: string[];
  datadog_products: string[];
  agent_env?: Record<string, string>;
  service_env?: Record<string, string>;
  agent_config?: string;
  supported_backends?: string[];
  supported_frontends?: string[];
  supported_instrumentation_modes?: InstrumentationMode[];
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

export interface DeployEntry {
  label: string;
  status?: string;
}

export interface InfraConfig {
  deploy: Record<string, DeployEntry>;
  defaults: Record<string, string>;
}

export interface OtelCollectorConfig {
  compose: { image: string; exporter: string };
  k8s: { helm_values: Record<string, boolean | string> };
}

export interface Instrumentation {
  modes: InstrumentationMode[];
  default: InstrumentationMode;
  otel_collector: OtelCollectorConfig;
}

export interface Manifest {
  version: string;
  instrumentation: Instrumentation;
  features: Record<string, FeatureEntry>;
  backends: Record<string, BackendEntry>;
  frontends: Record<string, FrontendEntry>;
  deps: Record<string, DepEntry>;
  infra: InfraConfig;
}

export function loadManifest(catalogPath: string): Manifest {
  const manifestPath = path.join(catalogPath, 'manifest.json');
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  const parsed = JSON.parse(raw) as Manifest;
  // Non-enumerable: catalog root path, used by resolver to look up backend module.json.
  Object.defineProperty(parsed, '__catalogRoot', { value: catalogPath, enumerable: false });
  return parsed;
}
