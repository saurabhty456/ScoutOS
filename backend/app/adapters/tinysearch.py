"""TinySearch adapter — web discovery via tinyfish SDK search.query()"""
from __future__ import annotations
import logging
from dataclasses import dataclass
from urllib.parse import urlparse
from datetime import datetime

from tinyfish import TinyFish
from app.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    url: str
    domain: str
    title: str | None
    snippet: str | None
    source_type: str | None
    discovered_at: str


def _classify_url(url: str) -> str:
    lower = url.lower()
    if any(k in lower for k in ["/pricing", "/price", "/plans", "pricing."]):
        return "pricing_page"
    if any(k in lower for k in ["/product", "/features", "/solutions"]):
        return "product_page"
    parsed = urlparse(url)
    # If root domain — likely official website
    if parsed.path in ("", "/"):
        return "official_website"
    return "other"


def _domain(url: str) -> str:
    try:
        return urlparse(url).netloc.removeprefix("www.")
    except Exception:
        return url


class TinySearchAdapter:
    """Wraps TinyFish search.query() and normalises results."""

    def __init__(self):
        settings = get_settings()
        self._client = TinyFish(api_key=settings.tinyfish_api_key)

    def search(
        self,
        query: str,
        *,
        purpose: str | None = None,
        num_results: int = 10,
        domain_type: str = "web",
    ) -> list[SearchResult]:
        """Run a search and return normalised results.

        Never raises on empty results — returns an empty list instead.
        Raises on auth / rate-limit errors.
        """
        kwargs: dict = {"query": query, "domain_type": domain_type}
        if purpose:
            kwargs["purpose"] = purpose

        logger.info("TinySearch: query=%r num=%d", query, num_results)
        response = self._client.search.query(**kwargs)

        results: list[SearchResult] = []
        for item in (response.results or [])[:num_results]:
            url = getattr(item, "url", None) or ""
            title = getattr(item, "title", None)
            snippet = getattr(item, "snippet", None) or getattr(item, "description", None)
            results.append(
                SearchResult(
                    url=url,
                    domain=_domain(url),
                    title=title,
                    snippet=snippet,
                    source_type=_classify_url(url),
                    discovered_at=datetime.utcnow().isoformat(),
                )
            )

        logger.info("TinySearch: returned %d results", len(results))
        return results
