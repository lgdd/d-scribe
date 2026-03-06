# Per-service SLOs — duplicate each resource block for key services,
# replacing {{SERVICE_NAME}} with the actual service tag value.

# --- Availability SLO ---------------------------------------------------------

resource "datadog_service_level_objective" "availability_{{SERVICE_NAME}}" {
  name        = "[${var.project_name}] {{SERVICE_NAME}} Availability"
  type        = "metric"
  description = "Availability SLO for {{SERVICE_NAME}} — tracks the ratio of successful (non-5xx) requests"

  query {
    numerator   = "sum:trace.http.request.hits{service:{{SERVICE_NAME}},env:${var.env}}.as_count() - sum:trace.http.request.errors{service:{{SERVICE_NAME}},env:${var.env}}.as_count()"
    denominator = "sum:trace.http.request.hits{service:{{SERVICE_NAME}},env:${var.env}}.as_count()"
  }

  thresholds {
    timeframe = "7d"
    target    = 99.9
    warning   = 99.95
  }

  thresholds {
    timeframe = "30d"
    target    = 99.9
    warning   = 99.95
  }

  timeframe         = "30d"
  target_threshold  = 99.9
  warning_threshold = 99.95

  tags = ["env:${var.env}", "service:{{SERVICE_NAME}}", "team:${var.team}"]
}

# --- Latency SLO --------------------------------------------------------------

resource "datadog_service_level_objective" "latency_{{SERVICE_NAME}}" {
  name        = "[${var.project_name}] {{SERVICE_NAME}} Latency (p95 < 500ms)"
  type        = "metric"
  description = "Latency SLO for {{SERVICE_NAME}} — tracks the ratio of requests with p95 latency below 500ms"

  query {
    numerator   = "sum:trace.http.request.duration.by.service.below_threshold.95p{service:{{SERVICE_NAME}},env:${var.env},threshold:0.5}.as_count()"
    denominator = "sum:trace.http.request.hits{service:{{SERVICE_NAME}},env:${var.env}}.as_count()"
  }

  thresholds {
    timeframe = "7d"
    target    = 99.0
    warning   = 99.5
  }

  thresholds {
    timeframe = "30d"
    target    = 99.0
    warning   = 99.5
  }

  timeframe         = "30d"
  target_threshold  = 99.0
  warning_threshold = 99.5

  tags = ["env:${var.env}", "service:{{SERVICE_NAME}}", "team:${var.team}"]
}
