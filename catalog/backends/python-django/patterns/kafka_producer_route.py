import os
import uuid
import json
import time
from confluent_kafka import Producer
from django.http import JsonResponse

# Pattern: DSM — Kafka producer for pipeline monitoring
# Adapt: replace topic name and payload with domain events
_producer = Producer({"bootstrap.servers": os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")})


def publish_event(request):
    event_id = str(uuid.uuid4())
    payload = json.dumps({"id": event_id, "timestamp": time.time()})
    _producer.produce("demo-events", key=event_id, value=payload)
    _producer.flush()
    return JsonResponse({"status": "sent", "id": event_id})
