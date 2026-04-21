const { Pool } = require('pg');
const { OpenAI } = require('openai');
const { trace, SpanKind } = require('@opentelemetry/api');

// Pattern: LLM Obs via OTel GenAI semconv — RAG chat
// Adapt: replace system prompt and retrieval logic with domain context
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://demo:demo@postgresql:5432/demo' });
const oai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const tracer = trace.getTracer('rag-chat', '1.0.0');

async function embedQuery(text) {
  return tracer.startActiveSpan('embeddings.openai', { kind: SpanKind.CLIENT, attributes: {
    'gen_ai.system': 'openai',
    'gen_ai.operation.name': 'embeddings',
    'gen_ai.request.model': 'text-embedding-3-small',
  } }, async (span) => {
    try {
      const resp = await oai.embeddings.create({ model: 'text-embedding-3-small', input: [text] });
      span.setAttribute('gen_ai.usage.input_tokens', resp.usage?.prompt_tokens ?? 0);
      return resp.data[0].embedding;
    } finally {
      span.end();
    }
  });
}

async function searchDocs(queryVec) {
  return tracer.startActiveSpan('retrieval.pgvector', { kind: SpanKind.CLIENT }, async (span) => {
    try {
      const vecStr = JSON.stringify(queryVec);
      const { rows } = await pool.query(
        'SELECT title, content, 1 - (embedding <=> $1::vector) AS score FROM documents ORDER BY embedding <=> $1::vector LIMIT 3',
        [vecStr],
      );
      return rows.map(r => ({ title: r.title, content: r.content, score: parseFloat(r.score) }));
    } finally {
      span.end();
    }
  });
}

async function generate(messages) {
  return tracer.startActiveSpan('chat.openai', { kind: SpanKind.CLIENT, attributes: {
    'gen_ai.system': 'openai',
    'gen_ai.operation.name': 'chat',
    'gen_ai.request.model': 'gpt-4o-mini',
  } }, async (span) => {
    try {
      const resp = await oai.chat.completions.create({ model: 'gpt-4o-mini', messages });
      span.setAttribute('gen_ai.usage.input_tokens', resp.usage?.prompt_tokens ?? 0);
      span.setAttribute('gen_ai.usage.output_tokens', resp.usage?.completion_tokens ?? 0);
      return resp.choices[0].message.content;
    } finally {
      span.end();
    }
  });
}

async function chat(req, res) {
  await tracer.startActiveSpan('rag.chat', { kind: SpanKind.INTERNAL }, async (span) => {
    try {
      const { message, history = [] } = req.body;
      const queryVec = await embedQuery(message);
      const sources = await searchDocs(queryVec);
      const context = sources.map(s => `[${s.title}]: ${s.content}`).join('\n\n');
      const messages = [
        { role: 'system', content: `Answer using this context:\n${context}` },
        ...history,
        { role: 'user', content: message },
      ];
      const answer = await generate(messages);
      res.json({ response: answer, sources: sources.map(s => ({ title: s.title, score: s.score })) });
    } finally {
      span.end();
    }
  });
}

module.exports = { chat };
