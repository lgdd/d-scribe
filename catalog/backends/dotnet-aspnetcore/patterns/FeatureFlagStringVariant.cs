using OpenFeature;
using OpenFeature.Model;

// Pattern: Feature Flags — string variant for A/B branching
// Adapt: replace "ui-theme" with your flag key; variant values must match Datadog flag config
public class FeatureFlagStringVariant
{
    private static readonly FeatureClient _client = Api.Instance.GetClient("service"); // provider initialized in FeatureFlagBooleanGate

    private static readonly Dictionary<string, string> _variants = new()
    {
        ["treatment-a"] = "new_design_a",
        ["treatment-b"] = "new_design_b",
    };

    public async Task<string> GetUiVariantAsync(string userId)
    {
        var ctx = EvaluationContext.Builder().SetTargetingKey(userId).Build();
        var variant = await _client.GetStringValueAsync("ui-theme", "control", ctx);
        return _variants.GetValueOrDefault(variant, "control_design");
    }
}
