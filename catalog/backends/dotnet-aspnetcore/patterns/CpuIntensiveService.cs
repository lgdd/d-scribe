// Pattern: Profiling hot-spot — nested loop aggregation
// Adapt: replace with a domain-specific computation
public static class CpuIntensiveService
{
    public static void Map(WebApplication app)
    {
        app.MapGet("/compute", () =>
        {
            var sums = new Dictionary<string, long>();
            for (int i = 0; i < 2000; i++)
            {
                var key = $"bucket_{i % 50}";
                long total = 0;
                for (int j = 0; j < 5000; j++) total += i * j;
                sums[key] = sums.GetValueOrDefault(key) + total;
            }
            return Results.Json(new { buckets = sums.Count, sample = sums.First().Value });
        });
    }
}
