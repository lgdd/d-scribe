# LLM Observability

## Prerequisites

- An application service that calls an LLM provider (OpenAI, Anthropic, AWS Bedrock, or via LangChain)
- The service must already be instrumented with the Datadog tracer (`ddtrace` for Python, `dd-trace` for Node.js, `dd-trace-java` for Java)

## Agent Configuration

No special Agent changes required — LLM Observability data flows through the standard APM pipeline. Ensure `DD_APM_ENABLED=true` is set (default).

## Application Changes

### Python (ddtrace)

```python
from ddtrace.llmobs import LLMObs

LLMObs.enable(
    ml_app="<your-ml-app-name>",
    agentless_enabled=False,
)
```

Supported integrations (auto-instrumented when `LLMObs` is enabled):
- `openai`
- `anthropic`
- `boto3` (Bedrock)
- `langchain`

### Node.js (dd-trace)

```javascript
const tracer = require('dd-trace').init();
const { llmobs } = tracer;

llmobs.enable({
  mlApp: '<your-ml-app-name>',
});
```

Supported integrations: `openai`, `langchain`.

### Java (dd-trace-java)

LLM Observability for Java requires `dd-trace-java` v1.34.0+ with OpenAI support. Enable via environment variable:

```yaml
environment:
  - DD_LLMOBS_ENABLED=true
  - DD_LLMOBS_ML_APP=<your-ml-app-name>
```

### Environment Variables

Add to the LLM service:

```yaml
environment:
  - DD_LLMOBS_ENABLED=true
  - DD_LLMOBS_ML_APP=<your-ml-app-name>
  - DD_LLMOBS_AGENTLESS_ENABLED=false
```

Add to `.env.example`:

```bash
# LLM Provider
OPENAI_API_KEY=<your-openai-api-key>
# Or for Anthropic:
# ANTHROPIC_API_KEY=<your-anthropic-api-key>
# Or for Bedrock: use AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
```

## Deployment Config

The LLM provider is an external API — no additional container needed. The LLM service container just needs network access to the provider and to the Agent:

```yaml
services:
  llm-service:
    environment:
      - DD_AGENT_HOST=datadog-agent
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      datadog-agent:
        condition: service_healthy
```

## Cross-Product Wiring

- **APM**: LLM spans appear alongside HTTP and database spans in distributed traces
- **Log Management**: LLM call logs (input/output, token counts) are correlated to traces via `dd.trace_id`
- **Profiler**: Code-level profiling of LLM call overhead when `DD_PROFILING_ENABLED=true`

## Failure Scenarios

| Scenario | Datadog Signal |
|---|---|
| LLM provider rate-limited (429) | Error spans in LLM Obs traces, error tracking |
| LLM provider timeout | Long-duration LLM span, cascading latency in APM |
| Token budget exceeded | LLM Obs shows token usage spike, application error |
| Hallucination / unexpected output | Visible in LLM Obs trace input/output comparison |

## References

- [LLM Observability Setup](https://docs.datadoghq.com/llm_observability/setup/)
- [Python SDK](https://docs.datadoghq.com/llm_observability/setup/sdk/python/)
- [Node.js SDK](https://docs.datadoghq.com/llm_observability/setup/sdk/nodejs/)
