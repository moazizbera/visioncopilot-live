.PHONY: help install dev test build clean verify docker-up docker-down

help:  ## Show this help message
	@echo "VisionCopilot Live - Common Commands"
	@echo "===================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:  ## Install all dependencies
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Installation complete!"

dev:  ## Start development servers (backend + frontend)
	@echo "Starting backend on http://localhost:8000"
	@echo "Starting frontend on http://localhost:5173"
	@echo "Press Ctrl+C to stop both servers"
	@cd backend && start cmd /k "uvicorn app.main:app --reload --port 8000"
	@cd frontend && npm run dev

dev-backend:  ## Start backend only
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:  ## Start frontend only
	cd frontend && npm run dev

test:  ## Run all tests
	@echo "Running backend tests..."
	cd backend && pytest tests/ || true
	@echo "Running frontend tests..."
	cd frontend && npm test || true

build:  ## Build for production
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "✅ Build complete: frontend/dist/"

verify:  ## Run pre-submission verification
	@echo "Running verification script..."
	python scripts/verify-submission.py

docker-up:  ## Start Docker containers
	docker-compose -f infrastructure/docker-compose.yml up

docker-down:  ## Stop Docker containers
	docker-compose -f infrastructure/docker-compose.yml down

docker-build:  ## Build Docker images
	docker-compose -f infrastructure/docker-compose.yml build

clean:  ## Remove build artifacts and cache
	@echo "Cleaning build artifacts..."
	@if exist backend\__pycache__ rd /s /q backend\__pycache__
	@if exist backend\app\__pycache__ rd /s /q backend\app\__pycache__
	@if exist backend\app\api\__pycache__ rd /s /q backend\app\api\__pycache__
	@if exist backend\app\core\__pycache__ rd /s /q backend\app\core\__pycache__
	@if exist backend\app\models\__pycache__ rd /s /q backend\app\models\__pycache__
	@if exist frontend\dist rd /s /q frontend\dist
	@if exist frontend\node_modules\.cache rd /s /q frontend\node_modules\.cache
	@echo "✅ Clean complete!"

setup:  ## First-time setup (copy env files)
	@echo "Setting up environment files..."
	@if not exist backend\.env copy backend\.env.example backend\.env
	@if not exist frontend\.env copy frontend\.env.example frontend\.env
	@echo "⚠️  Please edit backend\.env and add your GEMINI_API_KEY"
	@echo "✅ Environment files created!"

lint:  ## Run linters
	@echo "Linting frontend..."
	cd frontend && npm run lint
	@echo "✅ Linting complete!"

format:  ## Format code
	@echo "Formatting Python code..."
	cd backend && black app/ || echo "Install black: pip install black"
	@echo "Formatting TypeScript code..."
	cd frontend && npm run lint --fix || true
	@echo "✅ Formatting complete!"
