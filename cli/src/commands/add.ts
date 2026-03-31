import { Command } from 'commander';

export function registerAddCommand(program: Command): void {
  const add = program.command('add').description('Add modules to an existing project (coming soon)');

  add.command('feature').description('Add a feature (coming soon)').action(() => {
    console.log('d-scribe add feature is coming in a future release.');
  });

  add.command('dep').description('Add a dependency (coming soon)').action(() => {
    console.log('d-scribe add dep is coming in a future release.');
  });
}
