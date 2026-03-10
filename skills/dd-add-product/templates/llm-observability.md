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
const tracer = require('dd-trace').init({
  llmobs: {
    mlApp: '<your-ml-app-name>',
  },
});
const { llmobs } = tracer;
```

Supported integrations: `openai`, `langchain`.

### Java (dd-trace-java)

LLM Observability for Java requires `dd-trace-java` v1.51.0+ with OpenAI support. Enable via environment variable:

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

## Custom Instrumentation (Required for Execution Graph)

Auto-instrumentation alone creates flat, single-level LLM spans. The execution graph, flame graph, and span detail panel require a **nested span hierarchy** — a root span (workflow or agent) wrapping child spans (task, tool, retrieval, LLM). Without this nesting Datadog only shows basic LLM inference monitoring.

### Span Kinds

| Kind | Purpose | Can Be Root? |
|---|---|---|
| **workflow** | Static sequence of operations (e.g., RAG pipeline) | Yes |
| **agent** | Autonomous decision loop (e.g., ReAct agent) | Yes |
| **llm** | Direct call to a language model | Yes |
| **tool** | External service call with LLM-generated args | No |
| **task** | Standalone processing step (no external call) | No |
| **embedding** | Call returning an embedding vector | No |
| **retrieval** | Vector/knowledge-base lookup | No |

### Python — Decorators

```python
from ddtrace.llmobs import LLMObs
from ddtrace.llmobs.decorators import workflow, task, tool, retrieval, llm

@workflow
def answer_question(user_question):
    context = retrieve_docs(user_question)
    return generate_answer(user_question, context)

@retrieval
def retrieve_docs(question):
    docs = vector_store.similarity_search(question)
    LLMObs.annotate(
        input_data=question,
        output_data=[{"text": d.text, "name": d.name, "id": d.id, "score": d.score} for d in docs],
    )
    return docs

@task
def build_prompt(question, context):
    return f"Answer based on context:\n{context}\n\nQuestion: {question}"

@llm(model_name="gpt-4o", model_provider="openai")
def generate_answer(question, context):
    prompt = build_prompt(question, context)
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content
```

### Python — Context Managers (alternative)

```python
from ddtrace.llmobs import LLMObs

def answer_question(user_question):
    with LLMObs.workflow(name="answer_question"):
        with LLMObs.retrieval(name="retrieve_docs"):
            docs = vector_store.similarity_search(user_question)
            LLMObs.annotate(input_data=user_question, output_data=[...])
        with LLMObs.task(name="build_prompt"):
            prompt = f"..."
        with LLMObs.llm(model_name="gpt-4o", model_provider="openai"):
            response = openai_client.chat.completions.create(...)
        return response.choices[0].message.content
```

### Node.js — Wrap

```javascript
const { llmobs } = require('dd-trace').init({ llmobs: { mlApp: '<app>' } });

function retrieveDocs(question) {
  const docs = vectorStore.similaritySearch(question);
  llmobs.annotate({
    inputData: question,
    outputData: docs.map(d => ({ text: d.text, name: d.name, id: d.id, score: d.score })),
  });
  return docs;
}
retrieveDocs = llmobs.wrap({ kind: 'retrieval' }, retrieveDocs);

function buildPrompt(question, context) { /* ... */ }
buildPrompt = llmobs.wrap({ kind: 'task' }, buildPrompt);

function generateAnswer(question, context) {
  const prompt = buildPrompt(question, context);
  return openai.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }] });
}
generateAnswer = llmobs.wrap({ kind: 'llm', modelName: 'gpt-4o', modelProvider: 'openai' }, generateAnswer);

function answerQuestion(question) {
  const docs = retrieveDocs(question);
  return generateAnswer(question, docs);
}
answerQuestion = llmobs.wrap({ kind: 'workflow' }, answerQuestion);
```

### Java — Span API

```java
import datadog.trace.api.llmobs.LLMObs;
import datadog.trace.api.llmobs.LLMObsSpan;

public String answerQuestion(String question) {
    LLMObsSpan workflowSpan = LLMObs.startWorkflowSpan("answer_question", null, null);
    try {
        LLMObsSpan retrievalSpan = LLMObs.startRetrievalSpan("retrieve_docs", null, null);
        List<Doc> docs = vectorStore.similaritySearch(question);
        retrievalSpan.finish();

        LLMObsSpan taskSpan = LLMObs.startTaskSpan("build_prompt", null, null);
        String prompt = buildPrompt(question, docs);
        taskSpan.finish();

        LLMObsSpan llmSpan = LLMObs.startLLMSpan("generate_answer", "gpt-4o", "openai", null, null);
        String answer = callLlm(prompt);
        llmSpan.finish();

        return answer;
    } finally {
        workflowSpan.finish();
    }
}
```

### Annotating Inputs and Outputs

Annotate spans to populate the detail panel with visible I/O:

```python
from ddtrace.llmobs import LLMObs

@workflow
def answer_question(user_question):
    result = do_work(user_question)
    LLMObs.annotate(
        input_data=user_question,
        output_data=result,
        metadata={"source": "knowledge_base"},
        metrics={"input_tokens": 150, "output_tokens": 80, "total_tokens": 230},
    )
    return result
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
- [SDK Instrumentation](https://docs.datadoghq.com/llm_observability/setup/sdk/)
- [Auto-instrumentation](https://docs.datadoghq.com/llm_observability/setup/auto_instrumentation/)
- [Terms and Concepts (Span Kinds)](https://docs.datadoghq.com/llm_observability/terms/)
