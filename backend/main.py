import os
import sys
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import audit, auth, dashboard, entities, feedback, investigation, invoices, transactions

app = FastAPI(
    title="WisePay API",
    version="1.0.0",
    description="Enterprise Accounts Payable Risk Intelligence & Forensic Exception Engine",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Modular Routers
app.include_router(auth.router)
app.include_router(invoices.router)
app.include_router(dashboard.router)
app.include_router(transactions.router)
app.include_router(investigation.router)
app.include_router(audit.router)
app.include_router(entities.router)
app.include_router(feedback.router)


@app.on_event("startup")
def on_startup():
    """
    Decoupled FastAPI startup event.
    Starts cleanly and immediately without running heavy in-memory seeding.
    """
    print("WisePay API initialized successfully. Ready to accept requests.")


@app.get("/")
def read_root():
    return {
        "service": "WisePay API",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "WisePay API",
    }
