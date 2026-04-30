import { Command } from 'commander';
import path from 'node:path';
import fs from 'fs-extra';
import { loadManifest } from '../core/manifest.js';
import { resolve } from '../core/resolver.js';
import type { InstrumentationMode } from '../core/resolver.js';
import { composeDockerCompose, composeK8s } from '../core/composer.js';
import { renderToFile } from '../core/renderer.js';
import { catalogPath, skillsPath, templatesPath } from '../helpers/catalog.js';
import { writeProjectManifest } from '../core/project-manifest.js';
import { getDepSpec } from '../core/patcher.js';
import { getSastRulesets } from '../core/sast.js';

export function registerInitCommand(program: Command): void {
  const init = program.command('init').description('Initialize a new project');

  const demo = init
    .command('demo')
    .description('Create a complete Datadog demo project')
    .requiredOption('--backend <specs>', 'Backend(s) as lang:framework, comma-separated')
    .option('--frontend <spec>', 'Frontend as framework:bundler')
    .option('--features <list>', 'Features as category:type, comma-separated', '')
    .option('--services <count>', 'Number of microservices to scaffold', '4')
    .option('--deploy <target>', 'Deploy target (compose, k8s, k8s:aws:ec2, etc.)', 'compose')
    .option('--dd-site <site>', 'Datadog site', 'datadoghq.com')
    .option('--dest <dir>', 'Destination directory', '.')
    .option('--instrumentation <mode>', 'Instrumentation mode: datadog | ddot | otel', 'datadog')
    .action((opts) => {
      const catPath = catalogPath();
      const manifest = loadManifest(catPath);
      const outputDir = path.resolve(opts.dest);

      // Parse comma-separated args
      const backends = opts.backend.split(',').map((s: string) => s.trim());
      const features = opts.features ? opts.features.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      const serviceCount = parseInt(opts.services, 10);

      // Resolve plan
      const plan = resolve({ backends, frontend: opts.frontend, features, deploy: opts.deploy, ddSite: opts.ddSite, serviceCount, instrumentation: opts.instrumentation as InstrumentationMode }, manifest);

      // Create output dir
      fs.ensureDirSync(outputDir);

      // Copy service-template N times for each service
      for (const svc of plan.services) {
        const templateDirName = plan.instrumentation === 'otel' ? 'service-template-otel' : 'service-template';
        const templateDir = path.join(catPath, svc.backendPath, templateDirName);
        const dest = path.join(outputDir, 'services', svc.name);
        fs.copySync(templateDir, dest);
      }

      // Copy frontend template
      if (plan.frontend) {
        const frontendBase = path.join(catPath, plan.frontend.path);
        const templateSubdir = path.join(frontendBase, 'template');
        const src = fs.existsSync(templateSubdir) ? templateSubdir : frontendBase;
        const dest = path.join(outputDir, 'frontend');
        fs.copySync(src, dest, { filter: (s) => !path.basename(s).startsWith('module.json') });

        // Render nginx.conf from template — the static file uses service-1 as a placeholder;
        // the template variant resolves to the actual first service name and port
        const nginxTplPath = path.join(dest, 'nginx.conf.hbs');
        if (fs.existsSync(nginxTplPath)) {
          renderToFile(
            nginxTplPath,
            {
              firstServiceName: plan.services[0]?.name ?? 'service-1',
              firstServicePort: plan.services[0]?.port ?? 8080,
            },
            path.join(dest, 'nginx.conf'),
          );
          fs.removeSync(nginxTplPath);
        }
      }

      // Copy traffic
      const trafficSrc = path.join(catPath, 'traffic');
      fs.copySync(trafficSrc, path.join(outputDir, 'traffic'), {
        filter: (s) => !path.basename(s).startsWith('module.json'),
      });

      // Copy dep files
      for (const dep of plan.deps) {
        const depSrc = path.join(catPath, dep.path);
        if (fs.existsSync(depSrc)) {
          const depDest = path.join(outputDir, 'deps', path.basename(dep.path));
          fs.copySync(depSrc, depDest, { filter: (s) => !path.basename(s).startsWith('module.json') });
        }
      }

      // Copy patterns from used backends into references/
      const copiedBackends = new Set<string>();
      for (const svc of plan.services) {
        if (copiedBackends.has(svc.backendPath)) continue;
        copiedBackends.add(svc.backendPath);
        const patternsDirName = plan.instrumentation === 'otel' ? 'patterns-otel' : 'patterns';
        const patternsDir = path.join(catPath, svc.backendPath, patternsDirName);
        if (fs.existsSync(patternsDir)) {
          const backendName = path.basename(svc.backendPath);
          fs.copySync(patternsDir, path.join(outputDir, 'references', 'patterns', backendName));
        }
      }

      // Copy frontend patterns if frontend is used
      if (plan.frontend) {
        const frontendPatternsDir = path.join(catPath, plan.frontend.path, 'patterns');
        if (fs.existsSync(frontendPatternsDir)) {
          const frontendName = path.basename(plan.frontend.path);
          fs.copySync(frontendPatternsDir, path.join(outputDir, 'references', 'patterns', frontendName));
        }
      }

      // Project name from output dir
      const projectName = path.basename(outputDir);

      // DD_ENV: {project}-{YYMMDD} to prevent collision in shared Datadog orgs
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const ddEnv = `${projectName}-${yy}${mm}${dd}`;

      // Templates dir
      const tplDir = templatesPath();

      // Group services by backend for AGENTS.md
      const servicesByBackend = groupServicesByBackend(plan.services, manifest);

      // Build generic depSpecs for templates
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

      // Template data (shared across all templates)
      const data = {
        projectName,
        ddEnv,
        namespace: projectName,
        services: plan.services,
        frontend: plan.frontend,
        features: plan.features,
        deps: plan.deps,
        depSpecs,
        envVars: plan.envVars,
        envVarEntries: Object.entries(plan.envVars),
        serviceEnvVarEntries: Object.entries(plan.serviceEnvVars),
        ddSite: plan.ddSite,
        deploy: plan.deploy,
        servicesByBackend,
        instrumentation: plan.instrumentation,
      };

      // Render all templates
      // Render orchestration files based on deploy target
      if (plan.deploy.stack === 'compose') {
        composeDockerCompose(plan, projectName, tplDir, path.join(outputDir, 'docker-compose.yml'));
        if (plan.instrumentation === 'otel') {
          renderToFile(
            path.join(catPath, 'infra', 'otel-collector', 'compose', 'otel-collector-config.yaml.hbs'),
            data,
            path.join(outputDir, 'otel-collector-config.yaml'),
          );
        }
      } else if (plan.deploy.stack === 'k8s') {
        const namespace = projectName;
        composeK8s(plan, projectName, namespace, ddEnv, tplDir, path.join(outputDir, 'k8s'));

        // Generate build-only docker-compose for image building
        renderToFile(
          path.join(tplDir, 'docker-compose.build.yml.hbs'),
          data,
          path.join(outputDir, 'docker-compose.yml'),
        );
      }

      // Generate Terraform files for AWS deploy targets
      if (plan.deploy.provider === 'aws') {
        const tfDir = path.join(outputDir, 'terraform');
        const tfTplDir = path.join(tplDir, 'terraform', 'ec2');
        const firstServicePort = plan.services[0]?.port ?? 8080;

        const tfData = {
          ...data,
          firstServicePort,
        };

        renderToFile(path.join(tfTplDir, 'main.tf.hbs'), tfData, path.join(tfDir, 'main.tf'));
        renderToFile(path.join(tfTplDir, 'variables.tf.hbs'), tfData, path.join(tfDir, 'variables.tf'));
        renderToFile(path.join(tfTplDir, 'outputs.tf.hbs'), tfData, path.join(tfDir, 'outputs.tf'));
        renderToFile(path.join(tfTplDir, 'user_data.sh.hbs'), tfData, path.join(tfDir, 'user_data.sh'));
        renderToFile(path.join(tfTplDir, 'terraform.tfvars.example.hbs'), tfData, path.join(tfDir, 'terraform.tfvars.example'));
        renderToFile(path.join(tfTplDir, 'deploy.sh.hbs'), tfData, path.join(tfDir, 'deploy.sh'));
        renderToFile(path.join(tfTplDir, 'gitignore.hbs'), tfData, path.join(tfDir, '.gitignore'));

        // Make deploy.sh executable
        fs.chmodSync(path.join(tfDir, 'deploy.sh'), 0o755);
      }

      renderToFile(path.join(tplDir, 'AGENTS.md.hbs'), data, path.join(outputDir, 'AGENTS.md'));
      renderToFile(path.join(tplDir, 'CLAUDE.md.hbs'), data, path.join(outputDir, 'CLAUDE.md'));
      renderToFile(path.join(tplDir, 'env.hbs'), data, path.join(outputDir, '.env.example'));

      // Copy .env.example to .env, injecting host environment variables
      const envExample = fs.readFileSync(path.join(outputDir, '.env.example'), 'utf-8');
      let envContent = envExample;
      const hostVars: Record<string, string> = {
        DD_API_KEY: process.env.DD_API_KEY || '',
        DD_APP_KEY: process.env.DD_APP_KEY || '',
        DD_SITE: process.env.DD_SITE || '',
      };
      for (const [key, value] of Object.entries(hostVars)) {
        if (value) {
          envContent = envContent.replace(
            new RegExp(`^${key}=.*$`, 'm'),
            `${key}=${value}`,
          );
        }
      }
      fs.writeFileSync(path.join(outputDir, '.env'), envContent, 'utf-8');

      renderToFile(path.join(tplDir, 'README.md.hbs'), data, path.join(outputDir, 'README.md'));

      // Generate static-analysis.datadog.yml if SAST is enabled
      if (plan.features.some(f => f.key === 'security:sast')) {
        const rulesets = getSastRulesets(backends);
        renderToFile(
          path.join(tplDir, 'static-analysis.datadog.yml.hbs'),
          { rulesets },
          path.join(outputDir, 'static-analysis.datadog.yml'),
        );
      }

      // Write .gitignore
      const gitignoreEntries = [
        '.env', 'node_modules/', '.gradle/', 'target/', 'build/',
        '__pycache__/', '*.pyc', 'dist/',
      ];
      if (plan.deploy.provider === 'aws') {
        gitignoreEntries.push(
          'terraform/.terraform/',
          'terraform/*.tfstate',
          'terraform/*.tfstate.backup',
          'terraform/*.tfvars',
          '!terraform/terraform.tfvars.example',
          'terraform/.terraform.lock.hcl',
        );
      }
      fs.writeFileSync(path.join(outputDir, '.gitignore'), gitignoreEntries.join('\n') + '\n');

      // Write project manifest
      writeProjectManifest(outputDir, {
        backends,
        frontend: opts.frontend || null,
        features,
        deploy: opts.deploy,
        services: serviceCount,
        instrumentation: plan.instrumentation,
      });

      // Copy skills
      const skPath = skillsPath();
      if (fs.existsSync(skPath)) {
        fs.copySync(skPath, path.join(outputDir, 'skills'));
      }

      console.log(`\n  Demo project created at ${outputDir}\n`);
      console.log('  Next steps:');
      console.log(`    1. cd ${path.relative(process.cwd(), outputDir) || '.'}`);
      console.log('    2. Review .env (auto-populated from host if DD_API_KEY was set)');
      if (plan.deploy.provider === 'aws') {
        console.log('    3. cd terraform && cp terraform.tfvars.example terraform.tfvars');
        console.log('    4. Edit terraform.tfvars with your Datadog API key');
        console.log('    5. terraform init && terraform apply');
        console.log('    6. ./deploy.sh');
      } else if (plan.deploy.stack === 'k8s') {
        console.log('    3. minikube start');
        console.log('    4. eval $(minikube docker-env) && docker compose build');
        console.log(`    5. kubectl create namespace ${projectName} --dry-run=client -o yaml | kubectl apply -f -`);
        console.log(`    6. kubectl create secret generic datadog-secret --from-literal=api-key=$DD_API_KEY -n ${projectName} --dry-run=client -o yaml | kubectl apply -f -`);
        console.log('    7. helm repo add datadog https://helm.datadoghq.com');
        console.log(`    8. helm install datadog datadog/datadog -f helm/datadog-values.yaml -n ${projectName}`);
        console.log('    9. kubectl apply -f k8s/ --recursive');
      } else {
        console.log('    3. docker compose up -d');
      }
      console.log('');
    });

  // Add dynamic help showing available options from manifest
  demo.addHelpText('after', () => {
    try {
      const catPath = catalogPath();
      const manifest = loadManifest(catPath);
      let text = '\nAvailable backends:\n';
      for (const [key, val] of Object.entries(manifest.backends)) {
        text += `  ${key.padEnd(20)} ${val.label}\n`;
      }
      text += '\nAvailable frontends:\n';
      for (const [key, val] of Object.entries(manifest.frontends)) {
        text += `  ${key.padEnd(20)} ${val.label}\n`;
      }
      text += '\nAvailable features:\n';
      for (const [key, val] of Object.entries(manifest.features)) {
        const deps = val.requires_deps.length ? ` (requires: ${val.requires_deps.join(', ')})` : '';
        text += `  ${key.padEnd(20)} ${val.label}${deps}\n`;
      }
      return text;
    } catch {
      return '';
    }
  });

}

function groupServicesByBackend(
  services: Array<{ name: string; backend: string }>,
  manifest: { backends: Record<string, { label: string }> },
) {
  const groups: Record<string, { label: string; services: string[] }> = {};
  for (const svc of services) {
    if (!groups[svc.backend]) {
      groups[svc.backend] = { label: manifest.backends[svc.backend].label, services: [] };
    }
    groups[svc.backend].services.push(svc.name);
  }
  return Object.values(groups);
}
