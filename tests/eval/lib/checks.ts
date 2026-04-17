import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

export interface ServiceCheckResult {
  name: string;
  sourceFileCount: number;
  hasEndpoints: boolean;
  hasInterServiceCalls: boolean;
  hasDbModels: boolean;
}

export interface ScaffoldCheckResult {
  pass: boolean;
  services: ServiceCheckResult[];
  summary: string;
}

// Endpoint patterns extract the path as capture group 1
const ENDPOINT_PATH_PATTERNS = [
  // Java Spring: @GetMapping("/path") or @PostMapping("/path") etc.
  /@(?:Get|Post|Put|Delete|Patch)Mapping\s*\(\s*["']([^"']+)["']/g,
  // Java Spring: @GetMapping(value = "/path") or @GetMapping(path = "/path")
  /@(?:Get|Post|Put|Delete|Patch)Mapping\s*\(\s*(?:value|path)\s*=\s*["']([^"']+)["']/g,
  // Java Spring: @RequestMapping(value = "/path") or @RequestMapping(path = "/path")
  /@RequestMapping\s*\([^)]*(?:value|path)\s*=\s*["']([^"']+)["']/g,
  // Python Flask/FastAPI: @app.route("/path") or @router.get("/path") etc.
  /@(?:app|router)\.(?:get|post|put|delete|route)\s*\(\s*["']([^"']+)["']/g,
  // Node Express/Koa: router.get('/path') or app.post('/path') etc.
  /(?:router|app)\.(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
];

const INTER_SERVICE_PATTERNS = [
  /RestTemplate|WebClient|HttpClient/,
  /\.getForObject|\.exchange|\.retrieve/,
  /requests\.(get|post|put|delete)|httpx\.|aiohttp/,
  /fetch\s*\(\s*['"`]http/,
  /axios\.(get|post|put|delete)/,
];

const DB_MODEL_PATTERNS = [
  /@Entity|@Table|@Column/,
  /db\.Model|Base\)|models\.Model/,
  /__tablename__/,
  /@Entity\(\)|Schema\(\{|sequelize\.define/,
];

const SOURCE_EXTENSIONS = new Set([".java", ".py", ".ts", ".js", ".kt", ".go"]);

function walkDir(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

function extractEndpointPaths(content: string): string[] {
  const paths: string[] = [];
  for (const pattern of ENDPOINT_PATH_PATTERNS) {
    // Reset lastIndex since we reuse global patterns
    pattern.lastIndex = 0;
    for (const m of content.matchAll(pattern)) {
      paths.push(m[1]);
    }
  }
  return paths;
}

function isNonHealthPath(path: string): boolean {
  const normalized = path.replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized !== "health";
}

function matchesAnyPattern(content: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(content));
}

function checkService(serviceDir: string, name: string): ServiceCheckResult {
  const files = walkDir(serviceDir);
  const sourceFiles = files.filter((f) => SOURCE_EXTENSIONS.has(extname(f)));

  let hasEndpoints = false;
  let hasInterServiceCalls = false;
  let hasDbModels = false;

  for (const file of sourceFiles) {
    const content = readFileSync(file, "utf-8");

    if (!hasEndpoints) {
      const paths = extractEndpointPaths(content);
      if (paths.some(isNonHealthPath)) hasEndpoints = true;
    }

    if (!hasInterServiceCalls && matchesAnyPattern(content, INTER_SERVICE_PATTERNS))
      hasInterServiceCalls = true;
    if (!hasDbModels && matchesAnyPattern(content, DB_MODEL_PATTERNS)) hasDbModels = true;
  }

  return { name, sourceFileCount: sourceFiles.length, hasEndpoints, hasInterServiceCalls, hasDbModels };
}

export function checkScaffoldOutput(projectDir: string): ScaffoldCheckResult {
  const servicesDir = join(projectDir, "services");
  if (!existsSync(servicesDir)) {
    return { pass: false, services: [], summary: "No services/ directory found" };
  }

  const serviceDirs = readdirSync(servicesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const services = serviceDirs.map((name) => checkService(join(servicesDir, name), name));

  const withEndpoints = services.filter((s) => s.hasEndpoints);
  const withCalls = services.filter((s) => s.hasInterServiceCalls);
  const withModels = services.filter((s) => s.hasDbModels);

  const pass = services.length > 0 && withEndpoints.length === services.length;

  const lines = services.map((s) => {
    const flags = [
      s.hasEndpoints ? "endpoints" : "NO endpoints",
      s.hasInterServiceCalls ? "inter-service calls" : null,
      s.hasDbModels ? "DB models" : null,
    ].filter(Boolean);
    const status = s.hasEndpoints ? "[PASS]" : "[FAIL]";
    return `${status} ${s.name}: ${s.sourceFileCount} source files, ${flags.join(", ")}`;
  });

  const summary = [
    "## Scaffold Checks",
    "",
    ...lines,
    "",
    `${withEndpoints.length}/${services.length} services have endpoints`,
    `${withCalls.length}/${services.length} services have inter-service calls`,
    `${withModels.length}/${services.length} services have DB models`,
    "",
    `Result: ${pass ? "PASS" : "FAIL"}`,
  ].join("\n");

  return { pass, services, summary };
}
