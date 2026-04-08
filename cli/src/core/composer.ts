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

export function composeK8s(
  plan: ResolvedPlan,
  projectName: string,
  namespace: string,
  ddEnv: string,
  templatesDir: string,
  outputDir: string,
): void {
  const k8sDir = path.join(templatesDir, 'k8s');

  const baseData = {
    projectName,
    namespace,
    ddEnv,
    ddSite: plan.ddSite,
    envVars: plan.envVars,
    envVarEntries: Object.entries(plan.envVars),
    hasProfiler: plan.features.some(f => f.key === 'profiling'),
    hasDbm: plan.features.some(f => f.key === 'dbm:postgresql'),
    hasNetworkMonitoring: false,
  };

  // Namespace
  renderToFile(
    path.join(k8sDir, 'namespace.yaml.hbs'),
    { ...baseData },
    path.join(outputDir, 'namespace.yaml'),
  );

  // Service deployments and services
  for (const svc of plan.services) {
    const svcData = {
      ...baseData,
      name: svc.name,
      image: `${projectName}/${svc.name}:latest`,
      port: svc.port,
    };
    renderToFile(
      path.join(k8sDir, 'deployment.yaml.hbs'),
      svcData,
      path.join(outputDir, 'services', `${svc.name}-deployment.yaml`),
    );
    renderToFile(
      path.join(k8sDir, 'service.yaml.hbs'),
      svcData,
      path.join(outputDir, 'services', `${svc.name}-service.yaml`),
    );
  }

  // Frontend
  if (plan.frontend) {
    const feData = {
      ...baseData,
      name: 'frontend',
      image: `${projectName}/frontend:latest`,
      port: 80,
    };
    renderToFile(
      path.join(k8sDir, 'deployment.yaml.hbs'),
      feData,
      path.join(outputDir, 'frontend', 'frontend-deployment.yaml'),
    );
    renderToFile(
      path.join(k8sDir, 'service.yaml.hbs'),
      feData,
      path.join(outputDir, 'frontend', 'frontend-service.yaml'),
    );
  }

  // Deps
  const hasPostgresql = plan.deps.some(d => d.key === 'db:postgresql');
  const hasRedis = plan.deps.some(d => d.key === 'cache:redis');

  if (hasPostgresql) {
    const pgData = { ...baseData, name: 'postgresql', image: 'postgres:16', port: 5432 };
    renderToFile(path.join(k8sDir, 'deployment.yaml.hbs'), pgData, path.join(outputDir, 'deps', 'postgresql-deployment.yaml'));
    renderToFile(path.join(k8sDir, 'service.yaml.hbs'), pgData, path.join(outputDir, 'deps', 'postgresql-service.yaml'));
  }

  if (hasRedis) {
    const redisData = { ...baseData, name: 'redis', image: 'redis:7-alpine', port: 6379 };
    renderToFile(path.join(k8sDir, 'deployment.yaml.hbs'), redisData, path.join(outputDir, 'deps', 'redis-deployment.yaml'));
    renderToFile(path.join(k8sDir, 'service.yaml.hbs'), redisData, path.join(outputDir, 'deps', 'redis-service.yaml'));
  }

  // Traffic
  const trafficData = { ...baseData, name: 'traffic', image: `${projectName}/traffic:latest`, port: 8089 };
  renderToFile(path.join(k8sDir, 'deployment.yaml.hbs'), trafficData, path.join(outputDir, 'traffic', 'traffic-deployment.yaml'));

  // Ingress
  renderToFile(
    path.join(k8sDir, 'ingress.yaml.hbs'),
    { ...baseData, services: plan.services, frontend: plan.frontend },
    path.join(outputDir, 'ingress.yaml'),
  );

  // Datadog Helm values
  renderToFile(
    path.join(k8sDir, 'datadog-values.yaml.hbs'),
    { ...baseData },
    path.join(outputDir, 'datadog', 'values.yaml'),
  );
}
