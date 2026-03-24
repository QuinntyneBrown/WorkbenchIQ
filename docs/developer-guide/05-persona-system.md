# 05 - Persona System

## Overview

WorkbenchIQ uses a **multi-persona architecture** that serves different insurance verticals from a single codebase. This is conceptually similar to a **multi-tenant system** in .NET where tenants share code but have different configurations, field schemas, prompts, and policies.

> **.NET equivalent:** Think of personas like tenant configurations in a multi-tenant SaaS app, where each tenant has different `IOptions<T>` values, different database schemas, and different business rules — but shares the same controllers and services.

---

## Persona Types

| Persona ID | Name | Domain | Status |
|-----------|------|--------|--------|
| `underwriting` | Life Insurance Underwriting | Life/health insurance applications | Active |
| `life_health_claims` | Life & Health Claims | Medical claims processing | Demo |
| `automotive_claims` | Automotive Claims | Auto damage assessment (multimodal) | Active |
| `mortgage_underwriting` | Mortgage Underwriting | Canadian OSFI B-20 compliance | Active |
| `property_casualty_claims` | P&C Claims | Property/casualty claims | Planned |

---

## Persona Configuration

Each persona defines:

```python
@dataclass
class PersonaConfig:
    id: str                        # "underwriting"
    name: str                      # "Life Insurance Underwriting"
    description: str               # UI description text
    icon: str                      # Emoji icon for UI
    color: str                     # Theme color (hex)
    field_schema: Dict             # Azure CU extraction schema (30+ fields)
    default_prompts: Dict          # LLM prompt templates
    custom_analyzer_id: str        # Azure CU analyzer name
    image_analyzer_id: str         # Image analyzer (claims only)
    video_analyzer_id: str         # Video analyzer (claims only)
```

### Field Schema Example (Underwriting)

The field schema tells Azure Content Understanding what to extract from documents:

```json
{
  "fields": {
    "ApplicantName": { "type": "string", "description": "Full name of the applicant" },
    "DateOfBirth": { "type": "date", "description": "Applicant's date of birth" },
    "Gender": { "type": "string", "description": "Male/Female/Other" },
    "Occupation": { "type": "string", "description": "Current occupation" },
    "Height": { "type": "string", "description": "Height in cm or feet/inches" },
    "Weight": { "type": "string", "description": "Weight in kg or lbs" },
    "CoverageAmount": { "type": "number", "description": "Requested coverage amount" },
    "MedicalConditions": { "type": "string", "description": "Pre-existing conditions" },
    "FamilyHistory": { "type": "string", "description": "Family medical history" },
    "Medications": { "type": "string", "description": "Current medications" },
    "LabResults": { "type": "string", "description": "Lab test results" }
  }
}
```

---

## How Personas Flow Through the System

### Backend Flow

```
1. API Request includes persona parameter
   POST /api/applications { persona: "underwriting", files: [...] }

2. Config resolves PersonaConfig
   config = get_persona_config("underwriting")

3. Processing uses persona-specific settings
   - field_schema → sent to Azure Content Understanding
   - custom_analyzer_id → which analyzer to use
   - default_prompts → which LLM prompts to apply

4. Policy evaluation uses persona-specific policies
   - "underwriting" → life-health-underwriting-policies.json
   - "automotive_claims" → automotive-claims-policies.json
   - "mortgage_underwriting" → mortgage-underwriting-policies.json

5. Chat uses persona-specific context
   - System prompt includes persona role definition
   - RAG searches persona-specific policy index
   - Glossary includes persona-specific terms
```

### Frontend Flow

```
1. PersonaContext stores current selection
   const { currentPersona } = usePersona();

2. UI adapts to persona
   - Different field layouts
   - Different analysis sections
   - Different policy displays
   - Persona-specific components (BodyDiagram for medical, DamageViewer for claims)

3. API calls include persona
   fetch(`/api/applications?persona=${currentPersona}`)
```

### .NET Equivalent Pattern

```csharp
// Tenant-aware service resolution in .NET
public class PersonaService : IPersonaService
{
    private readonly Dictionary<string, PersonaConfig> _configs;

    public PersonaConfig GetConfig(string personaId)
        => _configs[personaId];

    public IFieldSchema GetSchema(string personaId)
        => _configs[personaId].FieldSchema;

    public IPromptCatalog GetPrompts(string personaId)
        => _configs[personaId].DefaultPrompts;
}

// Usage in controller
[HttpPost("{id}/extract")]
public async Task<IActionResult> Extract(string id)
{
    var app = await _repo.GetAsync(id);
    var config = _personaService.GetConfig(app.Persona);
    var schema = config.FieldSchema;
    // Use schema for extraction...
}
```

---

## Prompt Catalog

Each persona has its own set of LLM prompt templates organized by section:

```
prompts.json
├── underwriting
│   ├── application_summary
│   │   ├── customer_profile
│   │   ├── medical_conditions
│   │   ├── risk_factors
│   │   └── requirements
│   └── medical_summary
│       ├── body_system_review
│       ├── abnormal_labs
│       └── pending_investigations
├── life_health_claims
│   ├── claim_summary
│   │   ├── claimant_profile
│   │   └── coverage_analysis
│   └── ...
├── automotive_claims
│   └── ...
└── mortgage_underwriting
    └── ...
```

### Prompt Injection Pattern

When analyzing a document, the system:

1. Loads the persona-specific prompt template
2. Injects the extracted markdown (or condensed context for large docs)
3. Injects the extracted fields as structured data
4. Injects glossary terms for domain terminology
5. Sends to Azure OpenAI

```python
# Simplified prompt assembly
system_prompt = f"""You are an expert {persona_config.role}.
Analyze the following application using these policies:
{policy_context}

Domain terminology:
{glossary_terms}

Respond in the following JSON format:
{output_schema}
"""

user_prompt = f"""Application document:
{document_markdown}

Extracted fields:
{json.dumps(extracted_fields, indent=2)}
"""
```

---

## Adding a New Persona

To add a new persona (e.g., "workers_compensation"):

1. **Define PersonaType** in `app/personas.py`:
   ```python
   class PersonaType(str, Enum):
       WORKERS_COMP = "workers_compensation"
   ```

2. **Create PersonaConfig** with field schema, prompts, and analyzer ID

3. **Create policy file** at `prompts/workers-comp-policies.json`

4. **Add prompts** to `prompts/prompts.json` under the new persona key

5. **Add glossary category** in `prompts/glossary.json`

6. **Create frontend components** (if needed) in `frontend/src/components/workers-comp/`

7. **Add persona to frontend config** in `frontend/src/lib/personas.ts`
