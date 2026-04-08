// Pattern: Cross-service HTTP call — tracing headers propagated automatically by CLR profiler
// Adapt: replace target URL with a domain-specific service
public class InterServiceClient
{
    private readonly HttpClient _client = new();
    private readonly string _targetUrl;

    public InterServiceClient(string targetUrl) =>
        _targetUrl = targetUrl;

    public async Task<string> CallAsync(string path) =>
        await _client.GetStringAsync($"{_targetUrl}{path}");
}
