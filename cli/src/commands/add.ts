import { Command } from 'commander';
import path from 'node:path';
import fs from 'fs-extra';
import { loadManifest } from '../core/manifest.js';
import { catalogPath, templatesPath } from '../helpers/catalog.js';
import { readProjectManifest, writeProjectManifest } from '../core/project-manifest.js';
import { patchComposeAddService, patchComposeAddAgentEnv, patchK8sForDep, getDepSpec } from '../core/patcher.js';
import { parseDeploy } from '../core/deploy.js';

export function registerAddCommand(program: Command): void {
  const add = program.command('add').description('Add modules to an existing project');

  add
    .command('feature <key>')
    .description('Add a Datadog feature to the project')
    .option('--dest <dir>', 'Project directory', '.')
    .action((key: string, opts: { dest: string }) => {
      const projectDir = path.resolve(opts.dest);
      const catPath = catalogPath();
      const manifest = loadManifest(catPath);

      // Validate feature key
      const featureEntry = manifest.features[key];
      if (!featureEntry) {
        const available = Object.keys(manifest.features).join(', ');
        console.error(`Unknown feature "${key}". Available: ${available}`);
        process.exit(1);
      }

      // Read project manifest
      const projectManifest = readProjectManifest(projectDir);

      // Check if feature already added
      if (projectManifest.features.includes(key)) {
        console.log(`Feature "${key}" is already enabled.`);
        return;
      }

      // Resolve deploy target
      const deploy = parseDeploy(projectManifest.deploy);
      const projectName = path.basename(projectDir);

      // Copy dep files from catalog
      for (const depKey of featureEntry.requires_deps) {
        const depEntry = manifest.deps[depKey];
        if (!depEntry) continue;
        const depSrc = path.join(catPath, depEntry.path);
        const depDest = path.join(projectDir, 'deps', path.basename(depEntry.path));
        if (!fs.existsSync(depDest) && fs.existsSync(depSrc)) {
          fs.copySync(depSrc, depDest, {
            filter: (s) => !path.basename(s).startsWith('module.json'),
          });
        }
      }

      // Patch orchestration files
      const agentEnv: Record<string, string> = featureEntry.agent_env ?? {};

      if (deploy.stack === 'compose') {
        const composePath = path.join(projectDir, 'docker-compose.yml');

        // Add dep services
        for (const depKey of featureEntry.requires_deps) {
          const depSpec = getDepSpec(depKey);
          if (depSpec) {
            patchComposeAddService(composePath, depSpec, projectName);
          }
        }

        // Add agent env vars
        if (Object.keys(agentEnv).length > 0) {
          patchComposeAddAgentEnv(composePath, agentEnv);
        }
      } else if (deploy.stack === 'k8s') {
        const k8sDir = path.join(projectDir, 'k8s');
        const tplDir = templatesPath();
        const namespace = projectName;
        const now = new Date();
        const ddEnv = `${projectName}-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

        for (const depKey of featureEntry.requires_deps) {
          const depSpec = getDepSpec(depKey);
          if (depSpec) {
            patchK8sForDep(k8sDir, depSpec, namespace, ddEnv, tplDir);
          }
        }
      }

      // Update project manifest
      projectManifest.features.push(key);
      writeProjectManifest(projectDir, projectManifest);

      console.log(`\n  Feature "${featureEntry.label}" added successfully.\n`);
      if (featureEntry.requires_deps.length > 0) {
        console.log(`  Dependencies added: ${featureEntry.requires_deps.join(', ')}`);
      }
      if (Object.keys(agentEnv).length > 0) {
        console.log(`  Agent env vars added: ${Object.keys(agentEnv).join(', ')}`);
      }
      console.log('');
    });

  add.command('dep').description('Add a dependency (coming soon)').action(() => {
    console.log('d-scribe add dep is coming in a future release.');
  });
}
