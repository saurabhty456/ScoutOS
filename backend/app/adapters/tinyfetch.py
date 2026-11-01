"""TinyFetch adapter — content extraction via POST api.fetch.tinyfish.ai"""
from __future__ import annotations
import logging
from dataclasses import dataclass
from datetime import datetime
from urllib.parse import urlparse

import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)

FETCH_ENDPOINT = "https://api.fetch.tinyfish.ai"
FETCH_TIMEOUT = 150  # docs recommend 150s client timeout


@dataclass
class FetchResult:
    url: str
    domain: str
    title: str | None
    text: str | None
    format: str
    fetched_at: str
    success: bool
    error: str | None


class TinyFetchAdapter:
    """Wraps the TinyFetch REST API directly (no SDK method for fetch yet)."""

    def __init__(self):
        settings = get_settings()
        self._api_key = settings.tinyfish_api_key

    def fetch(
        self,
        urls: list[str],
        *,
        purpose: str | None = None,
        format: str = "markdown",
        ttl: int | None = 0,
    ) -> list[FetchResult]:
        """Fetch and extract content from up to 10 URLs.

        Returns one FetchResult per URL. Failures are represented as
        FetchResult(success=False) rather than raising.
        """
        if not urls:
            return []

        payload: dict = {"urls": urls[:10], "format": format}
        if purpose:
            payload["purpose"] = purpose
        if ttl is not None:
            payload["ttl"] = ttl

        headers = {"X-API-Key": self._api_key, "Content-Type": "application/json"}

        logger.info("TinyFetch: fetching %d URLs", len(urls))
        try:
            resp = httpx.post(
                FETCH_ENDPOINT,
                json=payload,
                headers=headers,
                timeout=FETCH_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPStatusError as exc:
            logger.error("TinyFetch HTTP error: %s", exc)
            return [
                FetchResult(url=u, domain=_domain(u), title=None, text=None,
                            format=format, fetched_at=datetime.utcnow().isoformat(),
                            success=False, error=str(exc))
                for u in urls
            ]
        except Exception as exc:
            logger.error("TinyFetch error: %s", exc)
            return [
                FetchResult(url=u, domain=_domain(u), title=None, text=None,
                            format=format, fetched_at=datetime.utcnow().isoformat(),
                            success=False, error=str(exc))
                for u in urls
            ]

        # Parse response — TinyFetch returns {"results": [...]} or a list
        raw_results = data.get("results") if isinstance(data, dict) else data
        if not isinstance(raw_results, list):
            raw_results = []

        results: list[FetchResult] = []
        for item in raw_results:
            url = item.get("url", "")
            errors = item.get("errors") or []
            success = not bool(errors)
            results.append(
                FetchResult(
                    url=url,
                    domain=_domain(url),
                    title=item.get("title"),
                    text=item.get("text"),
                    format=format,
                    fetched_at=datetime.utcnow().isoformat(),
                    success=success,
                    error=errors[0] if errors else None,
                )
            )

        # If the API returned fewer items than requested, pad with failures
        if len(results) < len(urls):
            fetched_urls = {r.url for r in results}
            for u in urls:
                if u not in fetched_urls:
                    results.append(
                        FetchResult(url=u, domain=_domain(u), title=None, text=None,
                                    format=format, fetched_at=datetime.utcnow().isoformat(),
                                    success=False, error="not_returned")
                    )

        logger.info("TinyFetch: %d succeeded, %d failed", sum(r.success for r in results), sum(not r.success for r in results))
        return results


def _domain(url: str) -> str:
    try:
        return urlparse(url).netloc.removeprefix("www.")
    except Exception:
        return url
