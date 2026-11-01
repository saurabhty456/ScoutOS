"""TinyBrowser adapter — remote Playwright/CDP browser session control."""
from __future__ import annotations
import logging
from dataclasses import dataclass
from datetime import datetime

import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)

BROWSER_ENDPOINT = "https://api.browser.tinyfish.ai"
SESSION_TIMEOUT = 60  # seconds to wait for session creation


@dataclass
class BrowserSession:
    session_id: str
    cdp_url: str
    streaming_url: str | None
    created_at: str


@dataclass
class BrowserWorkflowResult:
    session_id: str | None
    success: bool
    steps_completed: list[str]
    error: str | None
    evidence: str | None
    completed_at: str


class TinyBrowserAdapter:
    """Creates TinyBrowser sessions and runs Playwright CDP workflows."""

    def __init__(self):
        settings = get_settings()
        self._api_key = settings.tinyfish_api_key
        self._headers = {"X-API-Key": self._api_key, "Content-Type": "application/json"}

    def create_session(self, url: str | None = None) -> BrowserSession:
        """Create a new remote browser session. Returns cdp_url for Playwright."""
        payload: dict = {}
        if url:
            payload["url"] = url

        logger.info("TinyBrowser: creating session url=%r", url)
        try:
            resp = httpx.post(
                BROWSER_ENDPOINT,
                json=payload,
                headers=self._headers,
                timeout=SESSION_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:
            logger.error("TinyBrowser session creation failed: %s", exc)
            raise RuntimeError(f"TinyBrowser session creation failed: {exc}") from exc

        return BrowserSession(
            session_id=data.get("id") or data.get("session_id", ""),
            cdp_url=data.get("cdp_url", ""),
            streaming_url=data.get("streaming_url"),
            created_at=datetime.utcnow().isoformat(),
        )

    def terminate_session(self, session_id: str) -> None:
        """Explicitly terminate a browser session."""
        try:
            httpx.delete(
                f"{BROWSER_ENDPOINT}/{session_id}",
                headers=self._headers,
                timeout=30,
            )
            logger.info("TinyBrowser: terminated session %s", session_id)
        except Exception as exc:
            logger.warning("TinyBrowser: could not terminate session %s: %s", session_id, exc)

    async def run_workflow(
        self,
        target_url: str,
        steps: list[str],
        purpose: str,
    ) -> BrowserWorkflowResult:
        """Create a session and run a defined workflow using Playwright CDP.

        Uses the sync Playwright API in a thread pool to avoid Windows
        asyncio subprocess limitations.
        """
        session_id: str | None = None

        try:
            # Step 1: Create session
            session = self.create_session(url=target_url)
            session_id = session.session_id
            logger.info("TinyBrowser: session %s created, cdp_url=%s", session_id, session.cdp_url[:60])

            # Step 2: Run Playwright sync API in a separate thread
            # with its own event loop (avoids Windows asyncio subprocess issue)
            import asyncio
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: _run_playwright_sync_wrapper(session.cdp_url, steps)
            )

            return BrowserWorkflowResult(
                session_id=session_id,
                success=result["success"],
                steps_completed=result["steps"],
                error=result.get("error"),
                evidence=result.get("evidence"),
                completed_at=datetime.utcnow().isoformat(),
            )

        except Exception as exc:
            logger.error("TinyBrowser workflow error: %s", exc)
            return BrowserWorkflowResult(
                session_id=session_id,
                success=False,
                steps_completed=[],
                error=str(exc),
                evidence=None,
                completed_at=datetime.utcnow().isoformat(),
            )
        finally:
            if session_id:
                self.terminate_session(session_id)


def _run_playwright_sync_wrapper(cdp_url: str, steps: list[str]) -> dict:
    """Thread entry point — sets Windows ProactorEventLoopPolicy before running Playwright."""
    import sys
    import asyncio as _asyncio
    if sys.platform == "win32":
        _asyncio.set_event_loop_policy(_asyncio.WindowsProactorEventLoopPolicy())
    return _run_playwright_sync(cdp_url, steps)


def _run_playwright_sync(cdp_url: str, steps: list[str]) -> dict:
    """Run Playwright using the sync API (called in a thread on Windows).

    Returns dict with keys: success (bool), steps (list[str]),
    evidence (str|None), error (str|None).
    """
    from playwright.sync_api import sync_playwright

    completed_steps: list[str] = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.connect_over_cdp(cdp_url)
            context = browser.contexts[0] if browser.contexts else browser.new_context()
            page = context.pages[0] if context.pages else context.new_page()

            for step in steps:
                logger.info("TinyBrowser: executing step: %s", step)
                try:
                    step_lower = step.lower()

                    if step_lower.startswith("navigate to"):
                        nav_url = step.split("navigate to", 1)[1].strip().strip("\"'")
                        page.goto(nav_url, wait_until="domcontentloaded", timeout=30000)
                        completed_steps.append(f"Navigated to: {nav_url}")

                    elif step_lower.startswith("wait"):
                        page.wait_for_timeout(2000)
                        completed_steps.append("Waited 2 seconds")

                    elif "screenshot" in step_lower:
                        import tempfile, os
                        screenshot_path = os.path.join(tempfile.gettempdir(), "scout_evidence.png")
                        page.screenshot(path=screenshot_path)
                        completed_steps.append("Captured screenshot")

                    elif step_lower.startswith("click"):
                        selector = step.split("click", 1)[1].strip().strip("\"'")
                        page.click(selector, timeout=10000)
                        completed_steps.append(f"Clicked: {selector}")

                    elif step_lower.startswith("type") or step_lower.startswith("fill"):
                        parts = step.split(" ", 2)
                        if len(parts) >= 3:
                            page.fill(parts[1].strip("'\""), parts[2].strip("'\""))
                            completed_steps.append(f"Filled field: {parts[1]}")

                    elif "title" in step_lower or "get page" in step_lower:
                        title = page.title()
                        completed_steps.append(f"Page title: {title}")

                    elif "verify" in step_lower or "accessible" in step_lower:
                        title = page.title()
                        url = page.url
                        completed_steps.append(f"Verified: page '{title}' is accessible at {url}")

                    else:
                        completed_steps.append(f"Observed: {step}")

                except Exception as step_exc:
                    logger.warning("TinyBrowser step failed: %s: %s", step, step_exc)
                    completed_steps.append(f"Step failed — {step}: {step_exc}")

            # Capture final page state as evidence
            title = page.title()
            url = page.url
            evidence = f"Final page: '{title}' at {url}"

            browser.close()

        return {"success": True, "steps": completed_steps, "evidence": evidence, "error": None}

    except Exception as exc:
        import traceback
        logger.error("TinyBrowser sync workflow error: %s\n%s", exc, traceback.format_exc())
        return {"success": False, "steps": completed_steps, "evidence": None, "error": str(exc) or repr(exc)}
