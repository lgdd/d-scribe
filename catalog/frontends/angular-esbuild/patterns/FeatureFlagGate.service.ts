import { Injectable } from '@angular/core';
import { OpenFeature } from '@openfeature/web-sdk';

// Pattern: Feature Flags — boolean gate and string variant via OpenFeature Angular service
// Inject this service and call after initFeatureFlags() resolves
// Adapt: replace flag keys with your configured Datadog flag names

@Injectable({ providedIn: 'root' })
export class FeatureFlagGateService {
  private client = OpenFeature.getClient();

  isCheckoutEnabled(): boolean {
    return this.client.getBooleanValue('checkout-new-flow', false);
  }

  getUiVariant(): string {
    const variant = this.client.getStringValue('ui-theme', 'control');
    const labels: Record<string, string> = { 'treatment-a': 'Theme A', 'treatment-b': 'Theme B' };
    return labels[variant] ?? 'Default Theme';
  }
}
