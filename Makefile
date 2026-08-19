.PHONY: help up down api-shell web-shell migrate lint test dev-api dev-web migrate-local

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev-api: ## Start API locally (no Docker)
	cd apps/api && .venv/bin/python migrate.py && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

dev-web: ## Start Next.js locally (no Docker)
	cd apps/web && npm run dev

migrate-local: ## Apply local DB migrations (add new columns)
	cd apps/api && .venv/bin/python migrate.py

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## Tail all service logs
	docker-compose logs -f

api-shell: ## Open a shell in the API container
	docker-compose exec api bash

web-shell: ## Open a shell in the web container
	docker-compose exec web sh

migrate: ## Run Alembic migrations
	docker-compose exec api alembic upgrade head

migrate-new: ## Create a new migration (usage: make migrate-new MSG="add users table")
	docker-compose exec api alembic revision --autogenerate -m "$(MSG)"

lint-api: ## Lint the FastAPI backend
	cd apps/api && ruff check . && ruff format --check . && mypy app

lint-web: ## Lint the Next.js frontend
	cd apps/web && npm run lint && npm run type-check

lint: lint-api lint-web ## Lint everything

test-api: ## Run backend tests
	docker-compose exec api pytest -v --cov=app --cov-report=term-missing

test-web: ## Run frontend tests
	cd apps/web && npm test

test: test-api test-web ## Run all tests

install: ## Install all dependencies
	cd apps/api && pip install -r requirements.txt
	cd apps/web && npm install
	pre-commit install
