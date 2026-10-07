# WisePay Phase 2: Backend Refactor & API Implementation Plan
**Author:** Senior Backend Architect & Technical Lead  
**Document:** `docs/backend-refactor-plan.md`  
**Reference:** `ARCHITECTURE_BLUEPRINT.md`  
**Target:** Decoupled, Modular, PostgreSQL-Ready FastAPI Backend with Real Ingestion, JWT Auth, and Scikit-Learn Risk Pipeline

---

## 1. Executive Summary & Core Objectives

WisePay is transitioning from a self-contained demonstration prototype (seeded on startup via SQLite) into a modular, production-ready enterprise Accounts Payable (AP) risk engine.

### Key Objectives
1. **Zero Frontend Regressions:** Keep every existing Next.js frontend screen (`/dashboard`, `/queue`, `/investigate/[id]`, `/audit`) operational without breaking expected endpoint paths or response payloads.
2. **PostgreSQL-Ready & Environment-Driven:** Upgrade database access from hardcoded SQLite (`sentinel.db`) to standard SQLAlchemy 2.0 with dynamic `DATABASE_URL` environment variable support (defaulting to PostgreSQL, with graceful SQLite fallback for testing).
3. **Decoupled Machine Learning:** Stop `IsolationForest` retraining on every application startup in `seed.py`. Serialize pre-trained model weights to `.joblib` and load on demand. Provide a dedicated script (`scripts/train_anomaly_model.py`) for offline model training.
4. **Real Ingestion Pipeline:** Implement real-time transactional ingestion (`POST /api/invoices` and `POST /api/invoices/bulk`) that executes the validation, duplicate detection, policy checks, behavioral baselining, ML anomaly detection, composite risk scoring, and SHA-256 audit block creation.
5. **Robust JWT Authentication & RBAC:** Provide real JWT-based authentication (`POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`) with bcrypt password hashing. Extract and enforce organizational roles (`AP / FINANCE REVIEWER`, `FINANCE MANAGER`, `AUDITOR`) server-side to guarantee Segregation of Duties (SoD).
6. **Decoupled Demo Seeding:** Extract all seed logic from FastAPI `@app.on_event("startup")` into an independent CLI script (`scripts/seed_demo_data.py`), allowing the backend to start cleanly against empty or pre-existing databases.
7. **Consistent Error Schema:** Standardize API error responses across the backend: `{"error": {"code": "...", "message": "...", "details": ...}}`.

---

## 2. Current Backend Forensic State & Architectural Debt

| Component | Current State in Codebase | Identified Flaw / Architectural Debt |
| :--- | :--- | :--- |
| **Database Connection** | Hardcoded `sqlite:///./sentinel.db` in `backend/database.py` | Fails in multi-process/Azure environments; lacks PostgreSQL concurrency and JSONB indexing. |
| **Data Schema** | Single flat `Transaction` model + `AuditEvent` + `HumanDecision` in `backend/models.py` | Rules, exceptions, and anomaly details are stored as raw JSON strings in `Text` fields instead of normalized relational entities (`Invoices`, `Exceptions`, `Rules`, `Evidence`). |
| **Database Seeding** | Hardcoded in `backend/main.py` startup event via `seed_database(db)` generating 9,000+ synthetic rows | Application cannot start cleanly without running a massive in-memory generator that blocks startup. |
| **ML Engine Lifecycle** | `IsolationForest` trained on synthetic DataFrame on startup inside `seed.py`; stored in global variable `_iso_forest` | Race conditions in multi-worker Uvicorn (`--workers 4`); no disk persistence or versioning. |
| **Invoice Ingestion** | No single or bulk ingestion endpoints exist | Only pre-seeded transactions can be viewed; impossible to ingest new live invoices via API. |
| **Authentication & RBAC** | Frontend mocks user profiles in `localStorage`; backend trusts `body.get("reviewer_role")` in `feedback.py` | Zero backend security; anyone can forge requests as `FINANCE MANAGER` or bypass approval limits. |
| **Audit Ledger** | Internal SHA-256 hash chaining in `audit/chain.py` (functional, but called "Solana" in frontend copy) | Good cryptographic integrity logic, but needs to be formally decoupled from synthetic seeding and triggered upon live ingestion. |

---

## 3. Frontend API Compatibility Matrix

The Next.js frontend (`frontend/lib/api.ts` and associated page components) relies on the following backend endpoints. All of these **must remain strictly backwards-compatible** in path, HTTP verb, query parameters, and JSON response structure:

### 3.1 Dashboard Endpoints (`/api/dashboard`)
| Frontend API Call | HTTP Verb & Path | Expected Query Params | Expected Response Schema |
| :--- | :--- | :--- | :--- |
| `api.dashboard.stats()` | `GET /api/dashboard/stats` | None | `{ total: number, auto_pass: number, human_review: number, high_risk: number, human_attention_saved_pct: number, total_amount: number, flagged_amount: number }` |
| `api.dashboard.riskDistribution()` | `GET /api/dashboard/risk_distribution` | None | `{ labels: string[], data: number[] }` (10 score buckets) |
| `api.dashboard.topCategories()` | `GET /api/dashboard/top_risk_categories` | None | `Array<{ category: string, count: number }>` |
| `api.dashboard.network()` | `GET /api/dashboard/network` | None | `{ nodes: Array<{ id: string, label: string, type: "employee"\|"vendor", count: number, dept?: string, category?: string }>, edges: Array<{ source: string, target: string, weight: number, count: number }> }` |
| `api.dashboard.processingStream()` | `GET /api/dashboard/processing_stream` | None | `Array<TransactionDict>` (sorted by `processed_at` desc) |

### 3.2 Transactions & Exception Queue (`/api/transactions`)
| Frontend API Call | HTTP Verb & Path | Expected Query Params | Expected Response Schema |
| :--- | :--- | :--- | :--- |
| `api.transactions.list(...)` | `GET /api/transactions` | `decision` (e.g. `HIGH_RISK,HUMAN_REVIEW`), `page` (int), `size` (int), `sort` (str) | `{ total: number, page: number, size: number, items: Array<TransactionDict> }` |
| `api.transactions.get(id)` | `GET /api/transactions/{id}` | Path param `id` | `TransactionDict` |
| `api.transactions.similar(id)` | `GET /api/transactions/{id}/similar` | Path param `id` | `Array<TransactionDict>` (matched duplicate invoices) |

### 3.3 Forensic Investigation Workspace (`/api/investigation`)
| Frontend API Call | HTTP Verb & Path | Expected Query Params | Expected Response Schema |
| :--- | :--- | :--- | :--- |
| `api.investigation.get(id)` | `GET /api/investigation/{id}` | Path param `id` | `{ transaction: TransactionDict, behavioral_analysis: {...}, duplicate_evidence: {...}, policy_violations: [...], anomaly_details: {...}, relationship_flags: [...], evidence_graph: { nodes: [...], edges: [...] }, counterfactual_steps: [...], audit_timeline: [...], recommendation: string }` |

### 3.4 Cryptographic Audit Ledger (`/api/audit`)
| Frontend API Call | HTTP Verb & Path | Expected Query Params | Expected Response Schema |
| :--- | :--- | :--- | :--- |
| `api.audit.chain(...)` | `GET /api/audit/chain` | `page` (int), `size` (int) | `Array<{ id: int, transaction_id: str, event_type: str, event_data: str/dict, timestamp: str, hash: str, prev_hash: str, block_index: int }>` |
| `api.audit.get(txId)` | `GET /api/audit/{transaction_id}` | Path param `transaction_id` | `Array<AuditEventDict>` |
| `api.audit.verify(txId)` | `POST /api/audit/{transaction_id}/verify` | Path param `transaction_id` | `{ verified: boolean, events: Array<{ id: int, type: str, timestamp: str, hash: str, prev_hash?: str, block_index?: int }>, mismatch_at: int \| null, reason?: str }` |

### 3.5 Governance & Human Review (`/api/feedback` & `/api/reviews`)
| Frontend API Call | HTTP Verb & Path | Expected Payload / Params | Expected Response Schema |
| :--- | :--- | :--- | :--- |
| `api.feedback.submit(txId, ...)` | `POST /api/feedback/{transaction_id}` | `{ reviewer_id: str, reviewer_role?: str, decision: str, reason: str }` | `{ status: "success", decision_id: int, reviewer_role: str, decision: str }` |
| `api.feedback.stats()` | `GET /api/feedback/stats` | None | `{ total_reviews: int, approved: int, rejected: int, escalated: int }` |
| `api.feedback.roles()` | `GET /api/feedback/roles` | None | `{ roles: Array<{ id: str, department: str, authority: str, can_approve_disbursement: bool, can_override_high_risk: bool, can_audit_ledger: bool }> }` |
| New Review API | `POST /api/reviews/{id}/decision` | `{ decision: str, reason: str }` (authenticated via Bearer JWT) | `{ status: "success", decision_id: int, ... }` |

---

## 4. Target Architecture & Database Schema

We will maintain full backward compatibility for frontend queries while establishing a clean, normalized relational model.

```mermaid
erDiagram
    USERS ||--o{ REVIEWS : records
    ROLES ||--o{ USERS : assigns
    VENDORS ||--o{ INVOICES : bills
    EMPLOYEES ||--o{ INVOICES : submits
    INVOICES ||--o{ EXCEPTIONS : flags
    RULES ||--o{ EXCEPTIONS : defines
    INVOICES ||--o{ EVIDENCE : provides
    INVOICES ||--o{ AUDIT_LOGS : anchors
    INVOICES ||--o{ REVIEWS : evaluated_by

    USERS {
        uuid id PK
        string email UK
        string full_name
        string role_id FK
        string hashed_password
        boolean is_active
        datetime created_at
    }

    ROLES {
        string id PK "AP_REVIEWER | FINANCE_MANAGER | AUDITOR"
        string title
        string department
        float approval_limit
        boolean can_approve_disbursement
        boolean can_override_high_risk
        boolean is_auditor_read_only
    }

    VENDORS {
        string id PK
        string name
        string category
        float historical_min
        float historical_max
        float total_spend
        int invoice_count
    }

    EMPLOYEES {
        string id PK
        string name
        string department
    }

    INVOICES {
        string id PK "UUID or string ID"
        string invoice_id UK
        string invoice_number
        string employee_id FK
        string employee_name
        string employee_dept
        string vendor_id FK
        string vendor_name
        datetime invoice_date
        float amount
        string currency
        string category
        text description
        string approval_status
        string receipt_status
        string payment_status
        string policy_category
        float risk_score
        float confidence
        string decision "AUTO_PASS | HUMAN_REVIEW | HIGH_RISK"
        string human_decision
        text rules_triggered "JSON string for legacy frontend compatibility"
        text anomaly_details "JSON string for legacy frontend compatibility"
        datetime created_at
        datetime processed_at
    }

    RULES {
        string id PK "e.g. POLICY_LIMIT"
        string name
        string description
        string severity
        float score_contribution
    }

    EXCEPTIONS {
        int id PK
        string invoice_id FK
        string rule_id FK
        string exception_type "POLICY | DUPLICATE | BEHAVIORAL | VALIDATION"
        string message
        float severity_score
        text evidence_data "JSON string / JSONB"
        datetime created_at
    }

    EVIDENCE {
        int id PK
        string invoice_id FK
        text evidence_graph "JSON string"
        text behavioral_info "JSON string"
        text duplicate_info "JSON string"
        text counterfactual_steps "JSON string"
        text recommendation
        datetime created_at
    }

    AUDIT_LOGS {
        int id PK
        string transaction_id FK
        string event_type
        text event_data
        datetime timestamp
        string hash "SHA-256"
        string prev_hash
        int block_index UK
    }

    REVIEWS {
        int id PK
        string transaction_id FK
        string reviewer_id
        string reviewer_role
        string decision "APPROVE | REJECT | EXCEPTION | ESCALATE"
        text reason
        string original_decision
        int audit_event_id FK
        datetime timestamp
    }
```

### PostgreSQL / SQLite Compatibility Strategy
- Primary connection: reads `DATABASE_URL` from environment (e.g. `postgresql://user:pass@localhost:5432/wisepay`).
- Fallback: if `DATABASE_URL` is unset or contains `sqlite`, safely initializes SQLite with `check_same_thread: False`.
- Columns with rich nested data will use SQLAlchemy `Text` with automatic JSON serialization/deserialization to ensure 100% cross-compatibility between SQLite and PostgreSQL while remaining ready for native `JSONB`.

---

## 5. Decoupled ML Engine & Artifact Pipeline

### Current Problem
- `IsolationForest` is trained inside `seed_database()` during startup on synthetic DataFrame rows.
- If the app starts with an empty database, `_iso_forest` is `None`, and anomaly detection fails.

### Architectural Solution
1. **Model Persistence via Joblib:**
   - Store the pre-trained `IsolationForest` and fitted feature pipeline in `backend/engine/artifacts/anomaly_model.joblib`.
2. **Lazy/Pre-loaded Model Loading:**
   - On application startup, load `anomaly_model.joblib` if present. If absent, fall back to a safe default heuristic or initialize a pre-fitted baseline.
3. **Dedicated Offline Training Script:**
   - Create `backend/scripts/train_anomaly_model.py` which trains the model on benchmark datasets and serializes it to disk.

---

## 6. Real Ingestion Pipeline (`POST /api/invoices`)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client / ERP System
    participant API as Ingestion Router
    participant Engine as Modular Risk Engine
    participant DB as PostgreSQL / DB
    participant Chain as SHA-256 Audit Chain

    Client->>API: POST /api/invoices (Payload)
    API->>API: Validate Pydantic Schema & Normalize
    API->>Engine: Run Validator (Missing fields, negative values)
    API->>Engine: Check Exact & TF-IDF Duplicates against DB History
    API->>Engine: Evaluate Deterministic Policy Rules
    API->>Engine: Compute Vendor & Employee Behavioral Z-scores
    API->>Engine: Query IsolationForest Anomaly Model
    API->>Engine: Compute Composite Risk & Confidence Score
    API->>Engine: Generate Counterfactuals & Evidence Graph
    API->>DB: Persist Invoice, Exceptions & Evidence Record
    API->>Chain: Compute SHA-256 Hash Block linked to prev_hash
    API->>DB: Persist AuditLog Block
    API-->>Client: 201 Created (Triage Decision, Risk Score, Evidence)
```

---

## 7. Authentication, RBAC & Segregation of Duties (SoD)

### 7.1 Backend JWT Implementation
- Password hashing with `passlib[bcrypt]`.
- Standard OAuth2 password flow with JWT Bearer tokens:
  - `POST /api/auth/register`: Register new user profile.
  - `POST /api/auth/login`: Authenticate email/password $\rightarrow$ return `{ access_token: str, token_type: "bearer", user: {...} }`.
  - `GET /api/auth/me`: Return authenticated user info and permissions.
- Dependency `get_current_user`: extracts and validates the JWT token.
- Dependency `require_roles(permitted_roles)`: verifies the user's role server-side.

### 7.2 Strict Segregation of Duties (SoD)
The backend enforces these hard rules regardless of client input:
1. **`AUDITOR`:** Read-only access. Blocked from approving, rejecting, or escalating invoices (`HTTP 403 Forbidden`).
2. **`AP / FINANCE REVIEWER`:** Can review standard invoices $\le$ ₹5,00,000. Cannot approve `HIGH_RISK` invoices or amounts $>$ ₹5,00,000 (`HTTP 403 Forbidden`).
3. **`FINANCE MANAGER`:** Unlimited approval authority and high-risk override authority.

*Note on backward compatibility:* For the existing frontend review modal that posts directly to `POST /api/feedback/{id}` without a token, the endpoint will accept authenticated requests via JWT if present, or fall back to validating the request against the 3 permissible roles and SoD rules.

---

## 8. Step-by-Step Implementation Roadmap

```mermaid
flowchart TD
    S1[Step 1: Inspection & Plan] -->|Review Approved| S2[Step 2: Database & ORM Upgrade]
    S2 --> S3[Step 3: Core API & Auth Implementation]
    S3 --> S4[Step 4: Risk Engine & Ingestion Pipeline]
    S4 --> S5[Step 5: Testing & Verification]
```

### Step 2: Database & ORM Upgrade
1. Update `backend/requirements.txt` with:
   - `psycopg2-binary>=2.9.9`
   - `alembic>=1.13.0`
   - `passlib[bcrypt]>=1.7.4`
   - `python-jose[cryptography]>=3.3.0`
   - `python-dotenv>=1.0.0`
   - `joblib>=1.3.0`
   - `pytest>=8.0.0`
2. Refactor `backend/database.py` to use `os.getenv("DATABASE_URL", "sqlite:///./sentinel.db")` with proper connection arguments.
3. Refactor `backend/models.py` with SQLAlchemy models:
   - `User`, `Role`, `Invoice` (aliased/compatible with `Transaction`), `ExceptionRecord`, `EvidenceRecord`, `AuditEvent`, `HumanDecision`.
4. Initialize Alembic migrations (`backend/alembic/`) and generate initial migration.
5. Create `backend/scripts/seed_demo_data.py` to decouple seeding from `main.py`.
6. Remove automatic `seed_database(db)` from `main.py` startup event.

### Step 3: Core API & Authentication Implementation
1. Create `backend/routers/auth.py` (`POST /login`, `POST /register`, `GET /me`).
2. Create `backend/auth/security.py` with bcrypt hashing and JWT token generator/validator.
3. Create `backend/schemas/` with strict Pydantic models for authentication, invoice ingestion, review decisions, and standardized errors (`{"error": {"code": "...", "message": "..."}}`).
4. Implement `POST /api/invoices` and `POST /api/invoices/bulk` in `backend/routers/invoices.py`.

### Step 4: Risk Engine & Audit Integration
1. Extract and serialize `anomaly_model.joblib`.
2. Update `backend/engine/anomaly.py` to load from artifact rather than training at runtime.
3. Wire the ingestion router to execute the full multi-engine pipeline:
   - Validation $\rightarrow$ Duplicate TF-IDF $\rightarrow$ Policies $\rightarrow$ Behavioral $\rightarrow$ IsolationForest $\rightarrow$ Composite Scorer.
4. Integrate the SHA-256 audit ledger into the ingestion flow and human review flow.
5. Add `POST /api/reviews/{id}/decision` alongside backward-compatible `POST /api/feedback/{id}`.

### Step 5: Verification & Documentation
1. Write Pytest test suite in `backend/tests/`:
   - `test_database.py`: Schema constraints, models, foreign keys.
   - `test_auth.py`: JWT login, password hashing, SoD RBAC permission enforcement.
   - `test_ingestion.py`: `POST /api/invoices` scoring, exception generation, duplicate detection.
   - `test_audit_chain.py`: SHA-256 block creation, tampering detection, and verification.
2. Create `docs/backend-implementation.md` detailing startup commands, migration commands, and API documentation.

---

## 9. Verification & Completion Criteria Checklist
- [ ] Backend starts cleanly against an empty database without throwing missing-table or missing-model errors.
- [ ] Running `python backend/scripts/seed_demo_data.py` populates the database with benchmark invoices.
- [ ] `POST /api/invoices` accepts an invoice payload, runs the risk engine, assigns a risk score and decision, generates evidence, and commits an audit hash block.
- [ ] JWT authentication issues tokens and enforces Segregation of Duties.
- [ ] Next.js frontend continues to render the dashboard, exception queue, investigation details, and audit ledger seamlessly.
- [ ] All Pytest unit and integration tests pass.
