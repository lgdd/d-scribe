package patterns

import (
	"context"

	"github.com/open-feature/go-sdk/openfeature"
)

// Pattern: Feature Flags — string variant for A/B branching
// Adapt: replace "ui-theme" with your flag key; variant values must match Datadog flag config
// Uses flagClient initialized in feature_flag_boolean_gate.go

var variants = map[string]string{
	"treatment-a": "new_design_a",
	"treatment-b": "new_design_b",
}

func GetUiVariant(ctx context.Context, userID string) string {
	evalCtx := openfeature.NewEvaluationContext(userID, nil)
	variant, _ := flagClient.StringValue(ctx, "ui-theme", "control", evalCtx)
	if result, ok := variants[variant]; ok {
		return result
	}
	return "control_design"
}
