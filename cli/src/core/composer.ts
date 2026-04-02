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

  const data = {
    projectName,
    services: plan.services,
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
