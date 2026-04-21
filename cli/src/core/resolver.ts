import fs from 'node:fs';
import path from 'node:path';
import type { Manifest, InstrumentationMode } from './manifest.js';
import { parseDeploy, type DeployTarget } from './deploy.js';

export type { InstrumentationMode } from './manifest.js';

export interface ResolveOptions {
  backends: string[];
  frontend?: string;
  features: string[];
  deploy: string;
  ddSite: string;
  serviceCount: number;
  instrumentation: InstrumentationMode;
}

export interface ServiceAssignment {
  name: string;
  backend: string;
  backendPath: string;
  language: string;
  port: number;
}

export interface ResolvedFeature {
  key: string;
  label: string;
  datadog_products: string[];
}

export interface ResolvedDep {
  key: string;
  path: string;
}

export interface FrontendModule {
  key: string;
  label: string;
  path: string;
}

export interface ResolvedPlan {
  services: ServiceAssignment[];
  frontend: FrontendModule | null;
  features: ResolvedFeature[];
  deps: ResolvedDep[];
  envVars: Record<string, string>;
  serviceEnvVars: Record<string, string>;
  deploy: DeployTarget;
  ddSite: string;
  instrumentation: InstrumentationMode;
}

const BASE_PORT = 8080;

function backendModes(manifest: Manifest, backendKey: string): InstrumentationMode[] {
  const catalogRoot = manifest.__catalogRoot;
  if (!catalogRoot) {
    throw new Error('Internal error: catalog root not injected on manifest. Ensure loadManifest() was used.');
  }
  const modPath = path.join(catalogRoot, manifest.backends[backendKey].path, 'module.json');
  const raw = JSON.parse(fs.readFileSync(modPath, 'utf-8'));
  return (raw.supported_instrumentation_modes ?? ['datadog']) as InstrumentationMode[];
}

export function resolve(options: ResolveOptions, manifest: Manifest): ResolvedPlan {
  const deploy = parseDeploy(options.deploy);

  // Validate mode value
  if (!manifest.instrumentation.modes.includes(options.instrumentation)) {
    throw new Error(
      `Unknown instrumentation mode "${options.instrumentation}". Available: ${manifest.instrumentation.modes.join(', ')}.`,
    );
  }

  // Hard-fail: ddot on compose
  if (options.instrumentation === 'ddot' && deploy.stack === 'compose') {
    throw new Error('Instrumentation mode "ddot" requires k8s deploy. Use "otel" for compose or switch deploy target.');
  }

  // Validate backends exist
  for (const b of options.backends) {
    if (!manifest.backends[b]) {
      throw new Error(`Unknown backend "${b}". Available: ${Object.keys(manifest.backends).join(', ')}.`);
    }
  }

  // Validate frontend
  let frontend: FrontendModule | null = null;
  if (options.frontend) {
    const fe = manifest.frontends[options.frontend];
    if (!fe) {
      throw new Error(`Unknown frontend "${options.frontend}". Available: ${Object.keys(manifest.frontends).join(', ')}.`);
    }
    frontend = { key: options.frontend, label: fe.label, path: fe.path };
  }

  // Validate features exist
  for (const f of options.features) {
    if (!manifest.features[f]) {
      throw new Error(`Unknown feature "${f}". Available: ${Object.keys(manifest.features).join(', ')}.`);
    }
  }

  // Compat: accumulate offenders
  const badBackends: string[] = [];
  const badFeatures: string[] = [];

  for (const b of options.backends) {
    const modes = backendModes(manifest, b);
    if (!modes.includes(options.instrumentation)) {
      badBackends.push(`${b} (supports: ${modes.join(', ')})`);
    }
  }

  for (const f of options.features) {
    const modes = (manifest.features[f].supported_instrumentation_modes ?? ['datadog']) as InstrumentationMode[];
    if (!modes.includes(options.instrumentation)) {
      badFeatures.push(`${f} (supports: ${modes.join(', ')})`);
    }
  }

  // Agent-required check: otel + compose + feature with agent_config → hard fail
  const agentRequired: string[] = [];
  if (options.instrumentation === 'otel' && deploy.stack === 'compose') {
    const badFeatureKeys = new Set(badFeatures.map(s => s.split(' ')[0]));
    for (const f of options.features) {
      if (!badFeatureKeys.has(f) && manifest.features[f].agent_config) {
        agentRequired.push(f);
      }
    }
  }

  if (badBackends.length || badFeatures.length || agentRequired.length) {
    const parts: string[] = [];
    if (badBackends.length) {
      parts.push(`Backends that do not support "${options.instrumentation}" mode:\n  - ${badBackends.join('\n  - ')}`);
    }
    if (badFeatures.length) {
      parts.push(`Features not available in "${options.instrumentation}" mode:\n  - ${badFeatures.join('\n  - ')}`);
    }
    if (agentRequired.length) {
      parts.push(`Features requiring the Datadog Agent (unavailable on compose+otel):\n  - ${agentRequired.join('\n  - ')}`);
    }
    throw new Error(
      `Instrumentation compatibility errors:\n\n${parts.join('\n\n')}\n\nDrop the offending items or switch instrumentation mode.`,
    );
  }

  // Build services, deps, env vars
  const count = options.serviceCount;
  const services: ServiceAssignment[] = [];
  for (let i = 0; i < count; i++) {
    const backend = options.backends[i % options.backends.length];
    services.push({
      name: `service-${i + 1}`,
      backend,
      backendPath: manifest.backends[backend].path,
      language: backend.split(':')[0],
      port: BASE_PORT + i,
    });
  }

  const features: ResolvedFeature[] = options.features.map(key => {
    const entry = manifest.features[key];
    return { key, label: entry.label, datadog_products: entry.datadog_products };
  });

  const depKeys = new Set<string>();
  for (const f of options.features) {
    for (const d of manifest.features[f].requires_deps) depKeys.add(d);
  }
  if (options.features.includes('ai:llmobs')) {
    if (options.features.includes('dbm:mongodb')) depKeys.add('db:mongodb');
    else depKeys.add('db:postgresql');
  }
  const deps: ResolvedDep[] = [...depKeys].map(key => ({ key, path: manifest.deps[key].path }));

  const envVars: Record<string, string> = {};
  for (const f of options.features) {
    const entry = manifest.features[f];
    if (entry.agent_env) Object.assign(envVars, entry.agent_env);
  }

  const serviceEnvVars: Record<string, string> = {};
  for (const f of options.features) {
    const entry = manifest.features[f];
    if (entry.service_env) Object.assign(serviceEnvVars, entry.service_env);
  }

  return {
    services,
    frontend,
    features,
    deps,
    envVars,
    serviceEnvVars,
    deploy,
    ddSite: options.ddSite,
    instrumentation: options.instrumentation,
  };
}
