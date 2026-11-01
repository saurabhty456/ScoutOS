from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

# Resolve .env relative to this file's directory so it works regardless of cwd
_ENV_FILE = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    tinyfish_api_key: str
    secret_key: str = "change-in-production"
    database_url: str = f"sqlite+aiosqlite:///{Path(__file__).parent.parent / 'scoutos.db'}"
    frontend_url: str = "http://localhost:3000"
    debug: bool = False
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week

    model_config = {"env_file": str(_ENV_FILE), "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
