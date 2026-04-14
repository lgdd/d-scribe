<script setup lang="ts">
import { DatadogProvider } from '@datadog/openfeature-browser';
import { OpenFeature } from '@openfeature/web-sdk';
import { onMounted } from 'vue';

// Pattern: Feature Flags — DatadogProvider init for OpenFeature Vue SDK
// Deps: @datadog/openfeature-browser, @openfeature/web-sdk, @openfeature/core
// Place after datadogRum.init(); targetingKey must match userId from UserIdentification.vue
// DatadogProvider hooks into the existing DD_RUM global — does NOT re-initialize RUM
// Adapt: add domain-specific attributes to context (plan, role, etc.)

const props = defineProps<{ userId: string; plan: string }>();

const _provider = new DatadogProvider({
  applicationId: import.meta.env.VITE_DD_RUM_APPLICATION_ID,
  clientToken: import.meta.env.VITE_DD_RUM_CLIENT_TOKEN,
  site: import.meta.env.VITE_DD_SITE || 'datadoghq.com',
  env: import.meta.env.VITE_DD_ENV || 'local',
});

onMounted(async () => {
  await OpenFeature.setProviderAndWait(_provider, {
    targetingKey: props.userId,
    plan: props.plan,
  });
});
</script>

<template><span /></template>
