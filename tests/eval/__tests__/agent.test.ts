import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Agent SDK before importing our module
const { mockQuery } = vi.hoisted(() => ({ mockQuery: vi.fn() }));
vi.mock("@anthropic-ai/claude-agent-sdk", () => ({
  query: mockQuery,
}));

import { runAgent } from "../lib/agent.js";

beforeEach(() => {
  mockQuery.mockReset();
});

function createMockQuery(resultMessage: Record<string, unknown>) {
  return {
    async *[Symbol.asyncIterator]() {
      yield resultMessage;
    },
    close: vi.fn(),
  };
}

describe("runAgent", () => {
  it("returns success result with output, cost, and turns", async () => {
    mockQuery.mockReturnValue(
      createMockQuery({
        type: "result",
        subtype: "success",
        result: "All done",
        total_cost_usd: 1.5,
        num_turns: 10,
        is_error: false,
      }),
    );

    const result = await runAgent({
      prompt: "do something",
      model: "claude-sonnet-4-6",
      allowedTools: ["Read"],
      cwd: "/tmp",
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe("All done");
    expect(result.cost).toBe(1.5);
    expect(result.turns).toBe(10);
    expect(result.error).toBeUndefined();
  });

  it("passes correct options to query()", async () => {
    mockQuery.mockReturnValue(
      createMockQuery({
        type: "result",
        subtype: "success",
        result: "",
        total_cost_usd: 0,
        num_turns: 1,
        is_error: false,
      }),
    );

    await runAgent({
      prompt: "test prompt",
      model: "claude-haiku-4-5-20251001",
      allowedTools: ["Bash", "Read"],
      cwd: "/some/dir",
      maxTurns: 50,
    });

    expect(mockQuery).toHaveBeenCalledWith({
      prompt: "test prompt",
      options: {
        model: "claude-haiku-4-5-20251001",
        allowedTools: ["Bash", "Read"],
        permissionMode: "dontAsk",
        cwd: "/some/dir",
        maxTurns: 50,
      },
    });
  });

  it("returns failure on error result", async () => {
    mockQuery.mockReturnValue(
      createMockQuery({
        type: "result",
        subtype: "error_during_execution",
        errors: ["Something broke"],
        total_cost_usd: 0.3,
        num_turns: 2,
        is_error: true,
      }),
    );

    const result = await runAgent({
      prompt: "do something",
      model: "claude-sonnet-4-6",
      allowedTools: [],
      cwd: "/tmp",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Something broke");
  });

  it("returns failure when no result message is received", async () => {
    mockQuery.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        // yields nothing
      },
      close: vi.fn(),
    });

    const result = await runAgent({
      prompt: "do something",
      model: "claude-sonnet-4-6",
      allowedTools: [],
      cwd: "/tmp",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("No result message received");
  });
});
