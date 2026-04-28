import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { loadManifest, type InstrumentationMode } from '../core/manifest.js';
import { catalogPath } from '../helpers/catalog.js';

export function registerListCommand(program: Command): void {
  const list = program.command('list').description('List available modules');

  list.command('backends').description('List available backends')
    .option('--output <format>', 'Output as JSON array of keys')
    .option('--instrumentation <mode>', 'Filter by instrumentation mode')
    .action((opts) => {
      const catPath = catalogPath();
      const manifest = loadManifest(catPath);
      if (opts.instrumentation && !manifest.instrumentation.modes.includes(opts.instrumentation as InstrumentationMode)) {
        console.error(`Unknown mode: ${opts.instrumentation}. Valid: ${manifest.instrumentation.modes.join(', ')}`);
        process.exit(1);
      }
      const withModes = Object.entries(manifest.backends).map(([key, val]) => {
        const modulePath = path.join(catPath, val.path, 'module.json');
        const modes: string[] = fs.existsSync(modulePath)
          ? (JSON.parse(fs.readFileSync(modulePath, 'utf-8')).supported_instrumentation_modes ?? ['datadog'])
          : ['datadog'];
        return { key, val, modes };
      });
      const entries = opts.instrumentation
        ? withModes.filter(({ modes }) => modes.includes(opts.instrumentation))
        : withModes;
      if (opts.output === 'json') {
        console.log(JSON.stringify(entries.map(({ key }) => key)));
        return;
      }
      console.log('Name'.padEnd(22) + 'Label'.padEnd(28) + 'Modes');
      console.log('-'.repeat(80));
      for (const { key, val, modes } of entries) {
        console.log(key.padEnd(22) + val.label.padEnd(28) + modes.join(','));
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

  list.command('features').description('List available features')
    .option('--instrumentation <mode>', 'Filter by instrumentation mode')
    .action((opts) => {
      const manifest = loadManifest(catalogPath());
      if (opts.instrumentation && !manifest.instrumentation.modes.includes(opts.instrumentation as InstrumentationMode)) {
        console.error(`Unknown mode: ${opts.instrumentation}. Valid: ${manifest.instrumentation.modes.join(', ')}`);
        process.exit(1);
      }
      const allEntries = Object.entries(manifest.features);
      const entries = opts.instrumentation
        ? allEntries.filter(([, val]) =>
            (val.supported_instrumentation_modes ?? ['datadog']).includes(opts.instrumentation as InstrumentationMode))
        : allEntries;

      const groups = new Map<string, Array<[string, typeof entries[0][1]]>>();
      for (const [key, val] of entries) {
        const prefix = key.includes(':') ? key.split(':')[0] : key;
        if (!groups.has(prefix)) groups.set(prefix, []);
        groups.get(prefix)!.push([key, val]);
      }

      for (const [group, features] of groups) {
        console.log(`\n  ${group.toUpperCase()}`);
        for (const [key, val] of features) {
          const deps = val.requires_deps.length ? val.requires_deps.join(', ') : '-';
          const modes = (val.supported_instrumentation_modes ?? ['datadog']).join(',');
          console.log(`    ${key.padEnd(28)}${val.label.padEnd(36)}${deps.padEnd(20)}${modes}`);
        }
      }
      console.log();
    });

  list.command('deps').description('List available infrastructure dependencies').action(() => {
    const manifest = loadManifest(catalogPath());
    console.log('Name'.padEnd(20) + 'Path');
    console.log('-'.repeat(50));
    for (const [key, val] of Object.entries(manifest.deps)) {
      console.log(key.padEnd(20) + val.path);
    }
  });

  list.command('deploy').description('List available deploy targets')
    .option('--output <format>', 'Output as JSON array of keys')
    .action((opts) => {
      const manifest = loadManifest(catalogPath());
      if (opts.output === 'json') {
        console.log(JSON.stringify(Object.keys(manifest.infra.deploy)));
        return;
      }
      console.log('Target'.padEnd(25) + 'Label');
      console.log('-'.repeat(60));
      for (const [key, val] of Object.entries(manifest.infra.deploy)) {
        const status = val.status ? ` (${val.status})` : '';
        console.log(key.padEnd(25) + val.label + status);
      }
    });

  list.command('modes').description('List available instrumentation modes').action(() => {
    const manifest = loadManifest(catalogPath());
    const glosses: Record<string, string> = {
      datadog: 'Datadog SDK + Datadog Agent (default, all features supported)',
      ddot: 'Datadog SDK + DDOT Collector (k8s only, all features supported)',
      otel: 'OpenTelemetry SDK + OTel Collector (limited features; see list features)',
    };
    const constraints: Record<string, string> = {
      datadog: 'compose, k8s',
      ddot: 'k8s only',
      otel: 'compose, k8s',
    };
    console.log('Mode'.padEnd(12) + 'Deploy'.padEnd(16) + 'Description');
    console.log('-'.repeat(80));
    for (const mode of manifest.instrumentation.modes) {
      console.log(mode.padEnd(12) + constraints[mode].padEnd(16) + glosses[mode]);
    }
  });
}
