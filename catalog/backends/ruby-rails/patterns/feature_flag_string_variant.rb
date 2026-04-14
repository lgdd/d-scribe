# Pattern: Feature Flags — string variant for A/B branching
# Adapt: replace 'ui-theme' with your flag key; variant values must match Datadog flag config
# Requires feature_flag_boolean_gate.rb to be loaded first (defines FLAG_CLIENT)

VARIANTS = { 'treatment-a' => 'new_design_a', 'treatment-b' => 'new_design_b' }.freeze

def ui_variant(user_id)
  ctx = OpenFeature::SDK::EvaluationContext.new(targeting_key: user_id)
  variant = FLAG_CLIENT.fetch_string_value(
    flag_key: 'ui-theme', default_value: 'control', evaluation_context: ctx
  )
  VARIANTS.fetch(variant, 'control_design')
end
