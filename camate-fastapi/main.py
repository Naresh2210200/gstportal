"""
CAMate FastAPI Processing Microservice
=======================================
Handles heavy-lift operations offloaded from Django:
  - GSTR1 Excel generation from R2-stored CSV files
  - GSTIN verification against the GST portal
  - Format conversion (Tally/Zoho → standard CSV)

Run with:
    uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
import os

from routers import gstr1, verification, convert
from config import settings

# ─── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger("camate.fastapi")

# ─── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CAMate Processing Service",
    description="High-concurrency microservice for GSTR1 generation and GSTIN verification",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(gstr1.router, prefix="/gstr1", tags=["GSTR1 Generation"])
app.include_router(verification.router, prefix="/verification", tags=["GSTIN Verification"])
app.include_router(convert.router, prefix="/convert", tags=["Format Conversion"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "camate-processing", "version": "1.0.0"}
