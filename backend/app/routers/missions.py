import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.db import User, Mission, MissionStep, Source, MissionSource, Finding, Report
from app.auth import get_current_user
from app.schemas import (
    MissionInput, MissionResponse, MissionStepResponse,
    SourceResponse, FindingResponse, ReportResponse
)
from app.orchestrator import run_mission

router = APIRouter(prefix="/api/missions", tags=["missions"])


def _title_from_objective(objective: str) -> str:
    """Generate a short title from the objective."""
    words = objective.split()[:8]
    title = " ".join(words)
    if len(objective.split()) > 8:
        title += "…"
    return title


@router.post("", response_model=MissionResponse, status_code=201)
async def create_mission(
    req: MissionInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mission = Mission(
        title=_title_from_objective(req.objective),
        objective=req.objective,
        status="draft",
        created_by=current_user.id,
        input_parameters=req.model_dump(exclude_none=True),
    )
    db.add(mission)
    await db.commit()
    await db.refresh(mission)
    return mission


@router.get("", response_model=dict)
async def list_missions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Mission)
        .where(Mission.created_by == current_user.id)
        .order_by(Mission.created_at.desc())
    )
    missions = result.scalars().all()
    return {"missions": [MissionResponse.model_validate(m) for m in missions]}


@router.get("/{mission_id}", response_model=MissionResponse)
async def get_mission(
    mission_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Mission).where(Mission.id == mission_id, Mission.created_by == current_user.id))
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(404, "Mission not found")
    return mission


@router.post("/{mission_id}/start", response_model=MissionResponse)
async def start_mission(
    mission_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Mission).where(Mission.id == mission_id, Mission.created_by == current_user.id))
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(404, "Mission not found")
    if mission.status not in ("draft", "failed", "partially_completed", "cancelled"):
        raise HTTPException(409, f"Mission is already {mission.status}")

    mission.status = "queued"
    await db.commit()
    await db.refresh(mission)

    # Run in background
    background_tasks.add_task(_run_mission_bg, mission_id)
    return mission


async def _run_mission_bg(mission_id: str):
    """Background task wrapper that creates its own DB session."""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        await run_mission(mission_id, session)


@router.post("/{mission_id}/cancel", response_model=MissionResponse)
async def cancel_mission(
    mission_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Mission).where(Mission.id == mission_id, Mission.created_by == current_user.id))
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(404, "Mission not found")
    mission.status = "cancelled"
    await db.commit()
    await db.refresh(mission)
    return mission


@router.get("/{mission_id}/steps", response_model=dict)
async def get_steps(
    mission_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _assert_owns(db, mission_id, current_user.id)
    result = await db.execute(
        select(MissionStep).where(MissionStep.mission_id == mission_id).order_by(MissionStep.started_at)
    )
    steps = result.scalars().all()
    return {"steps": [MissionStepResponse.model_validate(s) for s in steps]}


@router.get("/{mission_id}/sources", response_model=dict)
async def get_sources(
    mission_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _assert_owns(db, mission_id, current_user.id)
    result = await db.execute(
        select(Source, MissionSource.extraction_status)
        .join(MissionSource, MissionSource.source_id == Source.id)
        .where(MissionSource.mission_id == mission_id)
        .order_by(Source.discovered_at)
    )
    rows = result.all()
    sources = []
    for source, extraction_status in rows:
        d = SourceResponse.model_validate(source).model_dump()
        d["extraction_status"] = extraction_status
        sources.append(d)
    return {"sources": sources}


@router.get("/{mission_id}/findings", response_model=dict)
async def get_findings(
    mission_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _assert_owns(db, mission_id, current_user.id)
    result = await db.execute(
        select(Finding).where(Finding.mission_id == mission_id).order_by(Finding.observed_at.desc())
    )
    findings = result.scalars().all()

    # Enrich with source URLs
    enriched = []
    for f in findings:
        d = FindingResponse.model_validate(f).model_dump()
        if f.source_id:
            src_result = await db.execute(select(Source).where(Source.id == f.source_id))
            src = src_result.scalar_one_or_none()
            if src:
                d["source_url"] = src.url
        enriched.append(d)
    return {"findings": enriched}


@router.get("/{mission_id}/report", response_model=ReportResponse)
async def get_report(
    mission_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _assert_owns(db, mission_id, current_user.id)
    result = await db.execute(select(Report).where(Report.mission_id == mission_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(404, "Report not yet generated")
    return report


async def _assert_owns(db: AsyncSession, mission_id: str, user_id: str) -> Mission:
    result = await db.execute(select(Mission).where(Mission.id == mission_id, Mission.created_by == user_id))
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(404, "Mission not found")
    return mission
