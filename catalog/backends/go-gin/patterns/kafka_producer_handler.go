package patterns

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	ddkafka "github.com/DataDog/dd-trace-go/contrib/confluentinc/confluent-kafka-go/kafka.v2/v2"
	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
)

// Pattern: DSM — Kafka producer for pipeline monitoring.
// Adapt: replace topic name and payload with domain events.
func KafkaProducerHandler() gin.HandlerFunc {
	brokers := os.Getenv("KAFKA_BOOTSTRAP_SERVERS")
	if brokers == "" {
		brokers = "kafka:9092"
	}
	p, _ := ddkafka.NewProducer(&kafka.ConfigMap{"bootstrap.servers": brokers}, ddkafka.WithDataStreams())
	topic := "demo-events"
	return func(c *gin.Context) {
		id := fmt.Sprintf("%d", time.Now().UnixNano())
		payload := fmt.Sprintf(`{"id":"%s","timestamp":"%s"}`, id, time.Now().Format(time.RFC3339))
		p.Produce(&kafka.Message{TopicPartition: kafka.TopicPartition{Topic: &topic}, Key: []byte(id), Value: []byte(payload)}, nil)
		c.JSON(http.StatusOK, gin.H{"status": "sent", "id": id})
	}
}
