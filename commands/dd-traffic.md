# Generate traffic for the demo

Create or configure the Locust traffic service for this demo project.

The traffic generator runs as a service inside Docker Compose or Kubernetes, producing consistent synthetic traffic for the lifetime of the stack. It is excluded from Datadog monitoring.

Specify preferences (or use defaults):

- **Traffic pattern**: steady, periodic ramp, seasonal wave, or burst spike
- **Failure scenarios**: named scenarios triggered by magic values (product IDs, coupon codes) — frequency controlled by task weights
- **Duration**: continuous or fixed time window

Use the `dd-generate-traffic` skill to detect project endpoints and generate a Locust-based traffic service with golden-path and named failure scenarios.
