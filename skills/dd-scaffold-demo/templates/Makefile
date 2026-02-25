.DEFAULT_GOAL := help

.PHONY: build up down logs smoke-test traffic clean help

build: ## Build all service images
	docker compose build

up: ## Build and start the full stack
	docker compose up --build -d

down: ## Stop all services
	docker compose down

logs: ## Tail logs from all services
	docker compose logs -f

smoke-test: ## Run the smoke-test script
	bash scripts/smoke-test.sh

traffic: ## Start only the traffic generator
	docker compose up -d traffic

clean: ## Stop services, remove volumes and images
	docker compose down -v --rmi local

help: ## List available targets
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
