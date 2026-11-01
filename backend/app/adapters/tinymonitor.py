"""TinyMonitor adapter — create and manage monitors via REST API."""
from __future__ import annotations
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any

import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)

MONITOR_ENDPOINT = "https://agent.tinyfish.ai/v1/monitors"
TIMEOUT = 30


@dataclass
class MonitorCreated:
    provider_id: str
    status: str
    raw: dict


@dataclass
class MonitorRunResult:
    provider_id: str
    outcome: str  # baseline_captured | changed | no_changes
    diff: str | None
    content: str | None
    run_at: str


class TinyMonitorAdapter:
    """Wraps the TinyMonitor REST API."""

    def __init__(self):
        settings = get_settings()
        self._headers = {"X-API-Key": settings.tinyfish_api_key, "Content-Type": "application/json"}

    def create_page_monitor(
        self,
        url: str,
        *,
        name: str | None = None,
        schedule_cron: str = "0 9 * * *",
        purpose: str | None = None,
        webhook_url: str | None = None,
    ) -> MonitorCreated:
        """Create a Page monitor that runs Fetch with ttl:0 on each run."""
        payload: dict[str, Any] = {
            "type": "fetch",
            "config": {"url": url, "format": "json"},
            "schedule_cron": schedule_cron,
        }
        if name:
            payload["name"] = name
        if purpose:
            payload["purpose"] = purpose
        if webhook_url:
            payload["webhook_url"] = webhook_url

        logger.info("TinyMonitor: creating page monitor for %s", url)
        return self._create(payload)

    def create_topic_monitor(
        self,
        query: str,
        *,
        name: str | None = None,
        schedule_cron: str = "0 9 * * *",
        num_results: int = 10,
        purpose: str | None = None,
        webhook_url: str | None = None,
    ) -> MonitorCreated:
        """Create a Topic monitor that runs Search on each scheduled run."""
        # Topic monitors must run at least 30 minutes apart
        payload: dict[str, Any] = {
            "type": "search",
            "config": {"query": query, "num_results": min(num_results, 10)},
            "schedule_cron": schedule_cron,
        }
        if name:
            payload["name"] = name
        if purpose:
            payload["purpose"] = purpose
        if webhook_url:
            payload["webhook_url"] = webhook_url

        logger.info("TinyMonitor: creating topic monitor query=%r", query)
        return self._create(payload)

    def _create(self, payload: dict) -> MonitorCreated:
        try:
            resp = httpx.post(MONITOR_ENDPOINT, json=payload, headers=self._headers, timeout=TIMEOUT)
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPStatusError as exc:
            logger.error("TinyMonitor create error %s: %s", exc.response.status_code, exc.response.text[:300])
            raise RuntimeError(f"TinyMonitor create failed: {exc.response.status_code}") from exc
        except Exception as exc:
            logger.error("TinyMonitor create error: %s", exc)
            raise RuntimeError(f"TinyMonitor create failed: {exc}") from exc

        monitor_id = data.get("id") or data.get("monitor_id", "")
        status = data.get("status", "active")
        return MonitorCreated(provider_id=monitor_id, status=status, raw=data)

    def pause(self, provider_id: str) -> str:
        return self._patch(provider_id, {"status": "paused"})

    def resume(self, provider_id: str) -> str:
        return self._patch(provider_id, {"status": "active"})

    def _patch(self, provider_id: str, payload: dict) -> str:
        try:
            resp = httpx.patch(
                f"{MONITOR_ENDPOINT}/{provider_id}",
                json=payload,
                headers=self._headers,
                timeout=TIMEOUT,
            )
            resp.raise_for_status()
            return resp.json().get("status", "unknown")
        except Exception as exc:
            logger.error("TinyMonitor patch error: %s", exc)
            raise RuntimeError(str(exc)) from exc

    def run_now(self, provider_id: str) -> MonitorRunResult:
        """Trigger an immediate run for a monitor."""
        try:
            resp = httpx.post(
                f"{MONITOR_ENDPOINT}/{provider_id}/runs",
                headers=self._headers,
                timeout=60,
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:
            logger.error("TinyMonitor run_now error: %s", exc)
            raise RuntimeError(str(exc)) from exc

        run = data.get("run") or data
        return MonitorRunResult(
            provider_id=provider_id,
            outcome=run.get("outcome", "unknown"),
            diff=run.get("diff"),
            content=str(run.get("results", "")) if run.get("results") else None,
            run_at=datetime.utcnow().isoformat(),
        )

    def delete(self, provider_id: str) -> None:
        try:
            httpx.delete(
                f"{MONITOR_ENDPOINT}/{provider_id}",
                headers=self._headers,
                timeout=TIMEOUT,
            )
        except Exception as exc:
            logger.warning("TinyMonitor delete error: %s", exc)
