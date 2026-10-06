from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from database import engine, Base, SessionLocal
from routers import dashboard, transactions, investigation, audit, feedback
from data.seed import seed_database

app = FastAPI(title="SENTINEL API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dashboard.router)
app.include_router(transactions.router)
app.include_router(investigation.router)
app.include_router(audit.router)
app.include_router(feedback.router)

@app.on_event("startup")
def on_startup():
    print("Starting up...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    # Check if empty
    from models import Transaction
    if db.query(Transaction).count() == 0:
        seed_database(db)
    db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to SENTINEL API"}
