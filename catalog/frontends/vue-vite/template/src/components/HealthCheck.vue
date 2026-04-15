<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const status = ref('checking...');

onMounted(() => {
  fetch(`${API_URL}/health`)
    .then(res => res.json())
    .then(data => { status.value = data.status || 'ok'; })
    .catch(() => { status.value = 'unreachable'; });
});

const badgeClass = computed(() => {
  if (status.value === 'ok') return 'badge-success';
  if (status.value === 'checking...') return 'badge-ghost';
  return 'badge-error';
});
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
    <div class="stat bg-base-100 rounded-box border border-base-300 shadow-sm">
      <div class="stat-title">API Status</div>
      <div class="stat-value text-base mt-1">
        <span :class="`badge ${badgeClass}`">{{ status }}</span>
      </div>
      <div class="stat-desc">Endpoint: {{ API_URL }}/health</div>
    </div>
  </div>
</template>
