# WisePay — Autonomous Accounts Payable Risk Intelligence

> **Enterprise AI for Business & Financial Automation.**  
> WisePay safeguards enterprise accounts payable by combining statistical baseline modeling, multi-vector duplicate detection, and deterministic compliance policies into a real-time risk orchestration engine that anchors every decision to a tamper-evident SHA-256 cryptographic audit chain.

Developed for the **Microsoft Innovate 2026 Hackathon**.

---

## 🏛️ Enterprise Architecture Overview

WisePay eliminates the friction and fraud in manual accounts payable workflows by automating routine verifications and triaging ambiguous exceptions with full explainability:

```
+-----------------------------------------------------------------------------------------+
|                               Next.js 16 Client (React 19)                              |
|  - Executive Risk Dashboard    - Exception Queue     - Forensic Investigation Workspace |
|  - Role Clearance Badges       - SoD Enforcement     - Real-Time Blockchain Verifier    |
+--------------------------------------------+--------------------------------------------+
                                             |  JWT Bearer Auth + REST APIs
                                             v
+-----------------------------------------------------------------------------------------+
|                                 FastAPI Backend (Python)                                 |
|  - JWT Authentication & RBAC Engine (AP Reviewer, Finance Manager, Auditor)            |
|  - AI Risk Pipeline (Deterministic Policies + IsolationForest + TF-IDF Duplicate Radar) |
|  - Human-in-the-Loop (HITL) Decision Controller & Segregation of Duties (SoD)          |
|  - Sequential SHA-256 Hash Chain Ledger Generator                                       |
+--------------------------------------------+--------------------------------------------+
                                             |  SQLAlchemy 2.0 ORM + Alembic
                                             v
+-----------------------------------------------------------------------------------------+
|                                PostgreSQL 15 Database                                   |
|  - 12 Normalized Tables: Users, Roles, Vendors, Employees, Invoices, Line Items,        |
|    RiskAssessments (Immutable), Exceptions, Evidence, HumanDecisions, AuditEvents       |
|  - Exact Financial Precision (NUMERIC(15, 2))                                          |
+-----------------------------------------------------------------------------------------+
```

---

## 🌟 Key Enterprise Features

1. **AI-Powered Multi-Layer Risk Engine:**
   - **Isolation Forest & Statistical Baselines:** Evaluates continuous Z-score deviations against historical supplier and employee baselines to catch abnormal invoice amounts and price creep.
   - **Duplicate Radar:** Scans exact PO references and multi-vector TF-IDF semantic description similarity to prevent double billing across subsidiaries.
   - **Deterministic Compliance Matrix:** Enforces approval caps, missing receipt attachments, and split-PO prevention rules.

2. **Tamper-Evident SHA-256 Cryptographic Audit Ledger:**
   - Every invoice ingestion, AI risk evaluation, and human governance override generates an immutable audit block.
   - Blocks are cryptographically chained (`hash = SHA256(payload + prev_hash + block_index)`), giving regulators and auditors mathematical proof of data integrity.

3. **Strict Financial Precision:**
   - Zero floating-point rounding errors on the ledger. All financial transactions use `NUMERIC(15, 2)` / Python `Decimal` types, cleanly coerced to floats only at the serialization adapter boundary for frontend charting.

4. **Role-Based Access Control (RBAC) & Segregation of Duties (SoD):**
   - **SOX 404 / SOC-2 Compliance:** Enforces organizational roles directly in the API and UI.
   - **Auditors** operate in strictly read-only inspection mode and are blocked from disbursement actions.
   - **AP Reviewers** can approve invoices up to ₹5,00,000, while high-risk holds or higher amounts require executive **Finance Manager** override sign-off.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS, Lucide Icons, Recharts, Framer Motion.
- **Backend:** FastAPI (Python 3.10+), Pydantic v2, Passlib (bcrypt), PyJWT / python-jose.
- **Database & ORM:** PostgreSQL 15, SQLAlchemy 2.0, Alembic Migrations.
- **Machine Learning & Analytics:** Scikit-learn (IsolationForest, TF-IDF), Pandas, NumPy, Joblib.
- **Containerization:** Docker & Docker Compose.

---

## 🚀 Quickstart Guide (Judge & Developer Setup)

Follow these exact terminal commands to run the complete stack from scratch.

### Prerequisites
- Docker & Docker Compose
- Python 3.10+
- Node.js 18+ and npm

---

### Step 1: Start PostgreSQL via Docker Compose
From the project root:
```bash
docker-compose up -d
```
*This starts a PostgreSQL 15 container mapped to port `5432` with user `postgres` and database `wisepay`.*

---

### Step 2: Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

---

### Step 3: Backend Setup & Database Migration
```bash
cd backend
python -m venv venv

# Activate Virtual Environment:
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
source venv/bin/activate

# Install dependencies:
pip install -r requirements.txt

# Run Alembic migrations to build the 12 relational tables:
alembic upgrade head
```

---

### Step 4: Deterministic Seed Data Generation
Seed realistic relational demo data (Vendors, Employees, Invoices, Compliance Rules, and Chained Audit Events):
```bash
python scripts/seed_demo_data.py --count 100 --reset
```
*Tip: You can generate up to 1,000 deterministic records by increasing `--count`.*

---

### Step 5: Start the FastAPI Backend Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- API Base: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- Health Probe: `http://localhost:8000/health`

---

### Step 6: Start the Next.js Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`

---

## 👥 Demo Credentials & Role Clearance Matrix

Use the **1-Click Role Login** in the UI or use the credentials below to experience client and server-side Segregation of Duties (SoD):

| Role | Demo User Email | Default Password | Permissions & Governance Policy |
| :--- | :--- | :--- | :--- |
| **AP / FINANCE REVIEWER** | `priya.sharma@wisepay.internal` | `SecretPass123!` | Standard reviews up to **₹5,00,000**. High-risk exception holds and amounts above ₹5L are blocked from approval and require escalation. |
| **FINANCE MANAGER** | `marcus.vance@wisepay.internal` | `SecretPass123!` | **Full Tier-1 Disbursement Authority**. Can override high-risk flags, release quarantine holds, and approve unlimited amounts. |
| **AUDITOR** | `elena.rostova@sox.audit.internal` | `SecretPass123!` | **Strictly Read-Only**. Full visibility into transaction forensics and SHA-256 ledger verification. Disallowed from making disbursement decisions (SoD enforced). |

---

## 🧪 Running Automated Tests

Run the complete backend test suite (ORM relationships, deterministic seeding, SHA-256 hash chaining, JWT auth, AI ingestion, read adapters, and HITL SoD enforcement):
```bash
cd backend
pytest -v
```

---

## 📄 License
MIT License. Built with ❤️ for the Microsoft Innovate 2026 Hackathon.
