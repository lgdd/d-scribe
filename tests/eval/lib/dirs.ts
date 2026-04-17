import { mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

// Monotonic counter ensures unique dir names when multiple calls land in the same millisecond.
let _counter = 0;

export function createRunDir(baseDir: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const suffix = String(_counter++).padStart(4, "0");
  const runDir = join(baseDir, `${timestamp}-${suffix}`);
  mkdirSync(runDir, { recursive: true });
  return runDir;
}

export function pruneOldRuns(baseDir: string, maxRuns: number): void {
  if (!existsSync(baseDir)) return;

  const dirs = readdirSync(baseDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();

  const toRemove = dirs.slice(0, Math.max(0, dirs.length - maxRuns));
  for (const dir of toRemove) {
    rmSync(join(baseDir, dir), { recursive: true, force: true });
  }
}
