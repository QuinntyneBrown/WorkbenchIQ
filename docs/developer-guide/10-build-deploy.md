# 10 - Build & Deploy

## Overview

This guide covers local development setup, build processes, and deployment options.

> **.NET mapping:**
> - `pip install` = `dotnet restore`
> - `uvicorn` = Kestrel
> - `npm run dev` = `ng serve`
> - `.env` file = `appsettings.Development.json`
> - Azure App Service deployment = same concept in both stacks

---

## Prerequisites

| Tool | Version | .NET Equivalent |
|------|---------|-----------------|
| Python | 3.10+ | .NET SDK 8.0+ |
| Node.js | 18+ | Same |
| npm | 9+ | Same |
| Git | Latest | Same |
| Azure CLI | Latest (for `az login`) | Same |

### Azure Resources Required

| Resource | Purpose | Required? |
|----------|---------|-----------|
| Azure Content Understanding | Document extraction | Yes |
| Azure OpenAI (GPT-4) | LLM analysis & chat | Yes |
| Azure Blob Storage | File storage (production) | Optional (local FS for dev) |
| PostgreSQL + pgvector | RAG vector search | Optional |

---

## Local Development Setup

### Step 1: Clone & Install Backend

```bash
# Clone repository
git clone <repo-url>
cd WorkbenchIQ

# Create Python virtual environment (equivalent to isolated project restore)
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies (equivalent to: dotnet restore)
pip install -r requirements.txt
```

> **.NET equivalent:**
> ```bash
> dotnet new webapi -n WorkbenchIQ
> cd WorkbenchIQ
> dotnet restore
> ```

### Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your Azure credentials
# (equivalent to editing appsettings.Development.json)
```

**Minimum required variables:**

```bash
# Azure Content Understanding
AZURE_CONTENT_UNDERSTANDING_ENDPOINT=https://your-resource.cognitiveservices.azure.com
AZURE_CONTENT_UNDERSTANDING_API_KEY=your-api-key

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4-1

# Storage (use local for development)
STORAGE_BACKEND=local
UW_APP_STORAGE_ROOT=data
UW_APP_PROMPTS_ROOT=prompts
```

### Step 3: Start Backend

```bash
# Development mode with hot reload (equivalent to: dotnet watch run)
uvicorn api_server:app --reload --port 8000

# Production mode
uvicorn api_server:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

> **.NET equivalent:**
> ```bash
> dotnet watch run          # Development
> dotnet run                # Production
> ```

### Step 4: Install & Start Frontend

```bash
# In a new terminal
cd frontend

# Install dependencies (same as Angular)
npm install

# Start development server (equivalent to: ng serve)
npm run dev
```

The frontend will be available at `http://localhost:3000` and will proxy API calls to `http://localhost:8000`.

### Step 5: Verify Setup

1. Open `http://localhost:3000` in your browser
2. Select a persona from the dropdown
3. Create a new application and upload a test PDF
4. Click "Extract" to verify Azure CU connection
5. Click "Analyze" to verify Azure OpenAI connection

---

## Using the Startup Scripts

### Windows

```bash
scripts\run_frontend.bat
```

### macOS / Linux

```bash
chmod +x scripts/run_frontend.sh
./scripts/run_frontend.sh
```

These scripts start both the backend and frontend concurrently.

---

## Build Process

### Backend

Python doesn't have a "build" step like .NET's compilation. The source files are interpreted directly. However, for production:

```bash
# Lint (equivalent to: dotnet format)
ruff check app/ api_server.py

# Format (equivalent to: dotnet format)
black app/ api_server.py

# Type checking (equivalent to: built-in C# type safety)
# Not currently configured, but could use mypy
```

### Frontend

```bash
cd frontend

# Production build (equivalent to: ng build --configuration production)
npm run build

# Output goes to: frontend/.next/
# Angular equivalent: dist/
```

The production build:
- Compiles TypeScript to JavaScript
- Optimizes and bundles assets
- Generates static pages where possible
- Creates a standalone Node.js server

---

## Deployment Options

### Option 1: Azure App Service

**Backend:**

```bash
# Deploy Python app to Azure App Service
az webapp up \
  --runtime "PYTHON:3.12" \
  --name workbenchiq-api \
  --resource-group workbenchiq-rg

# Set environment variables
./scripts/set_webapp_settings.sh
```

**Frontend:**

```bash
cd frontend
npm run build

az webapp up \
  --runtime "NODE:18-lts" \
  --name workbenchiq-frontend \
  --resource-group workbenchiq-rg
```

### Option 2: Azure Container Apps

```dockerfile
# Backend Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
CMD ["npm", "start"]
```

### Option 3: Single VM / Local Server

```bash
# Start both services
./scripts/startup.sh

# Or manually:
# Terminal 1: Backend
uvicorn api_server:app --host 0.0.0.0 --port 8000 --workers 4

# Terminal 2: Frontend
cd frontend && npm run build && npm start
```

---

## Environment Configuration by Stage

| Variable | Development | Staging | Production |
|----------|------------|---------|------------|
| `STORAGE_BACKEND` | `local` | `azure_blob` | `azure_blob` |
| `DATABASE_BACKEND` | `json` | `postgresql` | `postgresql` |
| `RAG_ENABLED` | `false` | `true` | `true` |
| `AZURE_CONTENT_UNDERSTANDING_USE_AZURE_AD` | `false` | `true` | `true` |
| `FRONTEND_URL` | `http://localhost:3000` | `https://staging.example.com` | `https://app.example.com` |

---

## Monitoring & Health Checks

### Health Endpoint

```
GET /api/health → { "status": "healthy", "version": "1.0" }
```

### Key Metrics to Monitor

| Metric | Where | What to Watch |
|--------|-------|--------------|
| Azure CU latency | Processing logs | >30s per document |
| OpenAI rate limits | 429 responses | Hit TPM/RPM quotas |
| Storage I/O | App logs | Failed reads/writes |
| RAG query latency | Database logs | >500ms per search |
| Frontend build time | CI/CD pipeline | >5 minutes |

### Logging

The backend uses Python's `logging` module:

```python
import logging
logger = logging.getLogger(__name__)

logger.info("Processing application %s", app_id)
logger.warning("Rate limited, retrying in %d seconds", delay)
logger.error("Failed to analyze document: %s", str(error))
```

> **.NET equivalent:** `ILogger<T>` via DI:
> ```csharp
> _logger.LogInformation("Processing application {AppId}", appId);
> ```

---

## Common Development Tasks

| Task | Command | .NET Equivalent |
|------|---------|-----------------|
| Start backend (dev) | `uvicorn api_server:app --reload` | `dotnet watch run` |
| Start frontend (dev) | `cd frontend && npm run dev` | `ng serve` |
| Run tests | `pytest` | `dotnet test` |
| Run single test | `pytest tests/test_config.py` | `dotnet test --filter TestConfig` |
| Install new dependency | `pip install <pkg> && pip freeze > requirements.txt` | `dotnet add package <pkg>` |
| Format code | `black .` | `dotnet format` |
| Lint code | `ruff check .` | `dotnet format --verify-no-changes` |
| Check types | `mypy app/` (if configured) | Built-in (C# compiler) |
| Build frontend | `cd frontend && npm run build` | `ng build` |
