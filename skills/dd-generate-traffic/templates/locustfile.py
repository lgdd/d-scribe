"""
Locust traffic generator template for Datadog demo projects.

This file runs inside a container service (Docker Compose or Kubernetes)
alongside the application stack. It is NOT instrumented with Datadog —
the traffic service is excluded from monitoring to keep demo telemetry clean.

Failure scenarios use deterministic "magic values" — specific entity IDs,
parameter values, and other business inputs that trigger named failures
every time. These are the same values a demoer uses manually during a live
demo. Adapt the endpoints and magic values below to match the demo's domain.
See failure-scenarios.md for the full catalog.

Configure via environment variables:
    TRAFFIC_TARGET      - base URL of the entry point (default http://api-gateway:8080)
    TRAFFIC_LATENCY_MS  - extra sleep per request in ms (default 0)
"""

import os
import time

from locust import HttpUser, between, task


LATENCY_MS = int(os.getenv("TRAFFIC_LATENCY_MS", "0"))


class DemoUser(HttpUser):
    wait_time = between(0.5, 2.0)

    @task(8)
    def golden_path(self):
        """Successful end-to-end request through all services."""
        self.client.post(
            "/api/orders",
            json={"product_id": "sku-001", "quantity": 1},
            headers={"User-Agent": "dd-demo-traffic/1.0"},
            name="POST /api/orders [golden]",
        )
        if LATENCY_MS > 0:
            time.sleep(LATENCY_MS / 1000)

    @task(3)
    def browse_items(self):
        """Simulates browsing behavior for varied trace shapes."""
        self.client.get(
            "/api/products",
            headers={"User-Agent": "dd-demo-traffic/1.0"},
            name="GET /api/products",
        )

    @task(2)
    def scenario_retry_storm(self):
        """Triggers downstream 500 and retry storm via magic entity ID.
        Adapt the field name and value to the demo's domain:
          e-commerce: product_id: "sku-fail-500"
          logistics:  shipment_id: "shipment-fail-500"
          fintech:    txn_id: "txn-fail-500"
        """
        self.client.post(
            "/api/orders",
            json={"product_id": "sku-fail-500", "quantity": 1},
            headers={"User-Agent": "dd-demo-traffic/1.0"},
            name="POST /api/orders [retry-storm]",
        )

    @task(1)
    def scenario_cascading_timeout(self):
        """Triggers cascading timeout via magic parameter value.
        Use TIMEOUT_30S in any free-text field that maps to a downstream
        lookup (coupon, reference, memo, note, config key).
        """
        self.client.post(
            "/api/orders",
            json={"product_id": "sku-001", "quantity": 1, "coupon": "TIMEOUT_30S"},
            headers={"User-Agent": "dd-demo-traffic/1.0"},
            name="POST /api/orders [timeout]",
        )

    @task(1)
    def health_check(self):
        """Lightweight health probe."""
        self.client.get("/health", name="GET /health")
