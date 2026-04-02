<script setup lang="ts">
import { ref, onMounted } from 'vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const status = ref('checking...');

onMounted(() => {
  fetch(`${API_URL}/health`)
    .then(res => res.json())
    .then(data => { status.value = data.status || 'ok'; })
    .catch(() => { status.value = 'unreachable'; });
});
</script>

<template>
  <div>
    <h1>Demo Application</h1>
    <p>API status: <strong>{{ status }}</strong></p>
  </div>
</template>
