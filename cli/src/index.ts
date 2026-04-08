import { createRequire } from 'node:module';
import { program } from 'commander';
import { registerInitCommand } from './commands/init.js';
import { registerInstallCommand } from './commands/install.js';
import { registerListCommand } from './commands/list.js';
import { registerAddCommand } from './commands/add.js';

const pkg = createRequire(import.meta.url)('../package.json');

program
  .name('d-scribe')
  .description('CLI toolkit for assembling Datadog demo projects')
  .version(pkg.version);

registerInitCommand(program);
registerInstallCommand(program);
registerListCommand(program);
registerAddCommand(program);

program.parse();
