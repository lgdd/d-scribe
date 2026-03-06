# Per-service monitors — duplicate each resource block for every service,
# replacing {{SERVICE_NAME}} with the actual service tag value.

# --- High Error Rate ----------------------------------------------------------

resource "datadog_monitor" "error_rate_{{SERVICE_NAME}}" {
  name    = "[${var.project_name}] High error rate on {{SERVICE_NAME}}"
  type    = "metric alert"
  message = <<-EOT
    Error rate on {{SERVICE_NAME}} exceeded {{threshold}}%.

    {{#is_warning}}
    Warning: error rate is elevated. Investigate recent deployments.
    {{/is_warning}}

    {{#is_alert}}
    Critical: error rate is above acceptable levels. Check APM error tracking.
    {{/is_alert}}

    @slack-{{CHANNEL}} @pagerduty-{{SERVICE}}
  EOT

  query = "sum(last_5m):sum:trace.http.request.errors{service:{{SERVICE_NAME}},env:${var.env}}.as_count() / sum:trace.http.request.hits{service:{{SERVICE_NAME}},env:${var.env}}.as_count() * 100 > 5"

  monitor_thresholds {
    warning  = 2
    critical = 5
  }

  include_tags        = true
  notify_no_data      = false
  renotify_interval   = 60
  evaluation_delay    = 60

  tags = ["env:${var.env}", "service:{{SERVICE_NAME}}", "team:${var.team}"]
}

# --- High p95 Latency --------------------------------------------------------

resource "datadog_monitor" "latency_p95_{{SERVICE_NAME}}" {
  name    = "[${var.project_name}] High p95 latency on {{SERVICE_NAME}}"
  type    = "metric alert"
  message = <<-EOT
    p95 latency on {{SERVICE_NAME}} exceeded {{threshold}}s.

    {{#is_alert}}
    Check APM service page for slow endpoints and downstream dependencies.
    {{/is_alert}}

    @slack-{{CHANNEL}}
  EOT

  query = "avg(last_5m):avg:trace.http.request.duration.by.service.95p{service:{{SERVICE_NAME}},env:${var.env}} > 1"

  monitor_thresholds {
    warning  = 0.5
    critical = 1
  }

  include_tags        = true
  notify_no_data      = false
  renotify_interval   = 60

  tags = ["env:${var.env}", "service:{{SERVICE_NAME}}", "team:${var.team}"]
}

# --- Low Throughput -----------------------------------------------------------

resource "datadog_monitor" "low_throughput_{{SERVICE_NAME}}" {
  name    = "[${var.project_name}] Low throughput on {{SERVICE_NAME}}"
  type    = "metric alert"
  message = <<-EOT
    {{SERVICE_NAME}} received fewer than {{threshold}} requests in the last 10 minutes.

    This may indicate the service is down or unreachable.

    @slack-{{CHANNEL}}
  EOT

  query = "sum(last_10m):sum:trace.http.request.hits{service:{{SERVICE_NAME}},env:${var.env}}.as_count() < 1"

  monitor_thresholds {
    critical = 1
  }

  include_tags        = true
  notify_no_data      = true
  no_data_timeframe   = 15

  tags = ["env:${var.env}", "service:{{SERVICE_NAME}}", "team:${var.team}"]
}

# --- Composite Health ---------------------------------------------------------
# Fires when BOTH error rate AND latency monitors trigger for the same service.

resource "datadog_monitor" "composite_health_{{SERVICE_NAME}}" {
  name    = "[${var.project_name}] {{SERVICE_NAME}} degraded (errors + latency)"
  type    = "composite"
  message = <<-EOT
    {{SERVICE_NAME}} is experiencing both high error rate and high latency.

    This typically indicates a systemic issue — check downstream dependencies,
    database connections, and recent deployments.

    @slack-{{CHANNEL}} @pagerduty-{{SERVICE}}
  EOT

  query = "${datadog_monitor.error_rate_{{SERVICE_NAME}}.id} && ${datadog_monitor.latency_p95_{{SERVICE_NAME}}.id}"

  tags = ["env:${var.env}", "service:{{SERVICE_NAME}}", "team:${var.team}"]
}
