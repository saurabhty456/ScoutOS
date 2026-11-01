from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.db import User, BrowserAction
from app.auth import get_current_user
from app.schemas import BrowserActionResponse

router = APIRouter(prefix="/api/actions", tags=["actions"])


@router.get("", response_model=dict)
async def list_actions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(BrowserAction).order_by(BrowserAction.created_at.desc()))
    actions = result.scalars().all()
    return {"actions": [BrowserActionResponse.model_validate(a) for a in actions]}


@router.get("/{action_id}", response_model=BrowserActionResponse)
async def get_action(
    action_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(BrowserAction).where(BrowserAction.id == action_id))
    action = result.scalar_one_or_none()
    if not action:
        raise HTTPException(404, "Action not found")
    return action


@router.post("/{action_id}/approve", response_model=BrowserActionResponse)
async def approve_action(
    action_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(BrowserAction).where(BrowserAction.id == action_id))
    action = result.scalar_one_or_none()
    if not action:
        raise HTTPException(404, "Action not found")
    if action.approval_status != "pending":
        raise HTTPException(409, "Action is not pending approval")

    action.approval_status = "approved"
    action.execution_status = "executing"
    await db.commit()

    # Run browser workflow in background
    background_tasks.add_task(_execute_browser_action, action_id)

    await db.refresh(action)
    return action


@router.post("/{action_id}/reject", response_model=BrowserActionResponse)
async def reject_action(
    action_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(BrowserAction).where(BrowserAction.id == action_id))
    action = result.scalar_one_or_none()
    if not action:
        raise HTTPException(404, "Action not found")
    action.approval_status = "rejected"
    action.execution_status = "cancelled"
    await db.commit()
    await db.refresh(action)
    return action


@router.post("/{action_id}/retry", response_model=BrowserActionResponse)
async def retry_action(
    action_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reset a failed action back to pending so it can be re-approved and executed."""
    result = await db.execute(select(BrowserAction).where(BrowserAction.id == action_id))
    action = result.scalar_one_or_none()
    if not action:
        raise HTTPException(404, "Action not found")
    if action.execution_status not in ("failed",):
        raise HTTPException(409, "Only failed actions can be retried")
    action.approval_status = "approved"
    action.execution_status = "executing"
    action.result_summary = None
    action.evidence = None
    await db.commit()

    background_tasks.add_task(_execute_browser_action, action_id)
    await db.refresh(action)
    return action


async def _execute_browser_action(action_id: str):
    """Execute an approved browser action in the background."""
    from app.database import AsyncSessionLocal
    from app.adapters.tinybrowser import TinyBrowserAdapter

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(BrowserAction).where(BrowserAction.id == action_id))
        action = result.scalar_one_or_none()
        if not action:
            return

        adapter = TinyBrowserAdapter()
        try:
            workflow_result = await adapter.run_workflow(
                target_url=action.target,
                steps=action.proposed_steps,
                purpose=action.action_type,
            )
            action.execution_status = "completed" if workflow_result.success else "failed"
            action.result_summary = (
                f"Completed {len(workflow_result.steps_completed)} steps. "
                f"{workflow_result.evidence or ''}"
            ) if workflow_result.success else f"Failed: {workflow_result.error}"
            action.evidence = workflow_result.evidence
        except Exception as exc:
            action.execution_status = "failed"
            action.result_summary = f"Execution error: {str(exc)[:200]}"

        await db.commit()
