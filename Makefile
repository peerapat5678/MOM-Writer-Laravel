# Convenience wrapper around docker compose (Linux/macOS/WSL; on Windows use scripts\start.ps1).
COMPOSE      = docker compose
COMPOSE_PROD = docker compose -f docker-compose.prod.yml

.DEFAULT_GOAL := help

.PHONY: help start up down restart build logs shell test artisan composer npm ps fresh prod-up prod-down

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

start: ## One-command setup + start (creates .env, picks a free port)
	@bash scripts/start.sh

up: ## Build and start the dev stack
	$(COMPOSE) up -d --build

down: ## Stop and remove the dev stack
	$(COMPOSE) down

restart: ## Restart the dev stack
	$(COMPOSE) restart

build: ## Rebuild images
	$(COMPOSE) build

logs: ## Tail app logs
	$(COMPOSE) logs -f app

shell: ## Open a shell in the app container
	$(COMPOSE) exec app bash

test: ## Run the test suite
	$(COMPOSE) exec app php artisan test

artisan: ## Run an artisan command, e.g. make artisan c="migrate"
	$(COMPOSE) exec app php artisan $(c)

composer: ## Run a composer command, e.g. make composer c="require foo/bar"
	$(COMPOSE) exec app composer $(c)

npm: ## Run an npm command in the node container, e.g. make npm c="run build"
	$(COMPOSE) exec node npm $(c)

ps: ## Show container status
	$(COMPOSE) ps

fresh: ## Wipe volumes (vendor/node_modules/build) and rebuild from scratch
	$(COMPOSE) down -v
	$(COMPOSE) up -d --build

prod-up: ## Build and start the production stack
	$(COMPOSE_PROD) up -d --build

prod-down: ## Stop the production stack
	$(COMPOSE_PROD) down
