# 07 - AI Integration

## Overview

WorkbenchIQ integrates with two Azure AI services:

1. **Azure Content Understanding** — Extracts structured fields from documents, images, and videos
2. **Azure OpenAI** — Generates analysis, risk assessments, and conversational responses

> **.NET equivalent:** These integrations use Python's `httpx`/`requests` clients, equivalent to using `Azure.AI.FormRecognizer` and `Azure.AI.OpenAI` NuGet packages with `HttpClient`.

---

## Azure Content Understanding

### What It Does

Azure Content Understanding is a document intelligence service that:
- Extracts text and structure from PDFs (OCR + layout analysis)
- Detects fields matching a provided schema (e.g., "ApplicantName", "DateOfBirth")
- Assigns confidence scores to each extraction
- Provides bounding regions for source text grounding
- Processes images (damage detection) and videos (keyframe extraction)

### Client Architecture

**File:** `app/content_understanding_client.py`

```python
# Key functions (equivalent to Azure.AI.FormRecognizer.DocumentAnalysisClient)

def analyze_document(settings, file_path, analyzer_id) -> Dict:
    """Analyze a document using Azure CU. Returns raw result."""

def analyze_document_with_confidence(settings, file_path, schema) -> ExtractionResult:
    """Extract fields with confidence scoring. Returns structured result."""

def analyze_image(settings, file_path, analyzer_id) -> Dict:
    """Process an image file (e.g., damage photos)."""

def analyze_video(settings, file_path, analyzer_id) -> Dict:
    """Extract keyframes from a video file."""
```

### Long-Running Operation Pattern

Azure CU uses a polling pattern for document analysis:

```
1. POST /content-understanding/analyzers/{id}/analyze
   → Returns: Operation-Location header (URL to poll)

2. GET {operation-location}
   → Returns: { "status": "running", "percentCompleted": 45 }

3. GET {operation-location}  (repeat until done)
   → Returns: { "status": "succeeded", "result": { ... } }
```

**Timeout:** 900 seconds (15 minutes) for large documents.

> **.NET equivalent:**
> ```csharp
> var operation = await client.AnalyzeDocumentAsync(
>     WaitUntil.Completed, "prebuilt-document", fileStream);
> var result = operation.Value;
> ```
> The .NET SDK handles polling internally via `WaitUntil.Completed`.

### Authentication

Two methods supported:

1. **Azure AD** (recommended): Uses `DefaultAzureCredential` to get a bearer token
2. **API Key**: Sends key in `Ocp-Apim-Subscription-Key` header

```python
def _get_auth_headers(settings):
    if settings.use_azure_ad:
        credential = DefaultAzureCredential()
        token = credential.get_token("https://cognitiveservices.azure.com/.default")
        return {"Authorization": f"Bearer {token.token}"}
    else:
        return {"Ocp-Apim-Subscription-Key": settings.api_key}
```

### Custom Analyzers

The system can create custom analyzers with persona-specific field schemas:

```python
def create_analyzer(settings, name, schema) -> str:
    """Create a custom Azure CU analyzer with a field schema."""
    # POST /content-understanding/analyzers/{name}
    # Body: { "fieldSchema": schema }
```

---

## Azure OpenAI

### What It Does

Azure OpenAI provides:
- **Chat completions** — Structured analysis, risk assessment, conversational Q&A
- **Embeddings** — Vector representations for RAG semantic search

### Client Architecture

**File:** `app/openai_client.py`

```python
def chat_completion(
    settings: OpenAISettings,
    messages: List[Dict[str, str]],    # [{"role": "system", "content": "..."}]
    temperature: float = 0.0,           # Deterministic for analysis
    max_tokens: int = 1200,
    deployment_override: str = None,    # Use specific deployment
    model_override: str = None,
) -> Dict[str, Any]:
    """Azure OpenAI chat completion with retry & fallback."""
```

### Retry & Fallback Strategy

```
Request to Primary Endpoint
    ↓
Success? → Return result
    ↓ (429 Rate Limited)
Exponential Backoff Retry (up to 3 attempts)
    ↓
Still failing? → Try Fallback Endpoint
    ↓
Success? → Return result
    ↓
Raise Exception
```

> **.NET equivalent:** This is like using Polly with `HttpClientFactory`:
> ```csharp
> builder.Services.AddHttpClient("OpenAI")
>     .AddPolicyHandler(Policy.WaitAndRetryAsync(3,
>         retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))))
>     .AddPolicyHandler(Policy.FallbackAsync<HttpResponseMessage>(
>         fallbackAction: async ct => await _fallbackClient.SendAsync(...)));
> ```

### Deployment Configuration

WorkbenchIQ supports separate deployments for different purposes:

| Config | Purpose | Typical Model |
|--------|---------|--------------|
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Main analysis (extraction, risk) | GPT-4.1 |
| `AZURE_OPENAI_CHAT_DEPLOYMENT_NAME` | Chat (Ask IQ) - lighter/cheaper | GPT-4.1-mini |
| `AZURE_OPENAI_FALLBACK_ENDPOINT` | Rate limit fallback | Same model, different resource |

### Temperature Settings

| Use Case | Temperature | Why |
|----------|-------------|-----|
| Document analysis | 0.0 | Deterministic, consistent results |
| Risk assessment | 0.0 | Policy compliance needs precision |
| Chat (Ask IQ) | 0.3 | Slightly creative, natural responses |

---

## Embedding Client

**File:** `app/rag/embeddings.py`

Used for RAG vector search:

```python
class EmbeddingClient:
    def embed(text: str) -> List[float]:
        """Generate a 1536-dimensional embedding vector."""
        response = client.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        return response.data[0].embedding

    def embed_batch(texts: List[str]) -> List[List[float]]:
        """Batch embedding for efficiency."""
```

> **.NET equivalent:**
> ```csharp
> var client = new EmbeddingClient("text-embedding-3-small", credential);
> var embedding = await client.GenerateEmbeddingAsync(text);
> ReadOnlyMemory<float> vector = embedding.Value.Vector;
> ```

---

## Token Management

### Problem

LLMs have context window limits. A 3 MB insurance document can produce 1.5M+ tokens of markdown, far exceeding GPT-4's context window.

### Solution: Progressive Summarization

**File:** `app/large_document_processor.py`

```
Input: 3 MB document (~1.5M tokens)

Phase 1 - Batch Summarization:
├── Split into ~20-page batches
├── Each batch: ~50K characters
├── Summarize each batch → ~200 tokens
├── Sequential processing (rate limit safe)
└── Total: 8 batches × 200 tokens = 1,600 tokens

Phase 2 - Consolidation:
├── Combine batch summaries (1,600 tokens)
├── Add extracted field data
├── Limit to ~15K tokens total
└── Result: Comprehensive context within token budget

Output: ~15K tokens → Fits in LLM context window
```

### Token Counting

Uses `tiktoken` library to count tokens before sending to the LLM:

```python
import tiktoken
encoder = tiktoken.encoding_for_model("gpt-4")
token_count = len(encoder.encode(text))
```

> **.NET equivalent:** Use `Microsoft.ML.Tokenizers` or `SharpToken` NuGet packages.

---

## Prompt Engineering

### Prompt Structure

Every LLM call follows this pattern:

```
System Message:
├── Persona role definition
├── Domain policies (from RAG or full injection)
├── Glossary terms
├── Output format instructions
└── Constraints and guardrails

User Message:
├── Document markdown (or condensed summary)
├── Extracted fields (JSON)
└── Specific question or analysis request
```

### Prompt Files

| File | Purpose |
|------|---------|
| `prompts/prompts.json` | Section-specific analysis prompts |
| `prompts/risk-analysis-prompts.json` | Risk evaluation template |
| `prompts/large-document-prompts.json` | Batch summarization templates |

### Prompt Management API

The Admin Panel provides CRUD for prompts:

```
GET    /api/prompts                     → List all prompts
PUT    /api/prompts/{section}/{sub}     → Update a prompt
POST   /api/prompts/{section}/{sub}     → Create new prompt
DELETE /api/prompts/{section}/{sub}     → Reset to default
```

This allows non-developers to tune LLM behavior without code changes.
