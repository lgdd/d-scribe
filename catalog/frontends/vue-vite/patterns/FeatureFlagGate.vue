<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { OpenFeature } from '@openfeature/web-sdk';

// Pattern: Feature Flags — boolean gate and string variant via OpenFeature Vue
// Use after FeatureFlagProvider.vue has mounted (provider initialized)
// Adapt: replace flag keys with your configured Datadog flag names

const client = OpenFeature.getClient();

const checkoutEnabled = ref(false);
const uiVariant = ref('control');

const VARIANT_LABELS: Record<string, string> = {
  'treatment-a': 'Theme A',
  'treatment-b': 'Theme B',
};

onMounted(() => {
  checkoutEnabled.value = client.getBooleanValue('checkout-new-flow', false);
  uiVariant.value = client.getStringValue('ui-theme', 'control');
});
</script>

<template>
  <slot v-if="checkoutEnabled" />
  <div :data-variant="uiVariant">{{ VARIANT_LABELS[uiVariant] ?? 'Default Theme' }}</div>
</template>
