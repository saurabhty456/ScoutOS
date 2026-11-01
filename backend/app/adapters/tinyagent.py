"""TinyAgent adapter — goal-directed autonomous web research."""
from __future__ import annotations
import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from tinyfish import AsyncTinyFish, RunStatus
from app.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class AgentResult:
    run_id: str | None
    status: str  # COMPLETED | FAILED | CANCELLED | PENDING | RUNNING
    result: Any  # The extracted data (dict, list, or str)
    error: str | None
    num_steps: int
    started_at: str | None
    finished_at: str | None


class TinyAgentAdapter:
    """Wraps TinyFish AsyncTinyFish.agent.run() for goal-based research."""

    def __init__(self):
        settings = get_settings()
        self._client = AsyncTinyFish(api_key=settings.tinyfish_api_key)

    async def run(
        self,
        url: str,
        goal: str,
        *,
        browser_profile: str = "lite",
        output_schema: dict | None = None,
    ) -> AgentResult:
        """Run an agent task on a URL. Awaits completion (up to 120 s).

        Always returns an AgentResult. COMPLETED does not guarantee a
        useful result — always inspect result and check for failure signals.
        """
        logger.info("TinyAgent: starting run url=%r goal=%.80s…", url, goal)
        kwargs: dict = {
            "url": url,
            "goal": goal,
            "browser_profile": browser_profile,
        }
        if output_schema:
            kwargs["output_schema"] = output_schema

        started = datetime.utcnow().isoformat()
        try:
            run = await self._client.agent.run(**kwargs)
        except Exception as exc:
            logger.error("TinyAgent run error: %s", exc)
            return AgentResult(
                run_id=None,
                status="FAILED",
                result=None,
                error=str(exc),
                num_steps=0,
                started_at=started,
                finished_at=datetime.utcnow().isoformat(),
            )

        finished = datetime.utcnow().isoformat()
        status = run.status.value if hasattr(run.status, "value") else str(run.status)
        result = getattr(run, "result", None)

        # result may be wrapped: {"result": [...]} — unwrap if so
        if isinstance(result, dict) and "result" in result and len(result) == 1:
            result = result["result"]

        # Check for failure signals inside result
        if isinstance(result, str) and any(
            kw in result.lower() for kw in ["captcha", "blocked", "access denied", "403", "404"]
        ):
            logger.warning("TinyAgent completed but result contains failure signal: %s", result[:100])

        logger.info("TinyAgent: status=%s steps=%s", status, getattr(run, "num_of_steps", "?"))
        return AgentResult(
            run_id=getattr(run, "run_id", None),
            status=status,
            result=result,
            error=str(getattr(run, "error", None)) if getattr(run, "error", None) else None,
            num_steps=getattr(run, "num_of_steps", 0) or 0,
            started_at=started,
            finished_at=finished,
        )

    async def run_batch(
        self,
        tasks: list[dict],  # [{"url": ..., "goal": ...}, ...]
        max_concurrent: int = 3,
    ) -> list[AgentResult]:
        """Run multiple agent tasks with a concurrency limit."""
        semaphore = asyncio.Semaphore(max_concurrent)

        async def bounded_run(task: dict) -> AgentResult:
            async with semaphore:
                return await self.run(
                    url=task["url"],
                    goal=task["goal"],
                    output_schema=task.get("output_schema"),
                )

        return list(await asyncio.gather(*[bounded_run(t) for t in tasks]))
