import psycopg2
import os
from django.http import JsonResponse

# Pattern: Code Security — SQL injection via string format
# WARNING: intentionally vulnerable for IAST demo
# Adapt: replace table/column with domain entity
DB_URL = os.environ.get("DATABASE_URL", "postgresql://demo:demo@postgresql:5432/demo")


def search(request):
    q = request.GET.get("q", "")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM items WHERE name LIKE '%{q}%'")  # noqa: S608
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return JsonResponse(rows, safe=False)
