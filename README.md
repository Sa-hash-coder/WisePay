# SENTINEL — Financial Risk Intelligence Platform

> **"Don't automate humans. Automate everything that wastes human attention."**

Microsoft Hackathon Prototype: **Accounts-Payable Exception Intelligence**

---

## ⚡ Quick Start

### 1. Backend Server (FastAPI + ML + SQLite)
```powershell
cd backend
python3.11 -m uvicorn main:app --host 127.0.0.1 --port 8000
```
- API Endpoint: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 2. Frontend Application (Next.js 16 + React 19 + Tailwind CSS)
```powershell
cd frontend
npm run dev -- --port 3000
```
- Web Application: `http://localhost:3000`

---

## 📊 Live System Metrics (Seeded Enterprise Dataset)
- **Total Invoices Analyzed:** 9,535
- **🟢 AUTO-PASS (High-Confidence Safe):** 9,137 (95.8%)
- **🟡 HUMAN REVIEW (Uncertain / Policy Exceptions):** 347 (3.6%)
- **🔴 HIGH-RISK / HOLD (Severe Behavioral / Duplicate Flags):** 51 (0.5%)
- **Human Attention Saved:** **95.8%**

---

## 🌟 Key Innovations

1. **Financial Fingerprinting:** Statistical baseline modeling (historical mean, bounds, Z-scores, ratio-to-max) comparing current transactions to historical vendor and employee behavior.
2. **Intelligent Duplicate Detection:** Multi-vector TF-IDF cosine similarity on invoice descriptions + exact matching on vendor, amounts, and numbers with side-by-side evidence inspection.
3. **Interactive Evidence Chain:** Graph tracing from invoice origin $\rightarrow$ vendor $\rightarrow$ matched duplicate $\rightarrow$ policy rules $\rightarrow$ risk score $\rightarrow$ decision.
4. **Confidence-Aware AI:** Explicit separation of Risk Score vs Confidence. Sparse history or ambiguous evidence automatically triggers Human Review.
5. **Counterfactual "What If" Engine:** Real mathematical risk reductions showing submitters and reviewers what exact actions would make an invoice safe.
6. **Cryptographic Blockchain Ledger:** Sequential SHA-256 hash-chain anchoring decision hashes with interactive integrity verification.
7. **Active Human Feedback Loop:** Approve, Reject, Legitimate Exception, and Escalate with cryptographic audit recording.
