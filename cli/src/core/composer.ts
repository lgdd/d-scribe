// cli/src/core/composer.ts
import path from 'node:path';
import { renderToFile } from './renderer.js';
import type { ResolvedPlan } from './resolver.js';

export function composeDockerCompose(
  plan: ResolvedPlan,
  projectName: string,
  templatesDir: string,
  outputPath: string,
): void {
  const templatePath = path.join(templatesDir, 'docker-compose.yml.hbs');

  // Assign ports to services based on their name
  const portMap: Record<string, number> = {
    'api-gateway': 8080,
    'project-service': 8081,
    'task-service': 8082,
    'user-service': 8083,
  };

  const servicesWithPorts = plan.services.map(s => ({
    ...s,
    port: portMap[s.name] ?? 8080,
  }));

  const data = {
    projectName,
    services: servicesWithPorts,
    frontend: plan.frontend,
    features: plan.features,
    deps: plan.deps,
    envVars: plan.envVars,
    envVarEntries: Object.entries(plan.envVars),
    hasPostgresql: plan.deps.some(d => d.key === 'db:postgresql'),
    hasRedis: plan.deps.some(d => d.key === 'cache:redis'),
    hasKeycloak: plan.deps.some(d => d.key === 'auth:keycloak'),
    ddSite: plan.ddSite,
  };
  renderToFile(templatePath, data, outputPath);
}
