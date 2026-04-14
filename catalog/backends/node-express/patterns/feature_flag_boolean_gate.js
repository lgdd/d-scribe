// Pattern: Feature Flags — boolean gate with user targeting context
// Deps: dd-trace@>=5.80.0 (bump from ^5.0.0 in package.json), @openfeature/server-sdk@~1.20.0
// Adapt: replace 'checkout-new-flow' with your flag key; add domain attributes to context
const tracer = require('dd-trace').init({
  experimental: { flaggingProvider: { enabled: true } },
});
const { OpenFeature } = require('@openfeature/server-sdk');

OpenFeature.setProvider(tracer.openfeature);
const client = OpenFeature.getClient();

async function isCheckoutEnabled(userId, plan) {
  return client.getBooleanValue('checkout-new-flow', false, { targetingKey: userId, plan });
}

module.exports = { client, isCheckoutEnabled };
