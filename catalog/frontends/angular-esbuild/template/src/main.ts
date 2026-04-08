import { datadogRum } from '@datadog/browser-rum';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

if (environment.ddRumApplicationId && environment.ddRumClientToken) {
  datadogRum.init({
    applicationId: environment.ddRumApplicationId,
    clientToken: environment.ddRumClientToken,
    site: environment.ddSite || 'datadoghq.com',
    service: environment.ddService || 'frontend',
    env: environment.ddEnv || 'local',
    version: '1.0.0',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 100,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'allow',
    allowedTracingUrls: [window.location.origin],
  });
}

bootstrapApplication(AppComponent, appConfig);
