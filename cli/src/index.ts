import { program } from 'commander';
import { registerInitCommand } from './commands/init.js';
import { registerInstallCommand } from './commands/install.js';
import { registerListCommand } from './commands/list.js';
import { registerAddCommand } from './commands/add.js';

program
  .name('d-scribe')
  .description('CLI toolkit for assembling Datadog demo projects')
  .version('1.0.0');

registerInitCommand(program);
registerInstallCommand(program);
registerListCommand(program);
registerAddCommand(program);

program.parse();
