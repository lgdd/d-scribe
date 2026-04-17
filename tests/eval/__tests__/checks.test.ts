import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { checkScaffoldOutput } from "../lib/checks.js";

describe("checkScaffoldOutput", () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = join(tmpdir(), `eval-checks-${Date.now()}`);
    mkdirSync(projectDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  function writeService(name: string, files: Record<string, string>) {
    const serviceDir = join(projectDir, "services", name);
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = join(serviceDir, filePath);
      mkdirSync(join(fullPath, ".."), { recursive: true });
      writeFileSync(fullPath, content);
    }
  }

  it("passes when services have endpoints, inter-service calls, and DB models", () => {
    writeService("order-service", {
      "src/main/java/com/example/controller/OrderController.java":
        '@RestController\npublic class OrderController {\n  @GetMapping("/orders")\n  public List<Order> list() {}\n}',
      "src/main/java/com/example/model/Order.java":
        "@Entity\n@Table(name = \"orders\")\npublic class Order {}",
      "src/main/java/com/example/client/UserClient.java":
        'RestTemplate restTemplate;\nrestTemplate.getForObject("http://user-service/users", String.class);',
      "pom.xml": "<project></project>",
      "Dockerfile": "FROM eclipse-temurin",
    });

    writeService("user-service", {
      "src/main/java/com/example/controller/UserController.java":
        '@RestController\npublic class UserController {\n  @PostMapping("/users")\n  public User create() {}\n}',
      "src/main/java/com/example/model/User.java":
        "@Entity\n@Table(name = \"users\")\npublic class User {}",
      "pom.xml": "<project></project>",
      "Dockerfile": "FROM eclipse-temurin",
    });

    writeService("product-service", {
      "app/routes/products.py":
        "@router.get('/products')\ndef list_products(): pass",
      "app/models/product.py":
        "class Product(db.Model):\n    __tablename__ = 'products'",
      "requirements.txt": "flask",
      "Dockerfile": "FROM python:3.12",
    });

    writeService("cart-service", {
      "src/routes/cart.ts":
        "router.get('/cart', async (req, res) => { res.json([]); });",
      "src/models/cart.ts":
        '@Entity()\nexport class Cart { @Column() userId: string; }',
      "src/clients/product.ts":
        "await fetch('http://product-service/products');",
      "package.json": "{}",
      "Dockerfile": "FROM node:20",
    });

    const result = checkScaffoldOutput(projectDir);

    expect(result.pass).toBe(true);
    expect(result.services).toHaveLength(4);
    for (const svc of result.services) {
      expect(svc.hasEndpoints).toBe(true);
    }
    expect(result.services.filter((s) => s.hasInterServiceCalls).length).toBeGreaterThanOrEqual(1);
    expect(result.services.filter((s) => s.hasDbModels).length).toBeGreaterThanOrEqual(1);
  });

  it("fails when services have no endpoints (only template files)", () => {
    writeService("order-service", {
      "pom.xml": "<project></project>",
      "Dockerfile": "FROM eclipse-temurin",
      "src/main/java/com/example/App.java":
        "public class App { public static void main(String[] args) {} }",
    });

    const result = checkScaffoldOutput(projectDir);

    expect(result.pass).toBe(false);
    expect(result.services[0].hasEndpoints).toBe(false);
  });

  it("reports per-service details in the summary", () => {
    writeService("api-gateway", {
      "src/main/java/com/example/controller/GatewayController.java":
        '@GetMapping("/health")\npublic String health() { return "ok"; }',
      "pom.xml": "<project></project>",
    });

    const result = checkScaffoldOutput(projectDir);

    expect(result.services).toHaveLength(1);
    expect(result.services[0].name).toBe("api-gateway");
    expect(result.services[0].hasEndpoints).toBe(false);
    expect(result.services[0].hasDbModels).toBe(false);
    expect(result.summary).toContain("api-gateway");
  });

  it("fails when no services directory exists", () => {
    const result = checkScaffoldOutput(projectDir);

    expect(result.pass).toBe(false);
    expect(result.summary).toContain("No services/ directory found");
  });

  it("fails when services only contain the template /health endpoint (no real AI code)", () => {
    writeService("order-service", {
      "src/main/java/com/example/service/HealthController.java":
        '@RestController\npublic class HealthController {\n  @GetMapping("/health")\n  public String health() { return "ok"; }\n}',
      "pom.xml": "<project></project>",
    });

    writeService("user-service", {
      "app.py": '@app.route("/health")\ndef health(): return "ok"',
      "requirements.txt": "flask",
    });

    const result = checkScaffoldOutput(projectDir);
    expect(result.pass).toBe(false);
    for (const svc of result.services) {
      expect(svc.hasEndpoints).toBe(false);
    }
  });
});
