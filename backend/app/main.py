<<<<<<< HEAD
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import app.models  # noqa: F401  (registers tables)
from app.api.routes import router
from app.services.seed import seed_database

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("aoce")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    seed_database()
    yield


app = FastAPI(title="Airport Operations Coordination Engine", version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
=======
from fastapi import FastAPI

from app.config import settings
from app.logger import logger
from app.api.auth import router as auth_router
from app.api.workflow import router as workflow_router
from app.api.permission import router as permission_router
from app.api.audit import router as audit_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend APIs for Airport Operations Coordination"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
>>>>>>> origin/main
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
<<<<<<< HEAD
app.include_router(router)


@app.exception_handler(Exception)
async def unhandled_error(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal error. Check backend logs."})


@app.get("/health")
def health():
    return {"status": "ok", "service": "airport-operations-coordination-engine", "demo_mode": True, "version": "2.0.0"}
=======

app.include_router(auth_router)
app.include_router(workflow_router)
app.include_router(permission_router)
app.include_router(audit_router)

@app.get("/")
def home():
    logger.info("Home endpoint accessed")

    return {
        "message": settings.app_name,
        "version": settings.app_version
    }


@app.get("/health")
def health_check():
    logger.info("Health check endpoint accessed")

    return {
        "status": "healthy"
    }
>>>>>>> origin/main
