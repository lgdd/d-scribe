import { createRouter, createWebHistory } from 'vue-router';
import HealthCheck from '../components/HealthCheck.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HealthCheck },
  ],
});

export default router;
