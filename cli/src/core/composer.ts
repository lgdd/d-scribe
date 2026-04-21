import path from 'node:path';
import { renderToFile } from './renderer.js';
import type { ResolvedPlan } from './resolver.js';
import { getDepSpec } from './patcher.js';

export function composeDockerCompose(
  plan: ResolvedPlan,
  projectName: string,
  templatesDir: string,
  outputPath: string,
): void {
  const templatePath = path.join(templatesDir, 'docker-compose.yml.hbs');

  const depSpecs = plan.deps
    .map(d => {
      const spec = getDepSpec(d.key);
      if (!spec) return null;
      return {
        serviceName: spec.serviceName,
        image: spec.image,
        command: spec.command ?? null,
        ports: spec.ports ?? null,
        environment: spec.environment
          ? Object.entries(spec.environment).map(([k, v]) => `${k}=${v}`)
          : null,
        volumes: [
          ...(spec.extraVolumeMounts ?? []).map(m => `${m.hostPath}:${m.containerPath}`),
          ...(spec.volumes ?? []).map(v => `${v.name}:${v.mountPath}`),
        ],
        namedVolumes: (spec.volumes ?? []).map(v => v.name),
        healthcheck: spec.healthcheck ?? null,
      };
    })
    .filter(Boolean);

  const data = {
    projectName,
    services: plan.services,
    frontend: plan.frontend,
    features: plan.features,
    deps: plan.deps,
    depSpecs,
    envVars: plan.envVars,
    envVarEntries: Object.entries(plan.envVars),
    serviceEnvVarEntries: Object.entries(plan.serviceEnvVars),
    ddSite: plan.ddSite,
    instrumentation: plan.instrumentation,
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
    hasProfiler: plan.features.some(f => f.key === 'apm:profiling'),
    hasDbm: plan.features.some(f => f.key.startsWith('dbm:')),
    hasNetworkMonitoring: false,
    instrumentation: plan.instrumentation,
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
      logSource: svc.language,
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
      logSource: 'nginx',
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

  // Deps — generic loop
  for (const dep of plan.deps) {
    const spec = getDepSpec(dep.key);
    if (!spec) continue;
    const depData = { ...baseData, name: spec.serviceName, image: spec.image, port: spec.port, logSource: spec.serviceName };
    renderToFile(path.join(k8sDir, 'deployment.yaml.hbs'), depData, path.join(outputDir, 'deps', `${spec.serviceName}-deployment.yaml`));
    renderToFile(path.join(k8sDir, 'service.yaml.hbs'), depData, path.join(outputDir, 'deps', `${spec.serviceName}-service.yaml`));
  }

  // Traffic
  const trafficData = { ...baseData, name: 'traffic', image: `${projectName}/traffic:latest`, port: 8089, logSource: 'python' };
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
