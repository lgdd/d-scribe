# Generate Terraform for Datadog dashboards, monitors, and SLOs

Add Terraform-managed Datadog resources to the current demo project.

Use the `dd-terraform` skill to:

- Scaffold a `terraform/` directory with provider configuration
- Generate dashboards with widgets tailored to the project's services and products
- Generate monitors for error rate, latency, and throughput per service
- Generate SLOs with availability and latency targets
- Wire Makefile targets (`tf-init`, `tf-plan`, `tf-apply`, `tf-destroy`)
