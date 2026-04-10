package com.example.service;

import org.apache.kafka.clients.consumer.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.Duration;
import java.util.*;

// Pattern: DSM — Kafka consumer with optional lag simulation
// Adapt: replace processing logic with domain-specific handling
public class KafkaConsumerService implements Runnable {

    private static final Logger log = LoggerFactory.getLogger(KafkaConsumerService.class);
    private static final long DELAY = Long.parseLong(
            System.getenv().getOrDefault("KAFKA_CONSUMER_DELAY_MS", "0"));

    @Override
    public void run() {
        var props = Map.of(
            "bootstrap.servers", System.getenv().getOrDefault("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092"),
            "group.id", "demo-consumer-group",
            "key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer",
            "value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        try (var consumer = new KafkaConsumer<String, String>(new HashMap<>(props))) {
            consumer.subscribe(List.of("demo-events"));
            while (true) {
                for (var record : consumer.poll(Duration.ofMillis(1000))) {
                    log.info("consumed event: {}", record.value());
                    if (DELAY > 0) Thread.sleep(DELAY);
                }
            }
        } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
