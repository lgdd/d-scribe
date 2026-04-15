<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
import ChatWidget from './components/ChatWidget.vue';

const featureChat = import.meta.env.VITE_FEATURE_CHAT === 'true';
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-primary text-primary-content px-4">
      <div class="navbar-start">
        <span class="font-bold tracking-tight">Demo App</span>
      </div>
      <div class="navbar-end">
        <RouterLink to="/" class="btn btn-ghost btn-sm text-primary-content">Home</RouterLink>
      </div>
    </div>
    <main class="p-6">
      <RouterView />
    </main>
  </div>
  <ChatWidget v-if="featureChat" />
</template>
