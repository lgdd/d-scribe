# Generate traffic for the demo

Create or configure the Locust traffic service for this demo project.

The traffic generator runs as a service inside Docker Compose or Kubernetes, producing consistent synthetic traffic for the lifetime of the stack. It is excluded from Datadog monitoring.

Specify preferences (or use defaults):

- **Traffic pattern**: steady, periodic ramp, seasonal wave, or burst spike
- **Error rate**: fraction of requests triggering the failure path (default: 10%)
- **Duration**: continuous or fixed time window

Use the `dd-generate-traffic` skill to detect project endpoints and generate a Locust-based traffic service with both golden-path and failure-path scenarios.
