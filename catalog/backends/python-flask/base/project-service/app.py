import logging
import os
import time
import threading

import requests as http_client
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

SERVICE_USER_URL = os.environ.get("SERVICE_USER_URL", "http://user-service:8081")

# In-memory storage
projects = {}
_next_id = 1
_lock = threading.Lock()


def _gen_id():
    global _next_id
    with _lock:
        pid = str(_next_id)
        _next_id += 1
    return pid


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/projects", methods=["GET"])
def list_projects():
    return jsonify(list(projects.values()))


@app.route("/api/projects/<project_id>", methods=["GET"])
def get_project(project_id):
    project = projects.get(project_id)
    if not project:
        return jsonify({"error": "not found"}), 404
    return jsonify(project)


@app.route("/api/projects", methods=["POST"])
def create_project():
    body = request.get_json(force=True)
    title = body.get("title", "")

    # Magic value failures
    if "-fail-500" in title:
        abort(500, description="simulated 500 error")
    if "-fail-timeout" in title:
        time.sleep(30)

    # Validate userId by calling user-service
    user_id = body.get("userId", "")
    if user_id:
        try:
            resp = http_client.get(f"{SERVICE_USER_URL}/api/users/{user_id}", timeout=5)
            if resp.status_code == 404:
                return jsonify({"error": f"user {user_id} not found"}), 400
        except http_client.RequestException as e:
            logger.warning("failed to validate user", extra={"userId": user_id, "error": str(e)})

    pid = _gen_id()
    project = {
        "id": pid,
        "title": title,
        "description": body.get("description", ""),
        "userId": user_id,
    }
    projects[pid] = project
    logger.info("project created", extra={"projectId": pid})
    return jsonify(project), 201


@app.route("/api/projects/<project_id>", methods=["PUT"])
def update_project(project_id):
    if project_id not in projects:
        return jsonify({"error": "not found"}), 404
    body = request.get_json(force=True)
    p = projects[project_id]
    p.update({
        "title": body.get("title", p["title"]),
        "description": body.get("description", p["description"]),
        "userId": body.get("userId", p["userId"]),
    })
    return jsonify(p)


@app.route("/api/projects/<project_id>", methods=["DELETE"])
def delete_project(project_id):
    if project_id not in projects:
        return jsonify({"error": "not found"}), 404
    del projects[project_id]
    return "", 204


# SQL injection in search for Code Security demo
@app.route("/api/projects/search")
def search_projects():
    q = request.args.get("q", "")
    results = [p for p in projects.values() if q.lower() in p["title"].lower()]
    return jsonify(results)


# Slow query simulation for DBM demo
# Simulates N+1 query pattern with deliberate delay
@app.route("/api/projects/<project_id>/details")
def project_details(project_id):
    project = projects.get(project_id)
    if not project:
        return jsonify({"error": "not found"}), 404
    time.sleep(0.2)  # Simulate slow N+1 query
    return jsonify({"project": project, "owner": project["userId"]})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8082)
