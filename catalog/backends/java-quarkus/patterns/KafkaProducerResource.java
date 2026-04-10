package com.example.service;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.apache.kafka.clients.producer.*;
import java.util.*;

// Pattern: DSM — Kafka producer for pipeline monitoring
// Adapt: replace topic name and payload with domain events
@Path("/api/events/publish")
@Produces(MediaType.APPLICATION_JSON)
public class KafkaProducerResource {

    private final KafkaProducer<String, String> producer = new KafkaProducer<>(Map.of(
        "bootstrap.servers", System.getenv().getOrDefault("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092"),
        "key.serializer", "org.apache.kafka.common.serialization.StringSerializer",
        "value.serializer", "org.apache.kafka.common.serialization.StringSerializer"));

    @POST
    public Map<String, Object> publish() {
        String id = UUID.randomUUID().toString();
        String payload = "{\"id\":\"" + id + "\",\"timestamp\":\"" + java.time.Instant.now() + "\"}";
        producer.send(new ProducerRecord<>("demo-events", id, payload));
        return Map.of("status", "sent", "id", id);
    }
}
