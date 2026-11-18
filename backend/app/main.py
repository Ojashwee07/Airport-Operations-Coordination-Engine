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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.exception_handler(Exception)
async def unhandled_error(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal error. Check backend logs."})


@app.get("/health")
def health():
    return {"status": "ok", "service": "airport-operations-coordination-engine", "demo_mode": True, "version": "2.0.0"}
