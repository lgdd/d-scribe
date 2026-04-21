import os
from flask import Blueprint, jsonify, request
from openai import OpenAI
from opentelemetry import trace
import psycopg2

# Pattern: LLM Obs via OTel GenAI semconv — RAG chat
# Adapt: replace system prompt and retrieval logic with domain context

bp = Blueprint("rag_chat", __name__)
tracer = trace.get_tracer("rag-chat", "1.0.0")
oai = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def _embed(text: str):
    with tracer.start_as_current_span(
        "embeddings.openai",
        attributes={
            "gen_ai.system": "openai",
            "gen_ai.operation.name": "embeddings",
            "gen_ai.request.model": "text-embedding-3-small",
        },
    ) as span:
        resp = oai.embeddings.create(model="text-embedding-3-small", input=[text])
        span.set_attribute("gen_ai.usage.input_tokens", getattr(resp.usage, "prompt_tokens", 0))
        return resp.data[0].embedding


def _search(vec):
    with tracer.start_as_current_span("retrieval.pgvector"):
        conn = psycopg2.connect(os.environ.get("DATABASE_URL", "postgresql://demo:demo@postgresql:5432/demo"))
        cur = conn.cursor()
        cur.execute(
            "SELECT title, content, 1 - (embedding <=> %s::vector) AS score "
            "FROM documents ORDER BY embedding <=> %s::vector LIMIT 3",
            (vec, vec),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [{"title": r[0], "content": r[1], "score": float(r[2])} for r in rows]


def _generate(messages):
    with tracer.start_as_current_span(
        "chat.openai",
        attributes={
            "gen_ai.system": "openai",
            "gen_ai.operation.name": "chat",
            "gen_ai.request.model": "gpt-4o-mini",
        },
    ) as span:
        resp = oai.chat.completions.create(model="gpt-4o-mini", messages=messages)
        span.set_attribute("gen_ai.usage.input_tokens", getattr(resp.usage, "prompt_tokens", 0))
        span.set_attribute("gen_ai.usage.output_tokens", getattr(resp.usage, "completion_tokens", 0))
        return resp.choices[0].message.content


@bp.route("/chat", methods=["POST"])
def chat():
    with tracer.start_as_current_span("rag.chat"):
        payload = request.get_json(force=True) or {}
        message = payload.get("message", "")
        history = payload.get("history", [])
        vec = _embed(message)
        sources = _search(vec)
        context = "\n\n".join(f"[{s['title']}]: {s['content']}" for s in sources)
        messages = [
            {"role": "system", "content": f"Answer using this context:\n{context}"},
            *history,
            {"role": "user", "content": message},
        ]
        answer = _generate(messages)
        return jsonify({
            "response": answer,
            "sources": [{"title": s["title"], "score": s["score"]} for s in sources],
        })
