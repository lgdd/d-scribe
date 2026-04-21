import os
from flask import Blueprint, jsonify
from openai import OpenAI
from opentelemetry import trace
import psycopg2

# Pattern: seed documents into pgvector with OTel spans
# Adapt: replace seed corpus with domain content

bp = Blueprint("rag_seed", __name__)
tracer = trace.get_tracer("rag-seed", "1.0.0")
oai = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

DOCS = [
    {"title": "Sample A", "content": "Replace this with real domain content."},
    {"title": "Sample B", "content": "Replace this with real domain content."},
]


@bp.route("/seed", methods=["POST"])
def seed():
    with tracer.start_as_current_span("rag.seed"):
        conn = psycopg2.connect(os.environ.get("DATABASE_URL", "postgresql://demo:demo@postgresql:5432/demo"))
        cur = conn.cursor()
        for doc in DOCS:
            with tracer.start_as_current_span(
                "embeddings.openai",
                attributes={"gen_ai.system": "openai", "gen_ai.request.model": "text-embedding-3-small"},
            ):
                resp = oai.embeddings.create(model="text-embedding-3-small", input=[doc["content"]])
                embedding = resp.data[0].embedding
            cur.execute(
                "INSERT INTO documents (title, content, embedding) VALUES (%s, %s, %s::vector)",
                (doc["title"], doc["content"], embedding),
            )
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"seeded": len(DOCS)})
