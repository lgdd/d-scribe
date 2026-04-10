import { Command } from 'commander';
import path from 'node:path';
import fs from 'fs-extra';
import { checkbox, confirm } from '@inquirer/prompts';
import { createTwoFilesPatch } from 'diff';
import { skillsPath } from '../helpers/catalog.js';

interface Tool {
  name: string;
  configDir: string;
  skillsDir: string;
}

function collectFiles(dir: string, base = dir): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full, base));
    } else {
      files.push(path.relative(base, full));
    }
  }
  return files.sort();
}

function dirsAreEqual(src: string, dest: string): boolean {
  if (!fs.existsSync(dest)) return false;
  const srcFiles = collectFiles(src);
  const destFiles = collectFiles(dest);
  if (srcFiles.length !== destFiles.length) return false;
  for (let i = 0; i < srcFiles.length; i++) {
    if (srcFiles[i] !== destFiles[i]) return false;
    const srcBuf = fs.readFileSync(path.join(src, srcFiles[i]));
    const destBuf = fs.readFileSync(path.join(dest, destFiles[i]));
    if (Buffer.compare(srcBuf, destBuf) !== 0) return false;
  }
  return true;
}

function getFileDiffs(src: string, dest: string): string[] {
  const srcFiles = new Set(collectFiles(src));
  const destFiles = new Set(collectFiles(dest));
  const allFiles = new Set([...srcFiles, ...destFiles]);
  const diffs: string[] = [];

  for (const file of allFiles) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const srcContent = srcFiles.has(file) ? fs.readFileSync(srcPath, 'utf-8') : '';
    const destContent = destFiles.has(file) ? fs.readFileSync(destPath, 'utf-8') : '';

    if (srcContent !== destContent) {
      const patch = createTwoFilesPatch(
        `installed/${file}`,
        `new/${file}`,
        destContent,
        srcContent,
      );
      const useColor = (process.stdout.isTTY ?? false) && !process.env.NO_COLOR;
      const colored = useColor
        ? patch
            .split('\n')
            .map(line => {
              if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('==='))
                return `\x1b[2m${line}\x1b[0m`;       // dim for headers
              if (line.startsWith('@@'))
                return `\x1b[36m${line}\x1b[0m`;       // cyan for hunk markers
              if (line.startsWith('+'))
                return `\x1b[32m${line}\x1b[0m`;       // green for additions
              if (line.startsWith('-'))
                return `\x1b[31m${line}\x1b[0m`;       // red for removals
              return line;
            })
            .join('\n')
        : patch;
      diffs.push(colored);
    }
  }

  return diffs;
}

const INSTALLABLE_SKILLS = ['dd-scaffold-demo', 'dd-lookup-docs'];

function copySkill(src: string, skillsDir: string, skillName: string): void {
  const dest = path.join(skillsDir, skillName);
  fs.ensureDirSync(skillsDir);
  fs.removeSync(dest);
  fs.copySync(src, dest);
}

export function registerInstallCommand(program: Command): void {
  const install = program.command('install').description('Install d-scribe components');

  install
    .command('skills')
    .description('Install d-scribe skills globally for detected AI coding tools')
    .option('--tool <name>', 'Force install for a specific tool (cursor, claude, windsurf, gemini, opencode, goose)')
    .option('-y, --yes', 'Skip prompts and accept all defaults')
    .action(async (opts) => {
      const skPath = skillsPath();

      // Validate all installable skills exist in the bundle
      const skillSources: { name: string; src: string }[] = [];
      for (const skillName of INSTALLABLE_SKILLS) {
        const src = path.join(skPath, skillName);
        if (!fs.existsSync(src)) {
          console.error(`Error: ${skillName} skill not found in bundle.`);
          process.exit(1);
        }
        skillSources.push({ name: skillName, src });
      }

      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      const configDir = process.env.XDG_CONFIG_HOME || path.join(homeDir, '.config');
      const tools: Tool[] = [
        { name: 'Cursor', configDir: path.join(homeDir, '.cursor'), skillsDir: path.join(homeDir, '.cursor', 'skills') },
        { name: 'Claude', configDir: path.join(homeDir, '.claude'), skillsDir: path.join(homeDir, '.claude', 'skills') },
        { name: 'Windsurf', configDir: path.join(homeDir, '.windsurf'), skillsDir: path.join(homeDir, '.windsurf', 'skills') },
        { name: 'Gemini', configDir: path.join(homeDir, '.gemini'), skillsDir: path.join(homeDir, '.gemini', 'skills') },
        { name: 'OpenCode', configDir: path.join(configDir, 'opencode'), skillsDir: path.join(configDir, 'opencode', 'skills') },
        { name: 'Goose', configDir: path.join(configDir, 'goose'), skillsDir: path.join(configDir, 'goose', 'skills') },
      ];

      // Filter by --tool flag if provided
      let targets = tools;
      if (opts.tool) {
        const toolName = opts.tool.toLowerCase();
        const toolMap: Record<string, string> = Object.fromEntries(tools.map(t => [t.name.toLowerCase(), t.name]));
        const match = toolMap[toolName];
        if (!match) {
          console.error(`Unknown tool "${opts.tool}". Available: ${tools.map(t => t.name.toLowerCase()).join(', ')}`);
          process.exit(1);
        }
        targets = tools.filter(t => t.name === match);
      }

      // Only consider tools whose config directory exists
      const detected = targets.filter(t => {
        if (fs.existsSync(t.configDir)) return true;
        if (opts.tool) {
          console.error(`  ${t.name} config directory (${t.configDir}) not found. Is ${t.name} installed?`);
          process.exit(1);
        }
        return false;
      });

      if (detected.length === 0) {
        console.error('\nNo supported tools detected. Install Cursor or Claude Code, or use --tool to specify.');
        process.exit(1);
      }

      // Process each skill
      for (const skill of skillSources) {
        // Classify each tool for this skill
        const notInstalled: Tool[] = [];
        const upToDate: Tool[] = [];
        const changed: { tool: Tool; diffs: string[] }[] = [];

        for (const tool of detected) {
          const dest = path.join(tool.skillsDir, skill.name);
          if (!fs.existsSync(dest)) {
            notInstalled.push(tool);
          } else if (dirsAreEqual(skill.src, dest)) {
            upToDate.push(tool);
          } else {
            changed.push({ tool, diffs: getFileDiffs(skill.src, dest) });
          }
        }

        console.log(`\n${skill.name} skill:`);

        // Print up-to-date
        for (const tool of upToDate) {
          console.log(`  ○ ${tool.name.padEnd(8)} — already up to date`);
        }

        // Prompt for new installs
        if (notInstalled.length > 0) {
          let toInstall = notInstalled;
          if (!opts.yes) {
            const selected = await checkbox({
              message: `Select where to install ${skill.name}`,
              choices: notInstalled.map(t => ({
                name: `${t.name} → ${t.skillsDir}/${skill.name}`,
                value: t.name,
                checked: true,
              })),
            });
            toInstall = notInstalled.filter(t => selected.includes(t.name));
          }
          for (const tool of toInstall) {
            copySkill(skill.src, tool.skillsDir, skill.name);
            console.log(`  ✓ ${tool.name.padEnd(8)} — installed`);
          }
        }

        // Prompt for changed — show actual content diff
        for (const { tool, diffs } of changed) {
          console.log(`\n  ~ ${tool.name} — changes detected:\n`);
          for (const d of diffs) {
            console.log(d);
          }
          const override = opts.yes || await confirm({ message: `Override ${skill.name} in ${tool.name}?`, default: true });
          if (override) {
            copySkill(skill.src, tool.skillsDir, skill.name);
            console.log(`  ✓ ${tool.name.padEnd(8)} — updated`);
          } else {
            console.log(`  ○ ${tool.name.padEnd(8)} — skipped`);
          }
        }
      }

      console.log('');
    });
}
