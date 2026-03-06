# Service overview dashboard — adapt widgets to the project's services and products.

resource "datadog_dashboard" "service_overview" {
  title       = "${var.project_name} — Service Overview"
  description = "Auto-generated overview for the ${var.env} environment"
  layout_type = "ordered"

  # --- Request Rate -----------------------------------------------------------

  widget {
    timeseries_definition {
      title = "Request Rate by Service"

      request {
        query {
          metric_query {
            name        = "hits"
            data_source = "metrics"
            query       = "sum:trace.http.request.hits{env:${var.env}} by {service}.as_count()"
          }
        }
        display_type = "bars"
      }
    }
  }

  # --- Error Rate -------------------------------------------------------------

  widget {
    timeseries_definition {
      title = "Error Rate by Service (%)"

      request {
        formula {
          formula_expression = "100 * errors / hits"
        }

        query {
          metric_query {
            name        = "errors"
            data_source = "metrics"
            query       = "sum:trace.http.request.errors{env:${var.env}} by {service}.as_count()"
          }
        }

        query {
          metric_query {
            name        = "hits"
            data_source = "metrics"
            query       = "sum:trace.http.request.hits{env:${var.env}} by {service}.as_count()"
          }
        }

        display_type = "line"
      }
    }
  }

  # --- Latency (p95) ---------------------------------------------------------

  widget {
    timeseries_definition {
      title = "p95 Latency by Service"

      request {
        query {
          metric_query {
            name        = "latency"
            data_source = "metrics"
            query       = "avg:trace.http.request.duration.by.service.95p{env:${var.env}} by {service}"
          }
        }
        display_type = "line"
      }
    }
  }

  # --- Log Stream -------------------------------------------------------------

  widget {
    log_stream_definition {
      title = "Recent Logs"
      query = "env:${var.env}"

      indexes             = ["main"]
      columns             = ["core_host", "core_service", "tag_source"]
      show_date_column    = true
      show_message_column = true
      message_display     = "expanded-md"

      sort {
        column = "time"
        order  = "desc"
      }
    }
  }

  # --- Per-Service Group (repeat for each service) ----------------------------
  # Duplicate this block for every service in the project, replacing
  # {{SERVICE_NAME}} with the actual service tag value.

  widget {
    group_definition {
      title       = "{{SERVICE_NAME}}"
      layout_type = "ordered"

      widget {
        query_value_definition {
          title = "Requests / min"

          request {
            query {
              metric_query {
                name        = "hits"
                data_source = "metrics"
                query       = "sum:trace.http.request.hits{service:{{SERVICE_NAME}},env:${var.env}}.as_count()"
              }
            }
            aggregator = "avg"
          }

          autoscale = true
        }
      }

      widget {
        query_value_definition {
          title = "Error Rate (%)"

          request {
            formula {
              formula_expression = "100 * errors / hits"
            }

            query {
              metric_query {
                name        = "errors"
                data_source = "metrics"
                query       = "sum:trace.http.request.errors{service:{{SERVICE_NAME}},env:${var.env}}.as_count()"
              }
            }

            query {
              metric_query {
                name        = "hits"
                data_source = "metrics"
                query       = "sum:trace.http.request.hits{service:{{SERVICE_NAME}},env:${var.env}}.as_count()"
              }
            }

            aggregator = "last"
          }

          autoscale  = true
          precision  = 2
        }
      }
    }
  }

  tags = ["env:${var.env}", "team:${var.team}"]
}
