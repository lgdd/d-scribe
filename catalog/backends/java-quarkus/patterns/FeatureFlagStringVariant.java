package com.example.service;

import dev.openfeature.sdk.*;
import jakarta.enterprise.context.ApplicationScoped;

// Pattern: Feature Flags — string variant for A/B branching
// Adapt: replace "ui-theme" with your flag key; variant values must match Datadog flag config
@ApplicationScoped
public class FeatureFlagStringVariant {

    public String getUiVariant(String userId) {
        Client client = OpenFeatureAPI.getInstance().getClient(); // provider initialized in FeatureFlagBooleanGate
        EvaluationContext ctx = new MutableContext(userId);
        String variant = client.getStringValue("ui-theme", "control", ctx);
        return switch (variant) {
            case "treatment-a" -> "new_design_a";
            case "treatment-b" -> "new_design_b";
            default -> "control_design";
        };
    }
}
