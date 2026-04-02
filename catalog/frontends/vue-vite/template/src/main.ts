import { datadogRum } from '@datadog/browser-rum';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

const rumAppId = import.meta.env.VITE_DD_RUM_APPLICATION_ID;
const rumClientToken = import.meta.env.VITE_DD_RUM_CLIENT_TOKEN;

if (rumAppId && rumClientToken) {
  datadogRum.init({
    applicationId: rumAppId,
    clientToken: rumClientToken,
    site: import.meta.env.VITE_DD_SITE || 'datadoghq.com',
    service: import.meta.env.VITE_DD_SERVICE || 'frontend',
    env: import.meta.env.VITE_DD_ENV || 'local',
    version: import.meta.env.VITE_DD_VERSION || '1.0.0',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 100,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'allow',
    allowedTracingUrls: [window.location.origin],
  });
}

createApp(App).use(router).mount('#app');
