"""ScoutOS FastAPI backend — main application entry point."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import auth, missions, monitors, actions, research

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    settings = get_settings()
    if not settings.tinyfish_api_key or settings.tinyfish_api_key == "paste-your-tinyfish-key-here":
        logger.warning("TINYFISH_API_KEY is not configured — TinyFish integrations will fail")
    logger.info("Initialising database…")
    await init_db()
    logger.info("ScoutOS backend ready")
    yield
    # Shutdown
    logger.info("Shutting down")


settings = get_settings()

app = FastAPI(
    title="ScoutOS API",
    description="Autonomous Business Intelligence Platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(missions.router)
app.include_router(monitors.router)
app.include_router(actions.router)
app.include_router(research.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ScoutOS API"}
