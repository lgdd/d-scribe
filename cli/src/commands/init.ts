import { Command } from 'commander';
import path from 'node:path';
import fs from 'fs-extra';
import { loadManifest } from '../core/manifest.js';
import { resolve } from '../core/resolver.js';
import { composeDockerCompose } from '../core/composer.js';
import { renderToFile } from '../core/renderer.js';
import { catalogPath, skillsPath, templatesPath } from '../helpers/catalog.js';

export function registerInitCommand(program: Command): void {
  const init = program.command('init').description('Initialize a new project or install skills');

  const demo = init
    .command('demo')
    .description('Create a complete Datadog demo project')
    .requiredOption('--backend <specs>', 'Backend(s) as lang:framework, comma-separated')
    .option('--frontend <spec>', 'Frontend as framework:bundler')
    .option('--features <list>', 'Features as category:type, comma-separated', '')
    .option('--stack <type>', 'Infrastructure stack', 'compose')
    .option('--deploy <target>', 'Deployment target', 'local')
    .option('--dd-site <site>', 'Datadog site', 'datadoghq.com')
    .option('--output <dir>', 'Output directory', '.')
    .action((opts) => {
      const catPath = catalogPath();
      const manifest = loadManifest(catPath);
      const outputDir = path.resolve(opts.output);

      // Parse comma-separated args
      const backends = opts.backend.split(',').map((s: string) => s.trim());
      const features = opts.features ? opts.features.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

      // Resolve plan
      const plan = resolve({ backends, frontend: opts.frontend, features, stack: opts.stack, deploy: opts.deploy, ddSite: opts.ddSite }, manifest);

      // Create output dir
      fs.ensureDirSync(outputDir);

      // Copy services from catalog
      for (const svc of plan.services) {
        const src = path.join(catPath, svc.backendPath, 'base', svc.name);
        const dest = path.join(outputDir, 'services', svc.name);
        fs.copySync(src, dest);
      }

      // Copy frontend
      if (plan.frontend) {
        const src = path.join(catPath, plan.frontend.path);
        const dest = path.join(outputDir, 'frontend');
        fs.copySync(src, dest, { filter: (s) => !path.basename(s).startsWith('module.json') });
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

      // Project name from output dir
      const projectName = path.basename(outputDir);

      // Templates dir
      const tplDir = templatesPath();

      // Group services by backend for AGENTS.md
      const servicesByBackend = groupServicesByBackend(plan.services, manifest);

      // Port map for template data
      const portMap: Record<string, number> = {
        'api-gateway': 8080, 'project-service': 8081, 'task-service': 8082, 'user-service': 8083,
      };
      const servicesWithPorts = plan.services.map(s => ({ ...s, port: portMap[s.name] ?? 8080 }));

      // Template data (shared across all templates)
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
        stack: plan.stack,
        deploy: plan.deploy,
        servicesByBackend,
      };

      // Render all templates
      composeDockerCompose(plan, projectName, tplDir, path.join(outputDir, 'docker-compose.yml'));
      renderToFile(path.join(tplDir, 'AGENTS.md.hbs'), data, path.join(outputDir, 'AGENTS.md'));
      renderToFile(path.join(tplDir, 'CLAUDE.md.hbs'), data, path.join(outputDir, 'CLAUDE.md'));
      renderToFile(path.join(tplDir, 'env.hbs'), data, path.join(outputDir, '.env.example'));
      renderToFile(path.join(tplDir, 'README.md.hbs'), data, path.join(outputDir, 'README.md'));

      // Write .gitignore
      fs.writeFileSync(path.join(outputDir, '.gitignore'), [
        '.env', 'node_modules/', '.gradle/', 'target/', 'build/',
        '__pycache__/', '*.pyc', 'dist/',
      ].join('\n') + '\n');

      // Copy skills
      const skPath = skillsPath();
      if (fs.existsSync(skPath)) {
        fs.copySync(skPath, path.join(outputDir, 'skills'));
      }

      console.log(`\n  Demo project created at ${outputDir}\n`);
      console.log('  Next steps:');
      console.log(`    1. cd ${path.relative(process.cwd(), outputDir) || '.'}`);
      console.log('    2. cp .env.example .env  # Edit with your Datadog API key');
      console.log('    3. docker compose up -d');
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

  init
    .command('skills')
    .description('Install dd-scaffold-demo skill globally for Cursor and/or Claude Code')
    .option('--tool <name>', 'Force install for a specific tool (cursor, claude)')
    .action((opts) => {
      const skPath = skillsPath();
      const skillSrc = path.join(skPath, 'dd-scaffold-demo');

      if (!fs.existsSync(skillSrc)) {
        console.error('Error: dd-scaffold-demo skill not found in bundle.');
        process.exit(1);
      }

      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      const tools: Array<{ name: string; configDir: string; skillsDir: string }> = [
        { name: 'Cursor', configDir: path.join(homeDir, '.cursor'), skillsDir: path.join(homeDir, '.cursor', 'skills') },
        { name: 'Claude', configDir: path.join(homeDir, '.claude'), skillsDir: path.join(homeDir, '.claude', 'skills') },
      ];

      // Filter by --tool flag if provided
      let targets = tools;
      if (opts.tool) {
        const toolName = opts.tool.toLowerCase();
        const toolMap: Record<string, string> = { cursor: 'Cursor', claude: 'Claude' };
        const match = toolMap[toolName];
        if (!match) {
          console.error(`Unknown tool "${opts.tool}". Available: cursor, claude`);
          process.exit(1);
        }
        targets = tools.filter(t => t.name === match);
      }

      let installed = 0;
      console.log('\nInstalled dd-scaffold-demo skill:');

      for (const tool of targets) {
        if (!fs.existsSync(tool.configDir)) {
          if (opts.tool) {
            console.error(`  ${tool.name} config directory (${tool.configDir}) not found. Is ${tool.name} installed?`);
            process.exit(1);
          }
          console.log(`  ○ ${tool.name.padEnd(8)} — not detected`);
          continue;
        }

        const dest = path.join(tool.skillsDir, 'dd-scaffold-demo');
        fs.ensureDirSync(tool.skillsDir);
        // Remove existing symlink or file before copying (handles migration from install.sh symlinks)
        fs.removeSync(dest);
        fs.copySync(skillSrc, dest);
        console.log(`  ✓ ${tool.name.padEnd(8)} → ${dest}/SKILL.md`);
        installed++;
      }

      if (installed === 0) {
        console.error('\nNo supported tools detected. Install Cursor or Claude Code, or use --tool to specify.');
        process.exit(1);
      }

      console.log('');
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
