import { DatadogProvider } from '@datadog/openfeature-browser';
import { OpenFeature } from '@openfeature/web-sdk';
import { environment } from '../environments/environment';

// Pattern: Feature Flags — DatadogProvider init for OpenFeature Angular SDK
// Deps: @datadog/openfeature-browser, @openfeature/angular-sdk, @openfeature/web-sdk, @openfeature/core
// Call initFeatureFlags() after datadogRum.init() and after user identity is known
// targetingKey must match the userId passed to datadogRum.setUser() (see UserIdentification.service.ts)
// DatadogProvider hooks into the existing DD_RUM global — does NOT re-initialize RUM
// Adapt: add domain-specific attributes to context (plan, role, etc.)

const _provider = new DatadogProvider({
  applicationId: environment.ddRumApplicationId,
  clientToken: environment.ddRumClientToken,
  site: environment.ddSite || 'datadoghq.com',
  env: environment.ddEnv || 'local',
});

export async function initFeatureFlags(userId: string, plan: string): Promise<void> {
  await OpenFeature.setProviderAndWait(_provider, { targetingKey: userId, plan });
}
