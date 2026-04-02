<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
</script>

<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
  </nav>
  <main>
    <RouterView />
  </main>
</template>

<style>
@import './App.css';
</style>
