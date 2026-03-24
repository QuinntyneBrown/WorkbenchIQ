# 01 - Project Structure

## Directory Layout

```
WorkbenchIQ/
├── api_server.py              ← Entry point (Program.cs + Controllers)
├── app/                       ← Backend application code (src/)
│   ├── config.py              ← Settings (appsettings.json)
│   ├── personas.py            ← Multi-persona definitions
│   ├── prompts.py             ← Prompt catalog management
│   ├── storage.py             ← File & metadata handling
│   ├── processing.py          ← Document processing orchestration
│   ├── openai_client.py       ← Azure OpenAI integration
│   ├── content_understanding_client.py  ← Azure CU integration
│   ├── large_document_processor.py      ← Progressive summarization
│   ├── glossary.py            ← Domain terminology CRUD
│   ├── underwriting_policies.py         ← Policy loading & formatting
│   ├── utils.py               ← Logging & helpers
│   ├── claims/                ← Automotive claims module
│   │   ├── api.py             ← Claims API router (ClaimsController)
│   │   ├── engine.py          ← Policy evaluation engine
│   │   ├── policies.py        ← Claims policy loader
│   │   ├── search.py          ← Policy search service
│   │   ├── indexer.py         ← Policy chunk indexer
│   │   └── chunker.py         ← Text chunking
│   ├── mortgage/              ← Canadian mortgage module (OSFI B-20)
│   │   ├── processor.py       ← Document processing
│   │   ├── router.py          ← Doc type classification
│   │   ├── calculator.py      ← GDS/TDS ratio calculations
│   │   ├── aggregator.py      ← Multi-document aggregation
│   │   ├── policy_engine.py   ← Mortgage policy evaluation
│   │   ├── provenance.py      ← Field source tracking
│   │   ├── stress_test.py     ← OSFI B-20 stress testing
│   │   ├── doc_classifier.py  ← Document type detection
│   │   ├── constants.py       ← Regulatory thresholds
│   │   ├── extractors/        ← Specialized field extractors
│   │   │   ├── borrower_extractor.py
│   │   │   ├── income_extractor.py
│   │   │   ├── loan_extractor.py
│   │   │   ├── property_extractor.py
│   │   │   └── credit_extractor.py
│   │   ├── rag/               ← Mortgage-specific RAG
│   │   ├── risk_analysis.py   ← Risk scoring
│   │   └── storage.py         ← Mortgage storage
│   ├── multimodal/            ← Image/video processing
│   │   ├── processor.py       ← Parallel multimodal orchestration
│   │   ├── repository.py      ← Damage area storage
│   │   ├── mime_detector.py   ← Content type detection
│   │   ├── extractors/        ← Media-specific extractors
│   │   │   ├── document_extractor.py
│   │   │   ├── image_extractor.py
│   │   │   └── video_extractor.py
│   │   ├── router.py          ← Media type routing
│   │   └── aggregator.py      ← Result aggregation
│   ├── rag/                   ← Retrieval-Augmented Generation
│   │   ├── service.py         ← Unified RAG interface
│   │   ├── search.py          ← Hybrid search (semantic + keyword)
│   │   ├── embeddings.py      ← Azure OpenAI embeddings
│   │   ├── context.py         ← Context assembly
│   │   ├── repository.py      ← PostgreSQL CRUD
│   │   ├── indexer.py         ← Policy indexer
│   │   ├── chunker.py         ← Text chunking
│   │   ├── unified_indexer.py ← Multi-persona indexing
│   │   └── router.py          ← RAG API routes
│   ├── database/              ← Database abstraction
│   │   ├── client.py          ← AsyncPG wrapper
│   │   ├── pool.py            ← Connection pooling
│   │   └── settings.py        ← DB configuration
│   └── storage_providers/     ← Storage abstraction
│       ├── base.py            ← Storage protocol (interface)
│       ├── local.py           ← Local filesystem
│       └── azure_blob.py      ← Azure Blob Storage
├── frontend/                  ← Next.js frontend (Angular app)
│   ├── src/
│   │   ├── app/               ← Pages (Angular route components)
│   │   │   ├── layout.tsx     ← Root layout (AppComponent)
│   │   │   ├── page.tsx       ← Landing page (HomeComponent)
│   │   │   ├── admin/page.tsx ← Admin panel
│   │   │   ├── login/page.tsx ← Login page (future)
│   │   │   ├── globals.css    ← Tailwind base styles
│   │   │   └── api/           ← API proxy routes
│   │   │       ├── [...path]/route.ts  ← Catch-all proxy
│   │   │       ├── applications/       ← Application endpoints
│   │   │       ├── auth/               ← Auth endpoints
│   │   │       └── health/route.ts     ← Health check
│   │   ├── components/        ← React components (~63)
│   │   │   ├── WorkbenchView.tsx  ← Main workbench layout
│   │   │   ├── TopNav.tsx         ← Navigation header
│   │   │   ├── ChatDrawer.tsx     ← Ask IQ chat panel
│   │   │   ├── chat/              ← Chat UI components
│   │   │   ├── claims/            ← Claims UI components
│   │   │   ├── mortgage/          ← Mortgage UI components
│   │   │   └── ...               ← 50+ more components
│   │   └── lib/               ← Shared utilities (Angular services)
│   │       ├── types.ts       ← TypeScript interfaces
│   │       ├── api.ts         ← API client (HttpClient)
│   │       ├── PersonaContext.tsx  ← State management
│   │       ├── personas.ts   ← Persona definitions
│   │       ├── auth.ts       ← Auth utilities
│   │       └── utils.ts      ← Formatting helpers
│   ├── package.json           ← Dependencies (*.csproj)
│   ├── tsconfig.json          ← TypeScript config
│   ├── tailwind.config.js     ← Tailwind configuration
│   ├── next.config.js         ← Next.js settings
│   └── postcss.config.js      ← PostCSS plugins
├── prompts/                   ← LLM prompts & policy files
│   ├── prompts.json           ← Prompt catalog
│   ├── risk-analysis-prompts.json
│   ├── large-document-prompts.json
│   ├── life-health-underwriting-policies.json
│   ├── life-health-claims-policies.json
│   ├── automotive-claims-policies.json
│   ├── property-casualty-claims-policies.json
│   ├── mortgage-underwriting-policies.json
│   └── glossary.json          ← Domain terminology
├── scripts/                   ← DevOps & startup
│   ├── run_frontend.sh        ← Multi-platform runner
│   ├── run_frontend.bat       ← Windows runner
│   ├── startup.sh             ← Production startup
│   └── set_webapp_settings.sh ← Azure App Service config
├── tests/                     ← Test suite (pytest)
│   ├── test_auto_claims_phase*.py   ← Claims tests (8 phases)
│   ├── test_glossary_phase*.py      ← Glossary tests (5 phases)
│   ├── test_mortgage_phase*.py      ← Mortgage tests (11 phases)
│   ├── test_config.py               ← Config tests
│   └── test_deep_dive_prompts.py    ← Prompt tests
├── docs/                      ← Documentation
├── specs/                     ← Specifications
├── pyproject.toml             ← Python package config (*.csproj)
├── requirements.txt           ← Python dependencies (packages.config)
└── README.md                  ← Project readme
```

## .NET / Angular Mapping

### Backend Structure Comparison

| Python (WorkbenchIQ) | .NET Equivalent | Purpose |
|----------------------|-----------------|---------|
| `api_server.py` | `Program.cs` + `Startup.cs` | App entry, DI, middleware, route registration |
| `app/config.py` | `appsettings.json` + `IOptions<T>` | Configuration classes |
| `app/*.py` (services) | `Services/*.cs` | Business logic |
| `app/claims/api.py` | `Controllers/ClaimsController.cs` | API endpoints |
| `app/storage_providers/base.py` | `Interfaces/IStorageProvider.cs` | Repository interface |
| `app/storage_providers/local.py` | `Repositories/LocalStorageProvider.cs` | Concrete implementation |
| `app/database/client.py` | `Data/ApplicationDbContext.cs` | Database access |
| `requirements.txt` | `*.csproj` PackageReference | Package dependencies |
| `pyproject.toml` | `*.csproj` project metadata | Build configuration |

### Frontend Structure Comparison

| Next.js (WorkbenchIQ) | Angular Equivalent | Purpose |
|-----------------------|-------------------|---------|
| `src/app/layout.tsx` | `app.component.ts` | Root component with providers |
| `src/app/page.tsx` | `home.component.ts` + routing | Page-level route component |
| `src/app/admin/page.tsx` | `admin.module.ts` + routing | Feature module |
| `src/components/` | `shared/components/` | Reusable UI components |
| `src/lib/api.ts` | `core/services/api.service.ts` | HTTP client service |
| `src/lib/PersonaContext.tsx` | `core/store/persona.store.ts` | State management |
| `src/lib/types.ts` | `core/models/*.ts` | TypeScript interfaces |
| `src/app/api/[...path]/route.ts` | `proxy.conf.json` | API proxy configuration |
| `package.json` | `package.json` | Same (npm) |
| `tsconfig.json` | `tsconfig.json` | Same |
| `tailwind.config.js` | `angular.json` styles config | CSS framework config |

### Key Conceptual Differences

1. **No DI Container**: Python doesn't use a DI container like `IServiceCollection`. Dependencies are created in `config.py` and passed explicitly or imported as modules.

2. **File-based Routing**: Next.js uses the filesystem for routing (`app/admin/page.tsx` = `/admin`). Angular uses explicit route definitions in `app-routing.module.ts`.

3. **No Decorators for Routes**: FastAPI uses Python decorators (`@app.get("/api/...")`) similar to ASP.NET attributes (`[HttpGet("api/...")]`), but they're applied inline rather than on controller classes.

4. **Single File API**: The entire backend API is defined in one file (`api_server.py`, ~3,773 lines) with sub-routers for claims and mortgage. In .NET, this would be split across multiple controllers.

5. **JSON Storage Default**: By default, data is stored as JSON files on disk rather than in a database. PostgreSQL is optional (for RAG). In .NET, you'd typically always use EF Core + SQL Server.
