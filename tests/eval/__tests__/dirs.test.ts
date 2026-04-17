import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRunDir, pruneOldRuns } from "../lib/dirs.js";

describe("createRunDir", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = join(tmpdir(), `eval-test-${Date.now()}`);
    mkdirSync(baseDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("creates a timestamped directory inside the base dir", () => {
    const runDir = createRunDir(baseDir);
    expect(existsSync(runDir)).toBe(true);
    expect(runDir.startsWith(baseDir)).toBe(true);
  });

  it("creates unique directories on consecutive calls", () => {
    const dir1 = createRunDir(baseDir);
    const dir2 = createRunDir(baseDir);
    expect(dir1).not.toBe(dir2);
  });
});

describe("pruneOldRuns", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = join(tmpdir(), `eval-test-${Date.now()}`);
    mkdirSync(baseDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("keeps the 3 most recent directories and removes older ones", () => {
    const dirs = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"];
    for (const d of dirs) mkdirSync(join(baseDir, d));

    pruneOldRuns(baseDir, 3);

    const remaining = readdirSync(baseDir).sort();
    expect(remaining).toEqual(["2026-01-03", "2026-01-04", "2026-01-05"]);
  });

  it("does nothing when fewer than maxRuns directories exist", () => {
    mkdirSync(join(baseDir, "2026-01-01"));
    mkdirSync(join(baseDir, "2026-01-02"));

    pruneOldRuns(baseDir, 3);

    const remaining = readdirSync(baseDir);
    expect(remaining).toHaveLength(2);
  });

  it("does nothing when base directory does not exist", () => {
    expect(() => pruneOldRuns(join(baseDir, "nonexistent"), 3)).not.toThrow();
  });
});
