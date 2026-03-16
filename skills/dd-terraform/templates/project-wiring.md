# Project Wiring

## Environment Variables

Add `DD_APP_KEY` to `.env.example` with a comment explaining it is required for Terraform. Sync to `.env` using host environment value.

## Makefile Targets

```makefile
tf-init:
	cd terraform && terraform init

tf-plan:
	cd terraform && terraform plan

tf-apply:
	cd terraform && terraform apply -auto-approve

tf-destroy:
	cd terraform && terraform destroy -auto-approve
```

## README Updates

- Add a **Terraform** section describing the dashboards, monitors, and SLOs that are managed
- Add the `tf-*` targets to the Makefile Targets table
- Add `DD_APP_KEY` to the Prerequisites variables table

## .gitignore Entries

Append if not already present:

```
terraform/.terraform/
terraform/*.tfstate
terraform/*.tfstate.backup
terraform/.terraform.lock.hcl
```

## Post-Generation Checklist

- [ ] `terraform/main.tf` reads credentials from environment (no hardcoded keys)
- [ ] Provider version is pinned with `~>` constraint
- [ ] All resources use tags aligned with Unified Service Tagging
- [ ] Dashboard widgets match the services and products in the project
- [ ] Monitors cover error rate, latency, and throughput per service
- [ ] SLOs have realistic targets and timeframes
- [ ] `.env.example` includes `DD_APP_KEY`
- [ ] `.env` synced with `DD_APP_KEY` from host environment
- [ ] Makefile has `tf-init`, `tf-plan`, `tf-apply`, `tf-destroy` targets
- [ ] `.gitignore` excludes Terraform state and provider cache
- [ ] `terraform validate` passes
- [ ] README updated with Terraform section and Makefile targets
