import logging
import os

import requests as http_client
from flask import Flask, jsonify, request
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
SERVICE_TASK_URL = os.environ.get("SERVICE_TASK_URL", "http://task-service:8083")

ROUTE_MAP = {
    "users": SERVICE_USER_URL,
    "projects": SERVICE_PROJECT_URL,
    "tasks": SERVICE_TASK_URL,
}


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/<service>/<path:path>", methods=["GET", "POST", "PUT", "DELETE"])
def proxy(service, path):
    base_url = ROUTE_MAP.get(service)
    if not base_url:
        return jsonify({"error": f"unknown service: {service}"}), 404

    url = f"{base_url}/api/{service}/{path}"
    headers = {
        k: v for k, v in request.headers if k.lower() not in ("host", "content-length")
    }

    logger.info("proxying request", extra={"method": request.method, "url": url})

    resp = http_client.request(
        method=request.method,
        url=url,
        headers=headers,
        data=request.get_data(),
        params=request.args,
        timeout=35,
    )

    return resp.content, resp.status_code, {"Content-Type": resp.headers.get("Content-Type", "application/json")}


@app.route("/api/<service>", methods=["GET", "POST"])
def proxy_root(service):
    base_url = ROUTE_MAP.get(service)
    if not base_url:
        return jsonify({"error": f"unknown service: {service}"}), 404

    url = f"{base_url}/api/{service}"
    headers = {
        k: v for k, v in request.headers if k.lower() not in ("host", "content-length")
    }

    logger.info("proxying request", extra={"method": request.method, "url": url})

    resp = http_client.request(
        method=request.method,
        url=url,
        headers=headers,
        data=request.get_data(),
        params=request.args,
        timeout=35,
    )

    return resp.content, resp.status_code, {"Content-Type": resp.headers.get("Content-Type", "application/json")}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
