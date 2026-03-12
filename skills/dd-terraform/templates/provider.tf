terraform {
  required_version = ">= 1.1.5"

  required_providers {
    datadog = {
      source  = "DataDog/datadog"
      version = "~> 4.0"
    }
  }
}

locals {
  # Map DD_SITE values to provider API URLs.
  site_to_url = {
    "datadoghq.com"    = "https://api.datadoghq.com/"
    "datadoghq.eu"     = "https://api.datadoghq.eu/"
    "us3.datadoghq.com" = "https://api.us3.datadoghq.com/"
    "us5.datadoghq.com" = "https://api.us5.datadoghq.com/"
    "ap1.datadoghq.com" = "https://api.ap1.datadoghq.com/"
    "ddog-gov.com"     = "https://api.ddog-gov.com/"
  }
}

provider "datadog" {
  api_url = local.site_to_url[var.dd_site]
  # DD_API_KEY and DD_APP_KEY are read from the environment automatically.
}
