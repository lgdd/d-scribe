# Shared variables — values must match Unified Service Tagging labels
# (DD_ENV, DD_SERVICE) used in the deployment config.

variable "env" {
  description = "Datadog environment tag (e.g. dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "service_names" {
  description = "List of service names instrumented in this project"
  type        = list(string)
}

variable "team" {
  description = "Team tag applied to all Datadog resources"
  type        = string
  default     = "demo"
}

variable "dd_site" {
  description = "Datadog site for API URL resolution"
  type        = string
  default     = "datadoghq.com"
}

variable "project_name" {
  description = "Human-readable project name used in dashboard/monitor/SLO titles"
  type        = string
}
