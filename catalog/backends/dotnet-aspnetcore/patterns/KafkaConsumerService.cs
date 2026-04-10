using Confluent.Kafka;
using Microsoft.Extensions.Logging;

// Pattern: DSM — Kafka consumer with optional lag simulation
// Adapt: replace processing logic with domain-specific handling
public class KafkaConsumerService
{
    private static readonly int DelayMs = int.TryParse(
        Environment.GetEnvironmentVariable("KAFKA_CONSUMER_DELAY_MS"), out var d) ? d : 0;

    public static void StartConsumer(ILogger logger)
    {
        var config = new ConsumerConfig
        {
            BootstrapServers = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS") ?? "kafka:9092",
            GroupId = "demo-consumer-group",
            AutoOffsetReset = AutoOffsetReset.Latest,
        };
        using var consumer = new ConsumerBuilder<string, string>(config).Build();
        consumer.Subscribe("demo-events");
        while (true)
        {
            var result = consumer.Consume(TimeSpan.FromSeconds(1));
            if (result == null) continue;
            logger.LogInformation("consumed event: {Value}", result.Message.Value);
            if (DelayMs > 0) Thread.Sleep(DelayMs);
        }
    }
}
