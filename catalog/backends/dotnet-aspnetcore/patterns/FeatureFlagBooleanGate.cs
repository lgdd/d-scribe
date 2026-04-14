using OpenFeature;
using OpenFeature.Model;
using Datadog.OpenFeature;

// Pattern: Feature Flags — boolean gate with user targeting context
// Deps: Datadog.Trace>=3.36.0 (.NET 6+), OpenFeature>=2.0.0
// Adapt: replace "checkout-new-flow" with your flag key; add domain attributes to context
public class FeatureFlagBooleanGate
{
    private static readonly FeatureClient _client;

    static FeatureFlagBooleanGate()
    {
        var provider = new DatadogProvider();
        Task.Run(() => Api.Instance.SetProviderAsync(provider)).GetAwaiter().GetResult();
        _client = Api.Instance.GetClient("service");
    }

    public async Task<bool> IsCheckoutEnabledAsync(string userId, string plan)
    {
        var ctx = EvaluationContext.Builder()
            .SetTargetingKey(userId)
            .Set("plan", plan)
            .Build();
        return await _client.GetBooleanValueAsync("checkout-new-flow", false, ctx);
    }
}
