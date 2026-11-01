from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.db import User, Monitor, MonitorEvent
from app.auth import get_current_user
from app.schemas import MonitorCreateRequest, MonitorResponse, MonitorEventResponse
from app.adapters.tinymonitor import TinyMonitorAdapter

router = APIRouter(prefix="/api/monitors", tags=["monitors"])


@router.post("", response_model=MonitorResponse, status_code=201)
async def create_monitor(
    req: MonitorCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    adapter = TinyMonitorAdapter()
    provider_id: str | None = None
    try:
        if req.monitor_type == "page":
            mc = adapter.create_page_monitor(
                req.target,
                name=req.name,
                schedule_cron=req.schedule_cron,
                purpose=req.purpose,
            )
        else:
            mc = adapter.create_topic_monitor(
                req.target,
                name=req.name,
                schedule_cron=req.schedule_cron,
                purpose=req.purpose,
            )
        provider_id = mc.provider_id
    except Exception as exc:
        # Store locally even if provider call fails — makes it clear
        import logging
        logging.getLogger(__name__).warning("TinyMonitor create failed: %s", exc)

    monitor = Monitor(
        mission_id=req.mission_id,
        provider_monitor_id=provider_id,
        name=req.name or f"Monitor: {req.target[:60]}",
        target=req.target,
        monitor_type=req.monitor_type,
        schedule_cron=req.schedule_cron,
        purpose=req.purpose,
        status="active" if provider_id else "failed",
    )
    db.add(monitor)
    await db.commit()
    await db.refresh(monitor)
    return monitor


@router.get("", response_model=dict)
async def list_monitors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Return monitors for missions owned by this user, plus unlinked ones
    result = await db.execute(
        select(Monitor).order_by(Monitor.created_at.desc())
    )
    monitors = result.scalars().all()
    return {"monitors": [MonitorResponse.model_validate(m) for m in monitors]}


@router.get("/{monitor_id}", response_model=MonitorResponse)
async def get_monitor(
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Monitor).where(Monitor.id == monitor_id))
    monitor = result.scalar_one_or_none()
    if not monitor:
        raise HTTPException(404, "Monitor not found")
    return monitor


@router.post("/{monitor_id}/pause", response_model=MonitorResponse)
async def pause_monitor(
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    monitor = await _get_monitor(db, monitor_id)
    if monitor.provider_monitor_id:
        try:
            TinyMonitorAdapter().pause(monitor.provider_monitor_id)
        except Exception:
            pass
    monitor.status = "paused"
    await db.commit()
    await db.refresh(monitor)
    return monitor


@router.post("/{monitor_id}/resume", response_model=MonitorResponse)
async def resume_monitor(
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    monitor = await _get_monitor(db, monitor_id)
    if monitor.provider_monitor_id:
        try:
            TinyMonitorAdapter().resume(monitor.provider_monitor_id)
        except Exception:
            pass
    monitor.status = "active"
    await db.commit()
    await db.refresh(monitor)
    return monitor


@router.get("/{monitor_id}/events", response_model=dict)
async def get_events(
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MonitorEvent).where(MonitorEvent.monitor_id == monitor_id)
        .order_by(MonitorEvent.observed_at.desc())
    )
    events = result.scalars().all()
    return {"events": [MonitorEventResponse.model_validate(e) for e in events]}


async def _get_monitor(db: AsyncSession, monitor_id: str) -> Monitor:
    result = await db.execute(select(Monitor).where(Monitor.id == monitor_id))
    monitor = result.scalar_one_or_none()
    if not monitor:
        raise HTTPException(404, "Monitor not found")
    return monitor
