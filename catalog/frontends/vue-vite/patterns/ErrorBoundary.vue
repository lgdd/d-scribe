<script setup lang="ts">
import { datadogRum } from '@datadog/browser-rum';
import { ref, onErrorCaptured } from 'vue';

const hasError = ref(false);

onErrorCaptured((error: Error) => {
  datadogRum.addError(error, { source: 'component' });
  hasError.value = true;
  return false;
});
</script>

<template>
  <div v-if="hasError">Something went wrong.</div>
  <slot v-else />
</template>
