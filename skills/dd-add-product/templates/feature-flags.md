# Feature Flags Tracking

## Prerequisites

- Application service already instrumented with the Datadog tracer (`ddtrace`, `dd-trace`, `dd-java-agent`)
- A feature flag provider SDK in the application (LaunchDarkly, Split, CloudBees, Flagsmith, or custom)
- Datadog Agent with APM enabled

## Agent Configuration

No special Agent changes required — feature flag data flows through the standard APM pipeline via trace span tags.

## Application Changes

### How It Works

Datadog Feature Flag Tracking captures feature flag evaluations as tags on APM trace spans. This links flag state to performance data, errors, and user experience — enabling you to see the impact of a flag change on latency, error rate, or RUM sessions.

### Integration with Feature Flag Providers

| Provider | Library | Auto-Instrumentation |
|---|---|---|
| LaunchDarkly | `launchdarkly-server-sdk` | Yes (Python, Node.js, Java, Go, Ruby, .NET) |
| Split | `splitio` | Yes (Python, Node.js, Java) |
| CloudBees | `cloudbees-feature-management` | Yes (Java) |
| Flagsmith | `flagsmith` | Yes (Python, Node.js) |
| OpenFeature | `openfeature` | Yes (Python, Node.js, Java, Go) |
| Custom | Any | Manual instrumentation required |

### Auto-Instrumentation (supported providers)

For supported providers, the Datadog tracer automatically captures flag evaluations when the feature flag provider SDK is used. Enable tracking:

```yaml
environment:
  - DD_TRACE_FEATURE_FLAG_ENABLED=true
```

### Manual Instrumentation (custom or unsupported providers)

For custom implementations, add flag evaluations to the current trace span manually:

**Python:**

```python
from ddtrace import tracer

span = tracer.current_span()
if span:
    span.set_tag("feature_flag.name", "new-checkout-flow")
    span.set_tag("feature_flag.value", "enabled")
    span.set_tag("feature_flag.variant", "variant-a")
```

**Node.js:**

```javascript
const tracer = require('dd-trace');

const span = tracer.scope().active();
if (span) {
  span.setTag('feature_flag.name', 'new-checkout-flow');
  span.setTag('feature_flag.value', 'enabled');
  span.setTag('feature_flag.variant', 'variant-a');
}
```

**Java:**

```java
import datadog.trace.api.GlobalTracer;
import datadog.trace.api.DDSpan;

DDSpan span = (DDSpan) GlobalTracer.get().activeSpan();
if (span != null) {
    span.setTag("feature_flag.name", "new-checkout-flow");
    span.setTag("feature_flag.value", "enabled");
    span.setTag("feature_flag.variant", "variant-a");
}
```

### RUM Feature Flags (frontend)

For frontend feature flags visible in RUM sessions:

```javascript
import { datadogRum } from '@datadog/browser-rum';

datadogRum.addFeatureFlagEvaluation('new-checkout-flow', 'enabled');
```

## Deployment Config

No additional containers needed. Feature flag tracking runs inside the application process.

## Cross-Product Wiring

- **APM**: Flag evaluations appear as span tags — filter traces by flag name/value to compare performance between variants
- **RUM**: Frontend flag evaluations link to user sessions, errors, and performance metrics
- **Error Tracking**: Correlate new errors with recent flag changes
- **Dashboards**: Create widgets that compare metrics across flag variants

## Failure Scenarios

| Scenario | Datadog Signal |
|---|---|
| Flag rollout causes error spike | Error rate increase filtered by `feature_flag.name` in APM |
| Flag variant degrades latency | P95 latency increase for requests with specific flag value |
| Flag evaluation failure | Missing flag tags on spans, fallback behavior in application |

## References

- [Feature Flag Tracking](https://docs.datadoghq.com/real_user_monitoring/feature_flag_tracking/)
- [APM Feature Flag Data](https://docs.datadoghq.com/tracing/trace_collection/feature_flag_data/)
- [RUM Feature Flags](https://docs.datadoghq.com/real_user_monitoring/feature_flag_tracking/)
