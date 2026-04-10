<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
import ChatWidget from './components/ChatWidget.vue';

const featureChat = import.meta.env.VITE_FEATURE_CHAT === 'true';
</script>

<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
  </nav>
  <main>
    <RouterView />
  </main>
  <ChatWidget v-if="featureChat" />
</template>

<style>
@import './App.css';
</style>
