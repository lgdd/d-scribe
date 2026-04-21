// tests/eval/providers/d-scribe-eval.ts
import type {
  ApiProvider,
  ProviderOptions,
  ProviderResponse,
  CallApiContextParams,
} from "promptfoo";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runAgent } from "../lib/agent.js";
import { checkScaffoldOutput } from "../lib/checks.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_SKILLS_DIR = resolve(__dirname, "../../../skills");

const SCAFFOLD_MODEL = "claude-sonnet-4-6";
const VALIDATION_MODEL = "claude-haiku-4-5-20251001";

/**
 * Promptfoo provider orchestrating three sequential eval phases:
 * scaffold (Sonnet) → preflight (Haiku) → telemetry (Haiku).
 *
 * State (projectDir, previousPhasePassed) persists across callApi invocations
 * because promptfoo instantiates the provider once per eval run. This assumes
 * test cases execute in order in promptfooconfig.yaml — rearranging them will
 * break phase gating.
 */
export default class DScribeEvalProvider implements ApiProvider {
  private projectDir: string;
  private previousPhasePassed: boolean;
  private providerConfig: Record<string, unknown>;

  constructor(options: ProviderOptions) {
    this.providerConfig = options.config || {};
    const runDir = process.env.EVAL_RUN_DIR;
    if (!runDir) {
      throw new Error("EVAL_RUN_DIR must be set before instantiating DScribeEvalProvider");
    }
    this.projectDir = runDir;
    this.previousPhasePassed = true;
  }

  id(): string {
    return "d-scribe-eval";
  }

  async callApi(
    prompt: string,
    context?: CallApiContextParams,
  ): Promise<ProviderResponse> {
    const phase = (context?.vars?.phase as string) || prompt;

    switch (phase) {
      case "scaffold":
        return this.runScaffold(context?.vars as Record<string, string>);
      case "preflight":
        return this.runPreflight();
      case "telemetry":
        return this.runTelemetry();
      default:
        return { output: `Unknown phase: ${phase}` };
    }
  }

  private async runScaffold(
    vars: Record<string, string>,
  ): Promise<ProviderResponse> {
    const skillPath = join(REPO_SKILLS_DIR, "dd-scaffold-demo", "SKILL.md");
    const prompt = [
      `Read ${skillPath} and follow its instructions end-to-end to create the demo.`,
      "",
      "Skip every ask_user / clarifying-question step — use these inputs directly:",
      `- Domain: ${vars.domain || "e-commerce"}`,
      `- Backends: ${vars.backends || "java:spring,python:flask,node:express"}`,
      `- Services: ${vars.services || "4"}`,
      `- Features: ${vars.features || "infra,apm,logs,dbm:postgresql,rum"}`,
      `- Deploy target: ${vars.deploy || "compose:local"}`,
      `- Frontend: ${vars.frontend || "react:vite"}`,
      ...(vars.instrumentation ? [`- Instrumentation: ${vars.instrumentation}`] : []),
      "- Create the project in the current directory (cwd)",
      "Accept all defaults for anything not specified above. Do not stop at the plan gate (Step 8) — proceed directly to execution.",
      "",
      "When the skill tells you to read other skills under `skills/<name>/SKILL.md`, those are populated",
      "into your cwd by Step 9 (the `d-scribe init demo` CLI command copies them). Resolve those relative",
      "paths against cwd, not against the absolute path above.",
      "",
      "IMPORTANT: The `d-scribe` command is already on PATH and points to a local build under test.",
      "Use the bare `d-scribe` command directly. Do NOT use `npx d-scribe` or `npx @lgdd/d-scribe` —",
      "those would pull the published version instead of the local build.",
    ].join("\n");

    const result = await runAgent({
      prompt,
      model: (this.providerConfig.scaffoldModel as string) || SCAFFOLD_MODEL,
      allowedTools: ["Bash", "Read", "Write", "Edit", "Glob", "Grep"],
      cwd: this.projectDir,
      maxTurns: 120,
    });

    if (!result.success) {
      this.previousPhasePassed = false;
      return {
        output: `Scaffold FAILED (${result.turns} turns, $${result.cost.toFixed(2)})\n\n${result.error}`,
        cost: result.cost,
      };
    }

    // Inject RUM credentials into .env
    this.injectRumCredentials();

    // Run scaffold checks
    const checks = checkScaffoldOutput(this.projectDir);
    this.previousPhasePassed = checks.pass;

    return {
      output: [
        `Scaffold completed (${result.turns} turns, $${result.cost.toFixed(2)})`,
        "",
        checks.summary,
      ].join("\n"),
      cost: result.cost,
    };
  }

  private async runPreflight(): Promise<ProviderResponse> {
    if (!this.previousPhasePassed) {
      return { output: "[SKIP] Preflight skipped — scaffold failed" };
    }

    const result = await runAgent({
      prompt:
        "Read skills/dd-check-preflight/SKILL.md (relative to your cwd) and follow its instructions end-to-end on this project. Skip any ask_user steps.",
      model: (this.providerConfig.validationModel as string) || VALIDATION_MODEL,
      allowedTools: ["Bash", "Read", "Glob"],
      cwd: this.projectDir,
      maxTurns: 40,
    });

    if (!result.success) {
      this.previousPhasePassed = false;
      return {
        output: `Preflight FAILED (${result.turns} turns, $${result.cost.toFixed(2)})\n\n${result.error}`,
        cost: result.cost,
      };
    }

    this.previousPhasePassed = !result.output.includes("[FAIL]");

    return {
      output: `Preflight completed ($${result.cost.toFixed(2)})\n\n${result.output}`,
      cost: result.cost,
    };
  }

  private async runTelemetry(): Promise<ProviderResponse> {
    if (!this.previousPhasePassed) {
      return { output: "[SKIP] Telemetry skipped — preflight failed" };
    }

    const result = await runAgent({
      prompt:
        "Read skills/dd-check-telemetry/SKILL.md (relative to your cwd) and follow its instructions end-to-end on this project. Skip any ask_user steps.",
      model: (this.providerConfig.validationModel as string) || VALIDATION_MODEL,
      allowedTools: ["Read", "Glob"],
      cwd: this.projectDir,
      maxTurns: 30,
    });

    if (!result.success) {
      return {
        output: `Telemetry FAILED (${result.turns} turns, $${result.cost.toFixed(2)})\n\n${result.error}`,
        cost: result.cost,
      };
    }

    return {
      output: `Telemetry completed ($${result.cost.toFixed(2)})\n\n${result.output}`,
      cost: result.cost,
    };
  }

  private injectRumCredentials(): void {
    const envPath = join(this.projectDir, ".env");
    if (!existsSync(envPath)) return;

    const appId = process.env.EVAL_RUM_APP_ID;
    const clientToken = process.env.EVAL_RUM_CLIENT_TOKEN;
    if (!appId || !clientToken) return;

    let content = readFileSync(envPath, "utf-8");
    content = content.replace(
      /DD_RUM_APPLICATION_ID=.*/,
      `DD_RUM_APPLICATION_ID=${appId}`,
    );
    content = content.replace(
      /DD_RUM_CLIENT_TOKEN=.*/,
      `DD_RUM_CLIENT_TOKEN=${clientToken}`,
    );
    writeFileSync(envPath, content);
  }
}
