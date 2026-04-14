package patterns

import (
	"context"

	ddopenfeature "github.com/DataDog/dd-trace-go/v2/openfeature"
	"github.com/open-feature/go-sdk/openfeature"
)

// Pattern: Feature Flags — boolean gate with user targeting context
// Deps: go get github.com/DataDog/dd-trace-go/v2/openfeature github.com/open-feature/go-sdk/openfeature
// Note: tracer.Start() must be called in main.go before this package is used
// Adapt: replace "checkout-new-flow" with your flag key; add domain attributes to context

var flagClient = func() *openfeature.Client {
	provider, _ := ddopenfeature.NewDatadogProvider(ddopenfeature.ProviderConfig{})
	_ = openfeature.SetProviderAndWait(provider)
	return openfeature.NewClient("service")
}()

func IsCheckoutEnabled(ctx context.Context, userID, plan string) bool {
	evalCtx := openfeature.NewEvaluationContext(userID, map[string]interface{}{"plan": plan})
	enabled, _ := flagClient.BooleanValue(ctx, "checkout-new-flow", false, evalCtx)
	return enabled
}
