# Real User Monitoring (RUM)

## Prerequisites

- A **frontend service** must exist in the project (SPA, SSR, or static site)
- A Datadog RUM application must be created in the Datadog UI to obtain `DD_APPLICATION_ID` and `DD_CLIENT_TOKEN`

## Agent Configuration

No Agent changes required — RUM data is sent directly from the browser to Datadog's intake, not through the Agent.

## Application Changes

Install the RUM Browser SDK and initialize it in the frontend entry point.

### SDK Installation

```bash
npm install @datadog/browser-rum
```

### SDK Initialization

```javascript
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: '<DD_APPLICATION_ID>',
  clientToken: '<DD_CLIENT_TOKEN>',
  site: '<DD_SITE>',
  service: '<frontend-service-name>',
  env: '<DD_ENV>',
  version: '<DD_VERSION>',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 100,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input',
  traceSampleRate: 100,
  allowedTracingUrls: [
    { match: 'http://localhost:8080', propagatorTypes: ['datadog', 'tracecontext'] }
  ]
});
```

`allowedTracingUrls` must include the backend API origin so the RUM SDK injects trace headers into fetch/XHR requests, enabling end-to-end RUM-to-APM correlation.

### User Identity (when Keycloak is present)

After OIDC login, set user identity on the RUM session:

```javascript
datadogRum.setUser({
  id: idToken.sub,
  email: idToken.email,
  name: idToken.preferred_username,
});
```

## Environment Variables

Add to `.env.example`:

```bash
# RUM — Browser SDK
DD_APPLICATION_ID=<your-rum-application-id>
DD_CLIENT_TOKEN=<your-rum-client-token>
```

The frontend must receive these values at build time or runtime (e.g., via Webpack DefinePlugin, Vite env, or server-rendered template).

## Deployment Config

No Docker Compose or K8s changes needed for RUM itself. If the frontend is served by a container, ensure it can reach the backend API at the URL configured in `allowedTracingUrls`.

## Cross-Product Wiring

- **APM**: `allowedTracingUrls` links RUM sessions to backend traces (see `dd-telemetry-correlation` rule)
- **Session Replay**: Enabled via `sessionReplaySampleRate` — set to `100` for demos
- **Error Tracking**: Frontend JS errors are automatically captured and linked to RUM sessions
- **Keycloak/Auth**: `datadogRum.setUser()` surfaces real user identity in Session Replay, Error Tracking, and RUM Explorer (see `dd-auth-sso` rule)

## Failure Scenarios

| Scenario | Datadog Signal |
|---|---|
| Frontend JS error | Error event in RUM Error Tracking with stack trace |
| Slow API response | Long resource timing in RUM, correlated APM trace waterfall |
| Failed fetch to backend | RUM resource error + missing/error APM trace |
| CORS misconfiguration | Trace headers blocked, RUM-APM correlation breaks |

## References

- [RUM Browser SDK Setup](https://docs.datadoghq.com/real_user_monitoring/browser/setup/)
- [Connect RUM and Traces](https://docs.datadoghq.com/real_user_monitoring/platform/connect_rum_and_traces/)
- [RUM Browser SDK API](https://docs.datadoghq.com/real_user_monitoring/browser/advanced_configuration/)
