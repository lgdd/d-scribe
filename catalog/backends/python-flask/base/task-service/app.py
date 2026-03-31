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
SERVICE_PROJECT_URL = os.environ.get("SERVICE_PROJECT_URL", "http://project-service:8082")

# In-memory storage
tasks = {}
_next_id = 1
_lock = threading.Lock()


def _gen_id():
    global _next_id
    with _lock:
        tid = str(_next_id)
        _next_id += 1
    return tid


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/tasks", methods=["GET"])
def list_tasks():
    return jsonify(list(tasks.values()))


@app.route("/api/tasks/<task_id>", methods=["GET"])
def get_task(task_id):
    task = tasks.get(task_id)
    if not task:
        return jsonify({"error": "not found"}), 404
    return jsonify(task)


@app.route("/api/tasks", methods=["POST"])
def create_task():
    body = request.get_json(force=True)
    title = body.get("title", "")

    # Magic value failures
    if "-fail-500" in title:
        abort(500, description="simulated 500 error")
    if "-fail-timeout" in title:
        time.sleep(30)

    # Validate projectId by calling project-service
    project_id = body.get("projectId", "")
    if project_id:
        try:
            resp = http_client.get(f"{SERVICE_PROJECT_URL}/api/projects/{project_id}", timeout=5)
            if resp.status_code == 404:
                return jsonify({"error": f"project {project_id} not found"}), 400
        except http_client.RequestException as e:
            logger.warning("failed to validate project", extra={"projectId": project_id, "error": str(e)})

    # Validate assigneeId by calling user-service
    assignee_id = body.get("assigneeId", "")
    if assignee_id:
        try:
            resp = http_client.get(f"{SERVICE_USER_URL}/api/users/{assignee_id}", timeout=5)
            if resp.status_code == 404:
                return jsonify({"error": f"assignee {assignee_id} not found"}), 400
        except http_client.RequestException as e:
            logger.warning("failed to validate assignee", extra={"assigneeId": assignee_id, "error": str(e)})

    tid = _gen_id()
    task = {
        "id": tid,
        "title": title,
        "status": body.get("status", "TODO"),
        "priority": body.get("priority", "MEDIUM"),
        "projectId": project_id,
        "assigneeId": assignee_id,
    }
    tasks[tid] = task
    logger.info("task created", extra={"taskId": tid})
    return jsonify(task), 201


@app.route("/api/tasks/<task_id>", methods=["PUT"])
def update_task(task_id):
    if task_id not in tasks:
        return jsonify({"error": "not found"}), 404
    body = request.get_json(force=True)
    t = tasks[task_id]
    t.update({
        "title": body.get("title", t["title"]),
        "status": body.get("status", t["status"]),
        "priority": body.get("priority", t["priority"]),
        "projectId": body.get("projectId", t["projectId"]),
        "assigneeId": body.get("assigneeId", t["assigneeId"]),
    })
    return jsonify(t)


@app.route("/api/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    if task_id not in tasks:
        return jsonify({"error": "not found"}), 404
    del tasks[task_id]
    return "", 204


# SSRF vulnerability for Code Security demo
# WARNING: intentionally vulnerable — demonstrates IAST detection
@app.route("/api/tasks/fetch-url")
def fetch_url():
    url = request.args.get("url", "")
    try:
        resp = http_client.get(url, timeout=5)
        return resp.text
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# CPU-intensive aggregation for Profiling demo
@app.route("/api/tasks/aggregate")
def aggregate_tasks():
    by_status = {}
    for _ in range(100):  # Repeat to burn CPU
        by_status.clear()
        for t in tasks.values():
            status = t.get("status", "TODO")
            by_status[status] = by_status.get(status, 0) + 1
    return jsonify({"byStatus": by_status, "total": len(tasks)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8083)
