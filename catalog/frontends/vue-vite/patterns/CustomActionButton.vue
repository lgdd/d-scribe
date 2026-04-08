<script setup lang="ts">
import { datadogRum } from '@datadog/browser-rum';

const props = defineProps<{ label: string; actionName: string }>();

function handleClick() {
  datadogRum.addAction(props.actionName, { label: props.label, timestamp: Date.now() });
}
</script>

<template>
  <button @click="handleClick">{{ label }}</button>
</template>
