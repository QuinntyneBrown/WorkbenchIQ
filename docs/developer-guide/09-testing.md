# 09 - Testing

## Overview

WorkbenchIQ uses **pytest** for testing, organized by feature with a phase-based naming convention.

> **.NET equivalent:** pytest is similar to xUnit/NUnit. Test files map to `*Tests.cs` classes. The phase pattern is like having `ClaimsTests_Phase1_Config.cs`, `ClaimsTests_Phase2_Router.cs`, etc.

---

## Test Organization

```
tests/
├── test_auto_claims_phase1_config.py      ← Configuration tests
├── test_auto_claims_phase2_router.py      ← Media routing tests
├── test_auto_claims_phase3_analyzers.py   ← Azure CU integration
├── test_auto_claims_phase4_processing.py  ← Multimodal processing
├── test_auto_claims_phase5_policy_engine.py ← Claims policy evaluation
├── test_auto_claims_phase6_rag.py         ← RAG indexing/search
├── test_auto_claims_phase7_api.py         ← API endpoint tests
├── test_auto_claims_phase9_migrations.py  ← Database migrations
│
├── test_glossary_phase1_data.py           ← Glossary data loading
├── test_glossary_phase2_admin.py          ← Admin API endpoints
├── test_glossary_phase3_llm.py            ← LLM prompt injection
├── test_glossary_phase4_chat.py           ← Chat integration
├── test_glossary_phase5_ui.py             ← Frontend integration
│
├── test_mortgage_phase1_config.py         ← Mortgage configuration
├── test_mortgage_phase2_router.py         ← Document routing
├── test_mortgage_phase3_analyzers.py      ← Field extraction
├── test_mortgage_phase4_processing.py     ← Processing pipeline
├── test_mortgage_phase5_extractors.py     ← Specialized extractors
├── test_mortgage_phase6_aggregator.py     ← Multi-doc aggregation
├── test_mortgage_phase7_calculator.py     ← GDS/TDS calculations
├── test_mortgage_phase8_stress_test.py    ← Stress testing
├── test_mortgage_phase9_policy.py         ← Policy evaluation
├── test_mortgage_phase10_provenance.py    ← Field provenance
├── test_mortgage_phase11_api.py           ← Mortgage API endpoints
│
├── test_config.py                         ← Core configuration
├── test_deep_dive_prompts.py              ← Medical deep dive prompts
└── check_indexes.py                       ← RAG index verification
```

### Phase Pattern Explained

Tests are numbered by phase to indicate build order and dependencies:

| Phase | Focus | .NET Equivalent |
|-------|-------|-----------------|
| Phase 1 | Configuration & settings | `ConfigurationTests` |
| Phase 2 | Routing & classification | `RouterTests` |
| Phase 3 | External service integration | `IntegrationTests` |
| Phase 4 | Processing pipelines | `ServiceTests` |
| Phase 5 | Specialized extractors | `ExtractorTests` |
| Phase 6+ | Higher-level features | Feature-specific tests |
| Last phase | API endpoint tests | `ControllerTests` |

---

## Running Tests

```bash
# Run all tests
pytest

# Run a specific test file
pytest tests/test_config.py

# Run tests matching a pattern
pytest -k "mortgage"

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=app --cov-report=html
```

> **.NET equivalent:**
> ```bash
> dotnet test
> dotnet test --filter "FullyQualifiedName~Mortgage"
> dotnet test --collect:"XPlat Code Coverage"
> ```

---

## Test Patterns

### Unit Test Example

```python
# tests/test_mortgage_phase7_calculator.py

def test_gds_calculation():
    """GDS should be housing costs / gross income."""
    result = calculate_gds(
        gross_income=100_000,
        mortgage_payment=1_500 * 12,
        property_tax=3_600,
        heating=1_800
    )
    assert result == pytest.approx(0.234, rel=0.01)

def test_gds_exceeds_limit():
    """GDS above 39% should fail OSFI B-20."""
    result = calculate_gds(
        gross_income=60_000,
        mortgage_payment=2_500 * 12,
        property_tax=4_000,
        heating=2_000
    )
    assert result > 0.39  # Exceeds limit
```

> **.NET equivalent:**
> ```csharp
> [Fact]
> public void GdsCalculation_ReturnsCorrectRatio()
> {
>     var result = _calculator.CalculateGds(100_000, 18_000, 3_600, 1_800);
>     Assert.Equal(0.234, result, precision: 2);
> }
> ```

### Mocking External Services

```python
# Using unittest.mock (equivalent to Moq/NSubstitute)
from unittest.mock import patch, MagicMock

@patch('app.openai_client.chat_completion')
def test_analysis_calls_openai(mock_chat):
    mock_chat.return_value = {
        "choices": [{"message": {"content": '{"summary": "test"}'}}]
    }

    result = run_analysis(app_metadata, sections=["customer_profile"])

    mock_chat.assert_called_once()
    assert result.llm_outputs["customer_profile"] is not None
```

> **.NET equivalent:**
> ```csharp
> var mockOpenAI = new Mock<IOpenAIClient>();
> mockOpenAI.Setup(x => x.ChatCompletionAsync(It.IsAny<...>()))
>     .ReturnsAsync(new { choices = new[] { ... } });
> ```

### API Endpoint Tests

```python
# Using FastAPI TestClient (equivalent to WebApplicationFactory)
from fastapi.testclient import TestClient
from api_server import app

client = TestClient(app)

def test_list_applications():
    response = client.get("/api/applications")
    assert response.status_code == 200
    assert "applications" in response.json()

def test_create_application():
    with open("test_doc.pdf", "rb") as f:
        response = client.post(
            "/api/applications",
            files={"files": ("test.pdf", f, "application/pdf")},
            data={"persona": "underwriting"}
        )
    assert response.status_code == 201
    assert "app_id" in response.json()
```

> **.NET equivalent:**
> ```csharp
> public class ApplicationsControllerTests : IClassFixture<WebApplicationFactory<Program>>
> {
>     private readonly HttpClient _client;
>
>     [Fact]
>     public async Task ListApplications_ReturnsOk()
>     {
>         var response = await _client.GetAsync("/api/applications");
>         response.EnsureSuccessStatusCode();
>     }
> }
> ```

---

## Test Configuration

### conftest.py (equivalent to TestFixture / TestBase)

Shared fixtures are typically defined in `conftest.py` (pytest convention):

```python
# conftest.py
import pytest

@pytest.fixture
def sample_settings():
    """Provide test settings without real Azure credentials."""
    return Settings(
        content_understanding=ContentUnderstandingSettings(
            endpoint="https://test.cognitiveservices.azure.com",
            api_key="test-key",
            use_azure_ad=False
        ),
        openai=OpenAISettings(
            endpoint="https://test.openai.azure.com",
            api_key="test-key",
            deployment_name="gpt-4-test"
        )
    )

@pytest.fixture
def sample_application():
    """Provide a sample ApplicationMetadata for testing."""
    return ApplicationMetadata(
        app_id="test-123",
        persona=PersonaType.UNDERWRITING,
        applicant_name="John Doe",
        status="created"
    )
```

---

## Test Coverage Areas

| Area | Test Files | Coverage |
|------|-----------|----------|
| Configuration | `test_config.py`, `*_phase1_*` | Settings loading, validation, defaults |
| Routing | `*_phase2_*` | Document/media type classification |
| Azure CU | `*_phase3_*` | Analyzer calls, field extraction |
| Processing | `*_phase4_*` | Pipeline orchestration, mode detection |
| Extractors | `*_phase5_*` | Field extraction per document type |
| Aggregation | `*_phase6_*` | Multi-document consolidation |
| Calculations | `*_phase7_*` | GDS/TDS, stress tests |
| Policy Engine | `*_phase9_*` | Policy evaluation logic |
| API Endpoints | `*_phase7/11_*` | HTTP request/response |
| Glossary | `test_glossary_*` | Term CRUD, LLM injection |
| Prompts | `test_deep_dive_prompts.py` | Prompt template validation |
