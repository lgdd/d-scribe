using Confluent.Kafka;

// Pattern: DSM — Kafka producer for pipeline monitoring
// Adapt: replace topic name and payload with domain events
public static class KafkaProducerEndpoint
{
    private static readonly IProducer<string, string> Producer =
        new ProducerBuilder<string, string>(new ProducerConfig
        {
            BootstrapServers = Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS") ?? "kafka:9092"
        }).Build();

    public static void Map(WebApplication app)
    {
        app.MapPost("/api/events/publish", async () =>
        {
            var id = Guid.NewGuid().ToString();
            var payload = $"{{\"id\":\"{id}\",\"timestamp\":\"{DateTime.UtcNow:O}\"}}";
            await Producer.ProduceAsync("demo-events", new Message<string, string> { Key = id, Value = payload });
            return Results.Json(new { status = "sent", id });
        });
    }
}
