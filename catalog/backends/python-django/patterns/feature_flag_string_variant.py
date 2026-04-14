from openfeature import api
from openfeature.evaluation_context import EvaluationContext

# Pattern: Feature Flags — string variant for A/B branching
# Adapt: replace "ui-theme" with your flag key; variant values must match Datadog flag config
# Django: _init_feature_flags() in feature_flag_boolean_gate.py must be called first (AppConfig.ready())

_VARIANTS = {"treatment-a": "new_design_a", "treatment-b": "new_design_b"}


def get_ui_variant(user_id: str) -> str:
    ctx = EvaluationContext(targeting_key=user_id)
    variant = api.get_client().get_string_value("ui-theme", "control", ctx)
    return _VARIANTS.get(variant, "control_design")
