require 'datadog'
require 'openfeature/sdk'

# Pattern: Feature Flags — boolean gate with user targeting context
# Deps: datadog>=2.23.0, openfeature-sdk>=0.4.1
# Adapt: replace 'checkout-new-flow' with your flag key; add domain attributes to context

Datadog.configure do |c|
  c.remote.enabled = true
  c.openfeature.enabled = true
end

OpenFeature::SDK.configure do |config|
  config.set_provider_and_wait(Datadog::OpenFeature::Provider.new, timeout: 5)
end

FLAG_CLIENT = OpenFeature::SDK.build_client

def checkout_enabled?(user_id, plan)
  ctx = OpenFeature::SDK::EvaluationContext.new(targeting_key: user_id, plan: plan)
  FLAG_CLIENT.fetch_boolean_value(flag_key: 'checkout-new-flow', default_value: false, evaluation_context: ctx)
end
