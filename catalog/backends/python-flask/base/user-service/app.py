import logging
import time
import threading

from flask import Flask, abort, jsonify, request
from pythonjsonlogger import jsonlogger

# --- JSON Logging Setup ---
logger = logging.getLogger()
handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
    rename_fields={"asctime": "timestamp", "levelname": "level"},
)
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# --- App Setup ---
app = Flask(__name__)

# In-memory storage
users = {}
_next_id = 1
_lock = threading.Lock()


def _gen_id():
    global _next_id
    with _lock:
        uid = str(_next_id)
        _next_id += 1
    return uid


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/users", methods=["GET"])
def list_users():
    return jsonify(list(users.values()))


@app.route("/api/users/<user_id>", methods=["GET"])
def get_user(user_id):
    user = users.get(user_id)
    if not user:
        return jsonify({"error": "not found"}), 404
    return jsonify(user)


@app.route("/api/users", methods=["POST"])
def create_user():
    body = request.get_json(force=True)
    name = body.get("name", "")

    # Magic value failures
    if "-fail-500" in name:
        abort(500, description="simulated 500 error")
    if "-fail-timeout" in name:
        time.sleep(30)

    uid = _gen_id()
    user = {"id": uid, "name": name, "email": body.get("email", "")}
    users[uid] = user
    logger.info("user created", extra={"userId": uid})
    return jsonify(user), 201


@app.route("/api/users/<user_id>", methods=["PUT"])
def update_user(user_id):
    if user_id not in users:
        return jsonify({"error": "not found"}), 404
    body = request.get_json(force=True)
    users[user_id].update({"name": body.get("name", users[user_id]["name"]), "email": body.get("email", users[user_id]["email"])})
    return jsonify(users[user_id])


@app.route("/api/users/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    if user_id not in users:
        return jsonify({"error": "not found"}), 404
    del users[user_id]
    return "", 204


# SQL injection simulation for Code Security demo (feature: security:code)
# WARNING: intentionally vulnerable — demonstrates IAST detection
@app.route("/api/users/search")
def search_users():
    q = request.args.get("q", "")
    # Simulated vulnerable query pattern
    results = [u for u in users.values() if q.lower() in u["name"].lower()]
    return jsonify(results)


# CPU-intensive stats for Profiling demo (feature: profiling)
@app.route("/api/users/stats")
def user_stats():
    total = 0
    for i in range(10000):
        for j in range(1000):
            total += i * j
    return jsonify({"count": len(users), "checksum": total})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8081)
