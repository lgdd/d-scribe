package patterns

import (
	"log/slog"
	"os"
	"strconv"
	"time"

	ddkafka "github.com/DataDog/dd-trace-go/contrib/confluentinc/confluent-kafka-go/kafka.v2/v2"
	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
)

// Pattern: DSM — Kafka consumer with optional lag simulation.
// Adapt: replace processing logic with domain-specific handling.
func StartKafkaConsumer() {
	brokers := os.Getenv("KAFKA_BOOTSTRAP_SERVERS")
	if brokers == "" {
		brokers = "kafka:9092"
	}
	delayMs, _ := strconv.Atoi(os.Getenv("KAFKA_CONSUMER_DELAY_MS"))
	consumer, _ := ddkafka.NewConsumer(&kafka.ConfigMap{
		"bootstrap.servers": brokers,
		"group.id":          "demo-consumer-group",
		"auto.offset.reset": "latest",
	}, ddkafka.WithDataStreams())
	consumer.Subscribe("demo-events", nil)
	for {
		ev := consumer.Poll(1000)
		if ev == nil {
			continue
		}
		if msg, ok := ev.(*kafka.Message); ok {
			slog.Info("consumed event", "value", string(msg.Value))
			if delayMs > 0 {
				time.Sleep(time.Duration(delayMs) * time.Millisecond)
			}
		}
	}
}
