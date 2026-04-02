using System.Collections.Concurrent;

// Pattern: Profiling memory leak — gradual allocation in a static cache
// Adapt: replace with a domain-specific cache scenario
public static class MemoryLeakService
{
    private static readonly ConcurrentDictionary<string, byte[]> Cache = new();

    public static void Map(WebApplication app)
    {
        app.MapPost("/cache", (string key) =>
        {
            Cache[key] = new byte[100_000]; // ~100 KB per entry
            return Results.Json(new { cached = Cache.Count, key });
        });

        app.MapGet("/cache/stats", () =>
            Results.Json(new { entries = Cache.Count, estimatedBytes = Cache.Count * 100_000L }));
    }
}
