import { program } from 'commander';
import { registerInitCommand } from './commands/init.js';

program
  .name('d-scribe')
  .description('CLI toolkit for assembling Datadog demo projects')
  .version('1.0.0');

registerInitCommand(program);
// registerListCommand and registerAddCommand will be added in Task 8

program.parse();
