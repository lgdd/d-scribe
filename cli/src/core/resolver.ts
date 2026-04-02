import type { Manifest } from './manifest.js';

export interface ResolveOptions {
  backends: string[];
  frontend?: string;
  features: string[];
  stack: string;
  deploy: string;
  ddSite: string;
  serviceCount: number;
}

export interface ServiceAssignment {
  name: string;
  backend: string;
  backendPath: string;
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
  stack: 'compose';
  deploy: 'local';
  ddSite: string;
}

const BASE_PORT = 8080;

export function resolve(options: ResolveOptions, manifest: Manifest): ResolvedPlan {
  // Validate stack
  if (options.stack !== 'compose') {
    throw new Error(`Stack "${options.stack}" is not supported in Phase 1. Available: compose`);
  }
  if (options.deploy !== 'local') {
    throw new Error(`Deploy target "${options.deploy}" is not supported in Phase 1. Available: local`);
  }

  // Validate backends
  for (const b of options.backends) {
    if (!manifest.backends[b]) {
      const available = Object.keys(manifest.backends).join(', ');
      throw new Error(`Unknown backend "${b}". Available: ${available}`);
    }
  }

  // Validate frontend
  let frontend: FrontendModule | null = null;
  if (options.frontend) {
    const fe = manifest.frontends[options.frontend];
    if (!fe) {
      const available = Object.keys(manifest.frontends).join(', ');
      throw new Error(`Unknown frontend "${options.frontend}". Available: ${available}`);
    }
    frontend = { key: options.frontend, label: fe.label, path: fe.path };
  }

  // Validate features
  for (const f of options.features) {
    if (!manifest.features[f]) {
      const available = Object.keys(manifest.features).join(', ');
      throw new Error(`Unknown feature "${f}". Available: ${available}`);
    }
  }

  // Generate N services with generic names and round-robin backend assignment
  const count = options.serviceCount;
  const services: ServiceAssignment[] = [];
  for (let i = 0; i < count; i++) {
    const backend = options.backends[i % options.backends.length];
    services.push({
      name: `service-${i + 1}`,
      backend,
      backendPath: manifest.backends[backend].path,
      port: BASE_PORT + i,
    });
  }

  // Resolve features
  const features: ResolvedFeature[] = options.features.map(key => {
    const entry = manifest.features[key];
    return { key, label: entry.label, datadog_products: entry.datadog_products };
  });

  // Collect deps: transitive from features
  const depKeys = new Set<string>();
  for (const f of options.features) {
    for (const d of manifest.features[f].requires_deps) {
      depKeys.add(d);
    }
  }

  const deps: ResolvedDep[] = [...depKeys].map(key => {
    const entry = manifest.deps[key];
    return { key, path: entry.path };
  });

  // Collect agent_env from features
  const envVars: Record<string, string> = {};
  for (const f of options.features) {
    const entry = manifest.features[f];
    if (entry.agent_env) {
      Object.assign(envVars, entry.agent_env);
    }
  }

  return {
    services,
    frontend,
    features,
    deps,
    envVars,
    stack: 'compose',
    deploy: 'local',
    ddSite: options.ddSite,
  };
}
