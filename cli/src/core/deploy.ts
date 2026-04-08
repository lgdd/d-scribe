export interface DeployTarget {
  stack: 'compose' | 'k8s';
  provider: 'local' | 'aws';
  service: string | null;
}

const VALID_STACKS = ['compose', 'k8s'] as const;
const VALID_PROVIDERS = ['local', 'aws'] as const;

const DEFAULTS: Record<string, string> = {
  'compose': 'compose:local',
  'compose:local': 'compose:local',
  'compose:aws': 'compose:aws:ec2',
  'k8s': 'k8s:local:minikube',
  'k8s:local': 'k8s:local:minikube',
  'k8s:aws': 'k8s:aws:ec2',
};

const VALID_SERVICES: Record<string, string[]> = {
  'compose:local': [],
  'compose:aws': ['ec2'],
  'k8s:local': ['minikube'],
  'k8s:aws': ['ec2', 'eks'],
};

const FUTURE_TARGETS = new Set(['k8s:aws:eks']);

export function parseDeploy(input: string): DeployTarget {
  // Apply defaults for shorthand input
  const resolved = DEFAULTS[input] ?? input;
  const parts = resolved.split(':');

  const stack = parts[0];
  if (!VALID_STACKS.includes(stack as typeof VALID_STACKS[number])) {
    throw new Error(`Unknown stack "${stack}". Available: ${VALID_STACKS.join(', ')}`);
  }

  const provider = parts[1];
  if (!provider || !VALID_PROVIDERS.includes(provider as typeof VALID_PROVIDERS[number])) {
    throw new Error(`Unknown provider "${provider}". Available: ${VALID_PROVIDERS.join(', ')}`);
  }

  const stackProvider = `${stack}:${provider}`;
  const validServices = VALID_SERVICES[stackProvider];
  if (!validServices) {
    throw new Error(`Invalid combination "${stackProvider}"`);
  }

  const service = parts[2] ?? null;

  // Check for service on combos that don't take one
  if (service && validServices.length === 0) {
    throw new Error(`Invalid combination: "${stack}" with service "${service}" on "${provider}"`);
  }

  // Validate service if provided
  if (service && !validServices.includes(service)) {
    throw new Error(`Invalid combination: "${stack}" with service "${service}" on "${provider}". Available: ${validServices.join(', ')}`);
  }

  // Check for future targets
  const fullKey = service ? `${stackProvider}:${service}` : stackProvider;
  if (FUTURE_TARGETS.has(fullKey)) {
    throw new Error(`"${fullKey}" is not yet supported. Coming in a future release.`);
  }

  return {
    stack: stack as DeployTarget['stack'],
    provider: provider as DeployTarget['provider'],
    service: service ?? (validServices.length === 0 ? null : validServices[0]),
  };
}
