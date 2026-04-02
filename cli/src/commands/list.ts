import { Command } from 'commander';
import { loadManifest } from '../core/manifest.js';
import { catalogPath } from '../helpers/catalog.js';

export function registerListCommand(program: Command): void {
  const list = program.command('list').description('List available modules');

  list.command('backends').description('List available backends')
    .option('--output <format>', 'Output as JSON array of keys')
    .action((opts) => {
      const manifest = loadManifest(catalogPath());
      if (opts.output === 'json') {
        console.log(JSON.stringify(Object.keys(manifest.backends)));
        return;
      }
      console.log('Name'.padEnd(20) + 'Label');
      console.log('-'.repeat(50));
      for (const [key, val] of Object.entries(manifest.backends)) {
        console.log(key.padEnd(20) + val.label);
      }
    });

  list.command('frontends').description('List available frontends')
    .option('--output <format>', 'Output as JSON array of keys')
    .action((opts) => {
      const manifest = loadManifest(catalogPath());
      if (opts.output === 'json') {
        console.log(JSON.stringify(Object.keys(manifest.frontends)));
        return;
      }
      console.log('Name'.padEnd(20) + 'Label');
      console.log('-'.repeat(50));
      for (const [key, val] of Object.entries(manifest.frontends)) {
        console.log(key.padEnd(20) + val.label);
      }
    });

  list.command('features').description('List available features').action(() => {
    const manifest = loadManifest(catalogPath());
    console.log('Name'.padEnd(20) + 'Label'.padEnd(40) + 'Requires');
    console.log('-'.repeat(80));
    for (const [key, val] of Object.entries(manifest.features)) {
      const deps = val.requires_deps.length ? val.requires_deps.join(', ') : '-';
      console.log(key.padEnd(20) + val.label.padEnd(40) + deps);
    }
  });

  list.command('deps').description('List available infrastructure dependencies').action(() => {
    const manifest = loadManifest(catalogPath());
    console.log('Name'.padEnd(20) + 'Path');
    console.log('-'.repeat(50));
    for (const [key, val] of Object.entries(manifest.deps)) {
      console.log(key.padEnd(20) + val.path);
    }
  });
}
