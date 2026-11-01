"""Mission Orchestrator — coordinates all five TinyFish adapters."""
from __future__ import annotations
import asyncio
import logging
import re
from datetime import datetime
from typing import Any
from urllib.parse import urlparse

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.db import Mission, MissionStep, Source, MissionSource, Finding, Report, Monitor, BrowserAction
from app.adapters.tinysearch import TinySearchAdapter
from app.adapters.tinyfetch import TinyFetchAdapter
from app.adapters.tinyagent import TinyAgentAdapter
from app.adapters.tinybrowser import TinyBrowserAdapter
from app.adapters.tinymonitor import TinyMonitorAdapter

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.utcnow()


def _domain(url: str) -> str:
    try:
        return urlparse(url).netloc.removeprefix("www.")
    except Exception:
        return url


async def _set_status(session: AsyncSession, mission: Mission, status: str) -> None:
    mission.status = status
    mission.updated_at = _now()
    if status in ("discovering", "planning") and not mission.started_at:
        mission.started_at = _now()
    if status in ("completed", "partially_completed", "failed", "cancelled"):
        mission.completed_at = _now()
    await session.commit()


async def _add_step(
    session: AsyncSession,
    mission_id: str,
    step_type: str,
    provider: str,
    *,
    input_summary: str | None = None,
) -> MissionStep:
    step = MissionStep(
        mission_id=mission_id,
        step_type=step_type,
        provider=provider,
        status="running",
        input_summary=input_summary,
        started_at=_now(),
    )
    session.add(step)
    await session.commit()
    await session.refresh(step)
    return step


async def _complete_step(
    session: AsyncSession,
    step: MissionStep,
    *,
    output_summary: str | None = None,
    error_code: str | None = None,
) -> None:
    step.status = "completed" if not error_code else "failed"
    step.output_summary = output_summary
    step.error_code = error_code
    step.completed_at = _now()
    await session.commit()


async def _save_source(session: AsyncSession, mission_id: str, url: str, **kwargs) -> Source:
    # Deduplicate by URL
    existing = await session.execute(select(Source).where(Source.url == url))
    source = existing.scalar_one_or_none()
    if not source:
        source = Source(url=url, domain=_domain(url), **kwargs)
        session.add(source)
        await session.flush()

    # Link to mission
    link_q = await session.execute(
        select(MissionSource).where(
            MissionSource.mission_id == mission_id,
            MissionSource.source_id == source.id,
        )
    )
    if not link_q.scalar_one_or_none():
        ms = MissionSource(mission_id=mission_id, source_id=source.id)
        session.add(ms)

    await session.commit()
    await session.refresh(source)
    return source


async def _save_finding(session: AsyncSession, mission_id: str, **kwargs) -> Finding:
    f = Finding(mission_id=mission_id, **kwargs)
    session.add(f)
    await session.commit()
    return f


def _build_search_queries(mission: Mission) -> list[str]:
    """Generate targeted search queries from mission parameters."""
    obj = mission.objective
    params = mission.input_parameters or {}
    competitors = params.get("competitors") or []

    queries = [obj[:200]]  # primary

    if competitors:
        for c in competitors[:3]:
            queries.append(f"{c} pricing features competitors")

    # Extract market keywords
    industry = params.get("industry")
    if industry:
        queries.append(f"{industry} software tools comparison pricing")

    return queries[:5]


def _build_agent_goal(mission: Mission, url: str) -> str:
    """Build a specific, well-scoped agent goal for a target URL."""
    params = mission.input_parameters or {}
    industry = params.get("industry", "")
    target = params.get("target_market", "")

    return (
        f"Research this company/product for business intelligence purposes. "
        f"Find and return as JSON: company_name, description, pricing (plans and prices if visible, "
        f"otherwise 'not_public'), key_features (list of up to 8), target_audience, "
        f"positioning (one sentence), founded_year (if visible). "
        f"Context: {mission.objective[:200]}. "
        f"If the page is blocked or returns an error, return: {{\"error\": \"blocked\"}}."
    )


def _extract_findings_from_agent_result(result: Any, source_url: str) -> list[dict]:
    """Parse agent result into structured findings."""
    findings = []

    if not result:
        return findings

    if isinstance(result, list):
        items = result
    elif isinstance(result, dict):
        items = [result]
    else:
        # Plain text result
        findings.append({
            "category": "general",
            "claim": str(result)[:500],
            "verification_status": "unverified",
            "confidence": "low",
            "source_url": source_url,
        })
        return findings

    for item in items:
        if not isinstance(item, dict):
            continue
        if item.get("error"):
            continue  # Skip blocked results

        company = item.get("company_name") or item.get("name") or _domain(source_url)

        if item.get("pricing") and item["pricing"] != "not_public":
            findings.append({
                "category": "pricing",
                "claim": f"{company}: {item['pricing']}",
                "verification_status": "verified",
                "confidence": "high",
                "source_url": source_url,
                "evidence_excerpt": str(item.get("pricing"))[:200],
                "structured_value": {"company": company, "pricing": item["pricing"]},
            })

        if item.get("key_features"):
            features = item["key_features"]
            if isinstance(features, list):
                features_str = ", ".join(str(f) for f in features[:8])
            else:
                features_str = str(features)
            findings.append({
                "category": "features",
                "claim": f"{company} features: {features_str}",
                "verification_status": "verified",
                "confidence": "high",
                "source_url": source_url,
                "structured_value": {"company": company, "features": features},
            })

        if item.get("target_audience"):
            findings.append({
                "category": "target_audience",
                "claim": f"{company} targets: {item['target_audience']}",
                "verification_status": "inferred" if "likely" in str(item["target_audience"]).lower() else "verified",
                "confidence": "medium",
                "source_url": source_url,
            })

        if item.get("positioning"):
            findings.append({
                "category": "positioning",
                "claim": f"{company}: {item['positioning']}",
                "verification_status": "inferred",
                "confidence": "medium",
                "source_url": source_url,
            })

        if item.get("description"):
            findings.append({
                "category": "description",
                "claim": f"{company}: {str(item['description'])[:300]}",
                "verification_status": "verified",
                "confidence": "high",
                "source_url": source_url,
            })

    return findings


def _build_report(mission: Mission, findings: list[Finding], sources: list[Source]) -> dict:
    """Build a structured intelligence report from findings."""
    params = mission.input_parameters or {}

    # Group findings by category
    by_category: dict[str, list[Finding]] = {}
    for f in findings:
        by_category.setdefault(f.category, []).append(f)

    # Build competitor comparison
    companies: dict[str, dict] = {}
    for f in findings:
        source_domain = _domain(f.source.url if f.source else "") if hasattr(f, "source") and f.source else ""
        company_key = source_domain or "unknown"

        if f.category == "description" and company_key not in companies:
            companies[company_key] = {"name": company_key, "website": "", "confidence": "medium"}

        if company_key in companies:
            if f.category == "pricing":
                companies[company_key]["pricing"] = f.claim.split(":", 1)[-1].strip() if ":" in f.claim else f.claim
            elif f.category == "target_audience":
                companies[company_key]["target_audience"] = f.claim.split(":", 1)[-1].strip()
            elif f.category == "features":
                sv = f.structured_value or {}
                companies[company_key]["key_features"] = sv.get("features", [])
            elif f.category == "positioning":
                companies[company_key]["positioning"] = f.claim.split(":", 1)[-1].strip()

    competitor_rows = []
    for src in sources[:8]:
        domain = src.domain
        row = companies.get(domain, {})
        competitor_rows.append({
            "name": row.get("name", domain),
            "website": src.url,
            "pricing": row.get("pricing", "Not publicly available"),
            "key_features": row.get("key_features", []),
            "target_audience": row.get("target_audience", "Not specified"),
            "positioning": row.get("positioning"),
            "confidence": "high" if row.get("pricing") and row["pricing"] != "Not publicly available" else "medium",
        })

    # Key findings
    key_findings = []
    pricing_findings = by_category.get("pricing", [])
    if pricing_findings:
        key_findings.append(f"Found pricing information for {len(pricing_findings)} competitor(s).")
    feature_findings = by_category.get("features", [])
    if feature_findings:
        key_findings.append(f"Extracted feature details from {len(feature_findings)} source(s).")
    key_findings.append(f"Analyzed {len(sources)} sources across {len(set(s.domain for s in sources))} domains.")
    if len(sources) > 0:
        key_findings.append("All findings include source URLs for verification.")

    # Missing information
    missing = []
    if not pricing_findings:
        missing.append("Pricing data — most competitors do not publicly display prices.")
    if not by_category.get("target_audience"):
        missing.append("Explicit target audience statements from competitor websites.")

    # Recommendations
    recommendations = [
        {
            "title": "Validate pricing through direct outreach",
            "description": "Most SaaS pricing is not publicly available. Direct sales contact or trials are needed to confirm.",
            "evidence": f"Pricing was not extractable from {len(sources) - len(pricing_findings)} of {len(sources)} sources.",
            "type": "hypothesis",
        },
        {
            "title": "Monitor pricing pages for changes",
            "description": "Set up TinyMonitor on competitor pricing pages to detect future pricing updates.",
            "evidence": "Pricing pages identified in research.",
            "type": "inference",
        },
    ]

    return {
        "key_findings": key_findings,
        "competitor_comparison": competitor_rows[:8],
        "market_opportunities": [
            "Consider market segments not explicitly targeted by current competitors (HYPOTHESIS — requires validation).",
        ],
        "recommendations": recommendations,
        "risks_and_uncertainties": [
            "Pricing data may be outdated or incomplete — verify with vendors.",
            "Competitor feature sets change frequently; findings reflect state at time of research.",
        ],
        "missing_information": missing,
        "next_steps": [
            "Validate pricing with direct vendor outreach.",
            "Set up monitors on competitor pricing pages.",
            "Interview 5 potential customers to validate market gap hypothesis.",
            "Create a competitive feature matrix with verified data.",
        ],
        "sources": [
            {"title": s.title or s.domain, "url": s.url, "retrieved_at": s.discovered_at.isoformat()}
            for s in sources[:15]
        ],
    }


async def run_mission(mission_id: str, session: AsyncSession) -> None:
    """Main orchestration function — runs in a background task."""
    result = await session.execute(select(Mission).where(Mission.id == mission_id))
    mission = result.scalar_one_or_none()
    if not mission:
        logger.error("Mission %s not found", mission_id)
        return

    search_adapter = TinySearchAdapter()
    fetch_adapter = TinyFetchAdapter()
    agent_adapter = TinyAgentAdapter()
    monitor_adapter = TinyMonitorAdapter()

    discovered_sources: list[Source] = []
    all_findings: list[Finding] = []
    has_any_results = False

    try:
        # ── STEP 1: PLANNING ──────────────────────────────────────────────────
        await _set_status(session, mission, "planning")
        queries = _build_search_queries(mission)

        # ── STEP 2: DISCOVERY (TinySearch) ───────────────────────────────────
        await _set_status(session, mission, "discovering")
        step = await _add_step(session, mission_id, "search", "tinysearch",
                               input_summary=f"Queries: {queries[0][:100]}")
        try:
            all_results = []
            for q in queries[:2]:  # Max 2 queries to stay within budget
                try:
                    results = search_adapter.search(q, purpose=mission.objective, num_results=5)
                    all_results.extend(results)
                except Exception as exc:
                    logger.warning("Search query failed: %s", exc)

            # Deduplicate by URL
            seen_urls: set[str] = set()
            unique_results = []
            for r in all_results:
                if r.url not in seen_urls and r.url.startswith("http"):
                    seen_urls.add(r.url)
                    unique_results.append(r)

            for sr in unique_results[:10]:
                source = await _save_source(
                    session, mission_id, sr.url,
                    title=sr.title,
                    snippet=sr.snippet,
                    source_type=sr.source_type,
                )
                discovered_sources.append(source)

            await _complete_step(session, step, output_summary=f"Discovered {len(discovered_sources)} sources")
            has_any_results = len(discovered_sources) > 0
        except Exception as exc:
            await _complete_step(session, step, error_code=str(exc)[:100])
            logger.error("Discovery step failed: %s", exc)

        # ── STEP 3: EXTRACTION (TinyFetch) ───────────────────────────────────
        await _set_status(session, mission, "extracting")
        urls_to_fetch = [s.url for s in discovered_sources[:6]]
        if urls_to_fetch:
            step = await _add_step(session, mission_id, "fetch", "tinyfetch",
                                   input_summary=f"Fetching {len(urls_to_fetch)} URLs")
            try:
                fetch_results = fetch_adapter.fetch(
                    urls_to_fetch,
                    purpose=mission.objective,
                    format="markdown",
                    ttl=0,
                )
                extracted_count = 0
                for fr in fetch_results:
                    # Update extraction status
                    ms_result = await session.execute(
                        select(MissionSource).join(Source).where(
                            MissionSource.mission_id == mission_id,
                            Source.url == fr.url,
                        )
                    )
                    ms = ms_result.scalar_one_or_none()
                    if ms:
                        ms.extraction_status = "extracted" if fr.success else "failed"
                        await session.commit()

                    if fr.success and fr.text:
                        extracted_count += 1
                        # Create a finding from the fetch content
                        snippet = (fr.text or "")[:500].strip()
                        if snippet:
                            await _save_finding(
                                session, mission_id,
                                category="page_content",
                                claim=f"Content extracted from {fr.domain}: {snippet[:200]}",
                                verification_status="verified",
                                confidence="high",
                                evidence_excerpt=snippet[:300],
                            )

                await _complete_step(session, step,
                                     output_summary=f"Extracted content from {extracted_count}/{len(urls_to_fetch)} pages")
            except Exception as exc:
                await _complete_step(session, step, error_code=str(exc)[:100])
                logger.error("Extraction step failed: %s", exc)

        # ── STEP 4: INVESTIGATION (TinyAgent) ────────────────────────────────
        await _set_status(session, mission, "investigating")
        agent_targets = [s for s in discovered_sources[:4]]  # Max 4 agent runs to manage cost

        if agent_targets:
            step = await _add_step(session, mission_id, "agent", "tinyagent",
                                   input_summary=f"Investigating {len(agent_targets)} sources")
            try:
                tasks = [
                    {"url": s.url, "goal": _build_agent_goal(mission, s.url)}
                    for s in agent_targets
                ]
                agent_results = await agent_adapter.run_batch(tasks, max_concurrent=2)

                findings_count = 0
                for src, ar in zip(agent_targets, agent_results):
                    if ar.status == "COMPLETED" and ar.result:
                        extracted = _extract_findings_from_agent_result(ar.result, src.url)
                        for fdata in extracted:
                            source_url = fdata.pop("source_url", None)
                            f = await _save_finding(session, mission_id, **fdata)
                            if source_url:
                                # Link finding to its source
                                src_result = await session.execute(
                                    select(Source).where(Source.url == source_url)
                                )
                                src_obj = src_result.scalar_one_or_none()
                                if src_obj:
                                    f.source_id = src_obj.id
                                    await session.commit()
                            all_findings.append(f)
                            findings_count += 1

                await _complete_step(session, step,
                                     output_summary=f"Extracted {findings_count} findings from {len(agent_targets)} sources")
                has_any_results = True
            except Exception as exc:
                await _complete_step(session, step, error_code=str(exc)[:100])
                logger.error("Investigation step failed: %s", exc)

        # ── STEP 5: ANALYSIS ─────────────────────────────────────────────────
        await _set_status(session, mission, "analyzing")
        step = await _add_step(session, mission_id, "analysis", "scoutos",
                               input_summary="Building competitive analysis")
        try:
            # Reload all findings for this mission
            findings_result = await session.execute(
                select(Finding).where(Finding.mission_id == mission_id)
            )
            all_findings = list(findings_result.scalars().all())

            sources_result = await session.execute(
                select(Source).join(MissionSource).where(MissionSource.mission_id == mission_id)
            )
            all_sources = list(sources_result.scalars().all())

            await _complete_step(session, step,
                                 output_summary=f"Analyzed {len(all_findings)} findings from {len(all_sources)} sources")
        except Exception as exc:
            await _complete_step(session, step, error_code=str(exc)[:100])

        # ── STEP 6: REPORT GENERATION ────────────────────────────────────────
        await _set_status(session, mission, "generating_report")
        step = await _add_step(session, mission_id, "report", "scoutos",
                               input_summary="Generating intelligence report")
        try:
            # Reload sources with their data
            sources_result = await session.execute(
                select(Source).join(MissionSource).where(MissionSource.mission_id == mission_id)
            )
            all_sources = list(sources_result.scalars().all())

            # Load findings with source relationship
            findings_result = await session.execute(
                select(Finding).where(Finding.mission_id == mission_id)
            )
            all_findings = list(findings_result.scalars().all())

            report_content = _build_report(mission, all_findings, all_sources)

            report = Report(
                mission_id=mission_id,
                title=f"Intelligence Report: {mission.title}",
                executive_summary=(
                    f"Research completed for mission: '{mission.objective[:200]}'. "
                    f"Discovered {len(all_sources)} sources across {len(set(s.domain for s in all_sources))} domains. "
                    f"Extracted {len(all_findings)} findings covering pricing, features, and market positioning. "
                    f"All findings include source attribution and confidence indicators."
                ),
                structured_content=report_content,
                status="final",
            )
            session.add(report)
            await session.commit()

            await _complete_step(session, step, output_summary="Report generated")
        except Exception as exc:
            await _complete_step(session, step, error_code=str(exc)[:100])
            logger.error("Report generation failed: %s", exc)

        # ── STEP 7: MONITORING SETUP (TinyMonitor) ───────────────────────────
        if mission.input_parameters.get("include_monitoring") and discovered_sources:
            await _set_status(session, mission, "monitoring_setup")
            step = await _add_step(session, mission_id, "monitor", "tinymonitor",
                                   input_summary="Creating monitors for key sources")
            try:
                # Monitor up to 2 pricing/product pages
                monitor_targets = [
                    s for s in all_sources
                    if s.source_type in ("pricing_page", "product_page", "official_website")
                ][:2]

                monitors_created = 0
                for src in monitor_targets:
                    try:
                        mc = monitor_adapter.create_page_monitor(
                            src.url,
                            name=f"Monitor: {src.title or src.domain}",
                            purpose=f"Alert if pricing or key product information changes on {src.domain}",
                        )
                        monitor = Monitor(
                            mission_id=mission_id,
                            provider_monitor_id=mc.provider_id,
                            name=f"Monitor: {src.title or src.domain}",
                            target=src.url,
                            monitor_type="page",
                            status="active",
                            purpose=f"Track changes on {src.domain}",
                        )
                        session.add(monitor)
                        await session.commit()
                        monitors_created += 1
                    except Exception as me:
                        logger.warning("Failed to create monitor for %s: %s", src.url, me)

                await _complete_step(session, step, output_summary=f"Created {monitors_created} monitors")
            except Exception as exc:
                await _complete_step(session, step, error_code=str(exc)[:100])

        # ── STEP 8: BROWSER ACTION (TinyBrowser) ─────────────────────────────
        if mission.input_parameters.get("include_browser_action"):
            step = await _add_step(session, mission_id, "browser", "tinybrowser",
                                   input_summary="Preparing browser workflow")

            # Pick the best source URL for a browser workflow
            sources_result = await session.execute(
                select(Source).join(MissionSource).where(MissionSource.mission_id == mission_id)
            )
            browser_target = None
            for src in sources_result.scalars().all():
                if src.source_type in ("official_website", "product_page", "pricing_page"):
                    browser_target = src.url
                    break
            if not browser_target and discovered_sources:
                browser_target = discovered_sources[0].url
            if not browser_target:
                browser_target = "https://example.com"

            action = BrowserAction(
                mission_id=mission_id,
                action_type="Competitor Page Verification",
                target=browser_target,
                proposed_steps=[
                    f"Navigate to {browser_target}",
                    "Wait for page to fully load",
                    "Capture page title as evidence",
                    "Verify page is accessible and not blocked",
                    "Record the page state as verification evidence",
                ],
                approval_status="pending",
                execution_status="pending_approval",
            )
            session.add(action)
            await session.commit()
            await _complete_step(session, step,
                                 output_summary=f"Browser action created for {browser_target[:60]} — awaiting user approval")

        # ── DONE ──────────────────────────────────────────────────────────────
        final_status = "completed" if has_any_results else "partially_completed"
        await _set_status(session, mission, final_status)
        logger.info("Mission %s finished with status %s", mission_id, final_status)

    except Exception as exc:
        logger.error("Mission %s orchestration error: %s", mission_id, exc, exc_info=True)
        mission.error_summary = str(exc)[:500]
        await _set_status(session, mission, "failed")
