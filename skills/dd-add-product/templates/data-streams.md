# Data Streams Monitoring

## Prerequisites

- A message queue or streaming platform in the project (Kafka, RabbitMQ, SQS, Kinesis, or similar)
- Producer and consumer services instrumented with the Datadog tracer
- Datadog Agent v7.34.0+

## Agent Configuration

Enable Data Streams Monitoring on the Agent:

```yaml
environment:
  - DD_DATA_STREAMS_ENABLED=true
```

## Application Changes

### Environment Variables (all languages)

Add to every service that produces or consumes messages:

```yaml
environment:
  - DD_DATA_STREAMS_ENABLED=true
```

### Language-Specific Setup

| Language | Library | Setup |
|---|---|---|
| Python | `ddtrace` | `DD_DATA_STREAMS_ENABLED=true` — auto-instrumented for Kafka (`confluent-kafka`, `kafka-python`), RabbitMQ (`kombu`, `pika`), SQS (`boto3`), Kinesis (`boto3`) |
| Node.js | `dd-trace` | `DD_DATA_STREAMS_ENABLED=true` — auto-instrumented for Kafka (`kafkajs`, `node-rdkafka`), RabbitMQ (`amqplib`), SQS (`@aws-sdk/client-sqs`) |
| Go | `dd-trace-go` | `DD_DATA_STREAMS_ENABLED=true` — auto-instrumented for Kafka (`confluent-kafka-go`, `sarama`), RabbitMQ (`amqp091-go`) |
| Java | `dd-java-agent` | `DD_DATA_STREAMS_ENABLED=true` — auto-instrumented for Kafka, RabbitMQ, SQS, Kinesis, gRPC, HTTP |
| .NET | `dd-trace-dotnet` | `DD_DATA_STREAMS_ENABLED=true` — auto-instrumented for Kafka, RabbitMQ, SQS |

### Manual Instrumentation (if auto-instrumentation is not available)

For unsupported libraries, manually inject/extract DSM context at produce and consume points. Consult the [SDK documentation](https://docs.datadoghq.com/data_streams/) for the `SetCheckpoint` / `set_checkpoint` API.

## Deployment Config

No additional containers needed. If using Kafka, ensure Kafka broker metrics are also collected by the Agent via the Kafka integration for complete pipeline visibility.

### Kafka Integration (optional but recommended)

If Kafka is in the stack, add a Kafka check to the Agent for broker-level metrics:

```yaml
# datadog-agent volumes
volumes:
  - ./agent-config/kafka.d/conf.yaml:/etc/datadog-agent/conf.d/kafka.d/conf.yaml
```

## Cross-Product Wiring

- **APM**: Data Streams spans appear in distributed traces alongside HTTP and database spans
- **Infrastructure**: Queue lag and throughput metrics correlate with DSM pipeline views
- **Monitors**: Set alerts on end-to-end pipeline latency (`data_streams.latency`) or consumer lag

## Failure Scenarios

| Scenario | Datadog Signal |
|---|---|
| Consumer lag (slow consumer) | Pipeline latency increase in DSM, consumer lag metric spike |
| Poison message → DLQ | DSM shows message stuck, DLQ throughput increases |
| Producer burst | Pipeline throughput spike, downstream consumer lag in DSM |
| Broker unavailable | Producer error rate in DSM, gap in pipeline graph |

## References

- [Data Streams Monitoring Setup](https://docs.datadoghq.com/data_streams/)
- [Data Streams Monitoring for Python](https://docs.datadoghq.com/data_streams/python/)
- [Data Streams Monitoring for Java](https://docs.datadoghq.com/data_streams/java/)
