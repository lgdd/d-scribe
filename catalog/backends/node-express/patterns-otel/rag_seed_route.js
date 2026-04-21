const { Pool } = require('pg');
const { OpenAI } = require('openai');
const { trace, SpanKind } = require('@opentelemetry/api');

// Pattern: embed documents and seed into pgvector using OTel spans
// Adapt: replace seed corpus with domain content
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://demo:demo@postgresql:5432/demo' });
const oai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const tracer = trace.getTracer('rag-seed', '1.0.0');

const DOCS = [
  { title: 'Sample A', content: 'Replace this with real domain content.' },
  { title: 'Sample B', content: 'Replace this with real domain content.' },
];

async function seed(req, res) {
  await tracer.startActiveSpan('rag.seed', { kind: SpanKind.INTERNAL }, async (span) => {
    try {
      for (const doc of DOCS) {
        const { embedding } = await tracer.startActiveSpan('embeddings.openai', {
          kind: SpanKind.CLIENT,
          attributes: { 'gen_ai.system': 'openai', 'gen_ai.request.model': 'text-embedding-3-small' },
        }, async (s) => {
          try {
            const resp = await oai.embeddings.create({ model: 'text-embedding-3-small', input: [doc.content] });
            return { embedding: resp.data[0].embedding };
          } finally {
            s.end();
          }
        });
        await pool.query('INSERT INTO documents (title, content, embedding) VALUES ($1, $2, $3::vector)',
          [doc.title, doc.content, JSON.stringify(embedding)]);
      }
      res.json({ seeded: DOCS.length });
    } finally {
      span.end();
    }
  });
}

module.exports = { seed };
