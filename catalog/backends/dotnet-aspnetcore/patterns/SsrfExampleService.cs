// Pattern: AppSec SSRF — unvalidated URL passed to HttpClient
// Adapt: wrap in a domain-specific proxy or fetcher endpoint
public static class SsrfExampleService
{
    private static readonly HttpClient Client = new();

    public static void Map(WebApplication app)
    {
        app.MapGet("/fetch", async (string url) =>
        {
            // INTENTIONALLY VULNERABLE — demonstrates SSRF for Datadog Code Security
            var body = await Client.GetStringAsync(url);
            return Results.Text(body, "text/plain");
        });
    }
}
