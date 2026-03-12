# Outputs — expose resource URLs and IDs for easy access after apply.
# Duplicate the per-service outputs for each service, replacing
# {{SERVICE_NAME}} with the actual service tag value.

output "dashboard_url" {
  description = "URL of the service overview dashboard"
  value       = datadog_dashboard.service_overview.url
}

output "monitor_error_rate_{{SERVICE_NAME}}_id" {
  description = "ID of the error-rate monitor for {{SERVICE_NAME}}"
  value       = datadog_monitor.error_rate_{{SERVICE_NAME}}.id
}

output "monitor_latency_{{SERVICE_NAME}}_id" {
  description = "ID of the p95 latency monitor for {{SERVICE_NAME}}"
  value       = datadog_monitor.latency_p95_{{SERVICE_NAME}}.id
}

output "monitor_throughput_{{SERVICE_NAME}}_id" {
  description = "ID of the low-throughput monitor for {{SERVICE_NAME}}"
  value       = datadog_monitor.low_throughput_{{SERVICE_NAME}}.id
}

output "slo_availability_{{SERVICE_NAME}}_id" {
  description = "ID of the availability SLO for {{SERVICE_NAME}}"
  value       = datadog_service_level_objective.availability_{{SERVICE_NAME}}.id
}

output "slo_latency_{{SERVICE_NAME}}_id" {
  description = "ID of the latency SLO for {{SERVICE_NAME}}"
  value       = datadog_service_level_objective.latency_{{SERVICE_NAME}}.id
}
