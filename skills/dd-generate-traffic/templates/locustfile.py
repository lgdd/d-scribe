"""
Locust traffic generator template for Datadog demo projects.

This file runs inside a container service (Docker Compose or Kubernetes)
alongside the application stack. It is NOT instrumented with Datadog —
the traffic service is excluded from monitoring to keep demo telemetry clean.

Configure via environment variables:
    TRAFFIC_TARGET      - base URL of the entry point (default http://api-gateway:8080)
    TRAFFIC_ERROR_RATE  - fraction of requests triggering failure (default 0.1)
    TRAFFIC_LATENCY_MS  - extra sleep per request in ms (default 0)
"""

import os
import random
import time

from locust import HttpUser, between, task


ERROR_RATE = float(os.getenv("TRAFFIC_ERROR_RATE", "0.1"))
LATENCY_MS = int(os.getenv("TRAFFIC_LATENCY_MS", "0"))


class DemoUser(HttpUser):
    wait_time = between(0.5, 2.0)

    @task(8)
    def golden_path(self):
        """Successful end-to-end request through all services."""
        self.client.get(
            "/api/orders",
            headers={"User-Agent": "dd-demo-traffic/1.0"},
            name="GET /api/orders [golden]",
        )
        if LATENCY_MS > 0:
            time.sleep(LATENCY_MS / 1000)

    @task(2)
    def failure_path(self):
        """Request that triggers the intentional failure scenario."""
        if random.random() < ERROR_RATE:
            self.client.get(
                "/api/orders?fail=true",
                headers={
                    "User-Agent": "dd-demo-traffic/1.0",
                    "X-Force-Error": "true",
                },
                name="GET /api/orders [failure]",
            )

    @task(3)
    def browse_items(self):
        """Simulates browsing behavior for varied trace shapes."""
        self.client.get(
            "/api/items",
            headers={"User-Agent": "dd-demo-traffic/1.0"},
            name="GET /api/items",
        )

    @task(1)
    def health_check(self):
        """Lightweight health probe."""
        self.client.get("/health", name="GET /health")
