package com.example.service;

import com.datadoghq.openfeature.Provider;
import dev.openfeature.sdk.*;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

// Pattern: Feature Flags — boolean gate with user targeting context
// Deps: add to pom.xml:
//   com.datadoghq:dd-openfeature:1.57.0
//   dev.openfeature:sdk:1.18.2
// Adapt: replace "checkout-new-flow" with your flag key; add domain attributes to context
@ApplicationScoped
public class FeatureFlagBooleanGate {

    private Client client;

    @PostConstruct
    void init() {
        OpenFeatureAPI api = OpenFeatureAPI.getInstance();
        api.setProviderAndWait(new Provider());
        this.client = api.getClient();
    }

    public boolean isCheckoutEnabled(String userId, String plan) {
        EvaluationContext ctx = new MutableContext(userId).add("plan", plan);
        return client.getBooleanValue("checkout-new-flow", false, ctx);
    }
}
