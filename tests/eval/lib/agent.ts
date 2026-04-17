// tests/eval/lib/agent.ts
import { query, type SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";

export interface AgentRunOptions {
  prompt: string;
  model: string;
  allowedTools: string[];
  cwd: string;
  maxTurns?: number;
}

export interface AgentRunResult {
  success: boolean;
  output: string;
  cost: number;
  turns: number;
  error?: string;
}

export async function runAgent(options: AgentRunOptions): Promise<AgentRunResult> {
  const q = query({
    prompt: options.prompt,
    options: {
      model: options.model,
      allowedTools: options.allowedTools,
      permissionMode: "dontAsk",
      cwd: options.cwd,
      maxTurns: options.maxTurns ?? 100,
    },
  });

  let resultMsg: SDKResultMessage | null = null;

  for await (const message of q) {
    if (message.type === "result") {
      resultMsg = message;
      break;
    }
  }

  if (!resultMsg) {
    return {
      success: false,
      output: "",
      cost: 0,
      turns: 0,
      error: "No result message received",
    };
  }

  if (resultMsg.subtype === "success") {
    return {
      success: true,
      output: resultMsg.result,
      cost: resultMsg.total_cost_usd,
      turns: resultMsg.num_turns,
    };
  }

  return {
    success: false,
    output: "",
    cost: resultMsg.total_cost_usd,
    turns: resultMsg.num_turns,
    error: resultMsg.errors.join("; "),
  };
}
