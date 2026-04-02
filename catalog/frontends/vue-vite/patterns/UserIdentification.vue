<script setup lang="ts">
import { datadogRum } from '@datadog/browser-rum';
import { onMounted } from 'vue';

const props = defineProps<{ userId: string; email: string }>();

onMounted(() => {
  datadogRum.setUser({ id: props.userId, email: props.email, name: props.email.split('@')[0] });
});
</script>

<template>
  <span />
</template>
