from datadog import statsd
from flask import request, jsonify

# Pattern: DogStatsD — custom gauge and counter
# Adapt: metric names should reflect domain (e.g., orders.pending)


def record_metric():
    name = request.args.get("name", "custom.metric")
    value = float(request.args.get("value", "1"))
    statsd.gauge(name, value)
    statsd.increment(f"{name}.calls")
    return jsonify({"status": "recorded", "metric": name})
