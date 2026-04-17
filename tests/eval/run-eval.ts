// tests/eval/run-eval.ts
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  mkdirSync,
  symlinkSync,
  rmSync,
  chmodSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRunDir, pruneOldRuns } from "./lib/dirs.js";
import { createRumApp, deleteRumApp, type RumApp } from "./lib/rum.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const EVAL_OUT_DIR = join(__dirname, "out");
const EVAL_BIN_DIR = join(__dirname, "bin");
const CLI_DIR = resolve(__dirname, "../../cli");
const CLI_ENTRY = join(CLI_DIR, "dist", "index.js");
const MAX_RUNS = 3;

function checkEnvVars(): void {
  const required = ["ANTHROPIC_API_KEY", "DD_API_KEY", "DD_APP_KEY"];
  const missing = required.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    console.error("See .env.example for required variables.");
    process.exit(1);
  }
}

function buildCli(): void {
  console.log("Building CLI...");
  execFileSync("npm", ["run", "build"], { cwd: CLI_DIR, stdio: "inherit" });
  console.log("CLI built.\n");
}

function setupLocalBin(): string {
  // Creates tests/eval/bin/d-scribe pointing to cli/dist/index.js so the
  // Agent SDK session uses the local build (not the published npm version).
  mkdirSync(EVAL_BIN_DIR, { recursive: true });
  const binPath = join(EVAL_BIN_DIR, "d-scribe");
  if (existsSync(binPath)) rmSync(binPath);
  if (!existsSync(CLI_ENTRY)) {
    throw new Error(`CLI entry not found at ${CLI_ENTRY} — did the build succeed?`);
  }
  symlinkSync(CLI_ENTRY, binPath);
  chmodSync(CLI_ENTRY, 0o755);
  console.log(`Local bin: ${binPath} -> ${CLI_ENTRY}\n`);
  return EVAL_BIN_DIR;
}

function verifyLocalBin(localBinDir: string): void {
  // Sanity check: `d-scribe --version` resolves to the local build.
  const pathWithBin = `${localBinDir}:${process.env.PATH}`;
  const version = execFileSync("d-scribe", ["--version"], {
    env: { ...process.env, PATH: pathWithBin },
    encoding: "utf-8",
  }).trim();
  const pkgJson = JSON.parse(readFileSync(join(CLI_DIR, "package.json"), "utf-8"));
  const expected = pkgJson.version as string;
  if (!version.includes(expected)) {
    throw new Error(
      `Local bin check failed: got '${version}', expected version '${expected}'. ` +
        `The agent may use a different build than intended.`,
    );
  }
  console.log(`Verified d-scribe version: ${version}\n`);
}

function findProjectDir(runDir: string): string | null {
  if (existsSync(join(runDir, "docker-compose.yml"))) return runDir;

  if (!existsSync(runDir)) return null;
  for (const entry of readdirSync(runDir, { withFileTypes: true })) {
    if (
      entry.isDirectory() &&
      existsSync(join(runDir, entry.name, "docker-compose.yml"))
    ) {
      return join(runDir, entry.name);
    }
  }
  return null;
}

function setupSigintHandler(runDir: string, getRumApp: () => RumApp | null): void {
  process.on("SIGINT", () => {
    console.warn("\n\nInterrupted. Attempting cleanup...");
    const projectDir = findProjectDir(runDir);
    if (projectDir && existsSync(join(projectDir, "docker-compose.yml"))) {
      try {
        execFileSync("docker", ["compose", "down"], { cwd: projectDir, stdio: "inherit" });
      } catch {
        console.warn("docker compose down failed during interrupt cleanup");
      }
    }
    const app = getRumApp();
    if (app) {
      console.warn(
        `RUM app ${app.id} (applicationId=${app.applicationId}) was NOT deleted. ` +
          `Delete it manually via the Datadog UI or API.`,
      );
    }
    process.exit(130);
  });
}

async function main(): Promise<void> {
  checkEnvVars();

  // Build CLI
  buildCli();

  // Set up local d-scribe binary so the agent uses this build, not npm's
  const localBinDir = setupLocalBin();
  verifyLocalBin(localBinDir);

  // Keep MAX_RUNS - 1 before creating the new run dir, so total on disk == MAX_RUNS after createRunDir.
  pruneOldRuns(EVAL_OUT_DIR, MAX_RUNS - 1);

  // Create run directory
  const runDir = createRunDir(EVAL_OUT_DIR);
  console.log(`Run directory: ${runDir}\n`);

  // Create RUM app
  let rumApp: RumApp | null = null;
  try {
    console.log("Creating RUM application...");
    rumApp = await createRumApp(`d-scribe-eval-${Date.now()}`);
    console.log(`RUM app created: ${rumApp.applicationId}\n`);

    // Set env vars for the provider
    process.env.EVAL_RUN_DIR = runDir;
    process.env.EVAL_RUM_APP_ID = rumApp.applicationId;
    process.env.EVAL_RUM_CLIENT_TOKEN = rumApp.clientToken;

    // Prepend local bin to PATH so Agent SDK sessions find the local d-scribe
    const evalPath = `${localBinDir}:${process.env.PATH}`;

    // Register SIGINT handler before the long-running promptfoo eval call so
    // Ctrl+C tears down containers and warns about the RUM app.
    setupSigintHandler(runDir, () => rumApp);

    // Run promptfoo eval
    console.log("Running eval...\n");
    execFileSync("npx", ["promptfoo", "eval", "--no-cache"], {
      cwd: __dirname,
      stdio: "inherit",
      env: { ...process.env, PATH: evalPath },
    });

    console.log("\nEval complete. Run `npm run eval:view` to inspect results.");
  } finally {
    // Cleanup: Docker compose down
    const projectDir = findProjectDir(runDir);
    if (projectDir && existsSync(join(projectDir, "docker-compose.yml"))) {
      console.log("\nStopping containers...");
      try {
        execFileSync("docker", ["compose", "down"], {
          cwd: projectDir,
          stdio: "inherit",
        });
      } catch {
        console.warn(
          "Warning: docker compose down failed (containers may not have started)",
        );
      }
    }

    // Cleanup: Delete RUM app
    if (rumApp) {
      console.log("Deleting RUM application...");
      try {
        await deleteRumApp(rumApp.id);
        console.log("RUM app deleted.");
      } catch (err) {
        console.warn(`Warning: failed to delete RUM app ${rumApp.id}:`, err);
      }
    }
  }
}

main().catch((err) => {
  console.error("\nEval failed:", err);
  process.exit(1);
});
