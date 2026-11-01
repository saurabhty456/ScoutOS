"""SQLAlchemy ORM models."""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


def now() -> datetime:
    return datetime.utcnow()


def new_id() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now)

    missions: Mapped[list["Mission"]] = relationship("Mission", back_populates="creator")


class Mission(Base):
    __tablename__ = "missions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    title: Mapped[str] = mapped_column(String)
    objective: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="draft")
    created_by: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    input_parameters: Mapped[dict] = mapped_column(JSON, default=dict)
    execution_plan: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    error_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now)

    creator: Mapped["User"] = relationship("User", back_populates="missions")
    steps: Mapped[list["MissionStep"]] = relationship("MissionStep", back_populates="mission", cascade="all, delete-orphan")
    sources: Mapped[list["MissionSource"]] = relationship("MissionSource", back_populates="mission", cascade="all, delete-orphan")
    findings: Mapped[list["Finding"]] = relationship("Finding", back_populates="mission", cascade="all, delete-orphan")
    report: Mapped[Optional["Report"]] = relationship("Report", back_populates="mission", uselist=False, cascade="all, delete-orphan")
    monitors: Mapped[list["Monitor"]] = relationship("Monitor", back_populates="mission")
    actions: Mapped[list["BrowserAction"]] = relationship("BrowserAction", back_populates="mission", cascade="all, delete-orphan")


class MissionStep(Base):
    __tablename__ = "mission_steps"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    mission_id: Mapped[str] = mapped_column(String, ForeignKey("missions.id"))
    step_type: Mapped[str] = mapped_column(String)
    provider: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="pending")
    input_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    output_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    mission: Mapped["Mission"] = relationship("Mission", back_populates="steps")


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    url: Mapped[str] = mapped_column(Text)
    domain: Mapped[str] = mapped_column(String)
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    source_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    snippet: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    discovered_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    last_fetched_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class MissionSource(Base):
    __tablename__ = "mission_sources"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    mission_id: Mapped[str] = mapped_column(String, ForeignKey("missions.id"))
    source_id: Mapped[str] = mapped_column(String, ForeignKey("sources.id"))
    discovery_method: Mapped[str] = mapped_column(String, default="search")
    extraction_status: Mapped[str] = mapped_column(String, default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    mission: Mapped["Mission"] = relationship("Mission", back_populates="sources")
    source: Mapped["Source"] = relationship("Source")


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    mission_id: Mapped[str] = mapped_column(String, ForeignKey("missions.id"))
    source_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("sources.id"), nullable=True)
    category: Mapped[str] = mapped_column(String)
    claim: Mapped[str] = mapped_column(Text)
    structured_value: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    evidence_excerpt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence: Mapped[str] = mapped_column(String, default="medium")
    verification_status: Mapped[str] = mapped_column(String, default="unverified")
    observed_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    mission: Mapped["Mission"] = relationship("Mission", back_populates="findings")
    source: Mapped[Optional["Source"]] = relationship("Source")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    mission_id: Mapped[str] = mapped_column(String, ForeignKey("missions.id"), unique=True)
    title: Mapped[str] = mapped_column(String)
    executive_summary: Mapped[str] = mapped_column(Text)
    structured_content: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String, default="final")
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now)

    mission: Mapped["Mission"] = relationship("Mission", back_populates="report")


class Monitor(Base):
    __tablename__ = "monitors"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    mission_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("missions.id"), nullable=True)
    provider_monitor_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name: Mapped[str] = mapped_column(String)
    target: Mapped[str] = mapped_column(Text)
    monitor_type: Mapped[str] = mapped_column(String, default="page")
    schedule_cron: Mapped[str] = mapped_column(String, default="0 9 * * *")
    status: Mapped[str] = mapped_column(String, default="active")
    purpose: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_checked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now)

    mission: Mapped[Optional["Mission"]] = relationship("Mission", back_populates="monitors")
    events: Mapped[list["MonitorEvent"]] = relationship("MonitorEvent", back_populates="monitor", cascade="all, delete-orphan")


class MonitorEvent(Base):
    __tablename__ = "monitor_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    monitor_id: Mapped[str] = mapped_column(String, ForeignKey("monitors.id"))
    event_type: Mapped[str] = mapped_column(String)
    previous_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    current_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    change_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    monitor: Mapped["Monitor"] = relationship("Monitor", back_populates="events")


class BrowserAction(Base):
    __tablename__ = "browser_actions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    mission_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("missions.id"), nullable=True)
    action_type: Mapped[str] = mapped_column(String)
    target: Mapped[str] = mapped_column(Text)
    proposed_steps: Mapped[list] = mapped_column(JSON, default=list)
    approval_status: Mapped[str] = mapped_column(String, default="pending")
    execution_status: Mapped[str] = mapped_column(String, default="pending_approval")
    result_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now)

    mission: Mapped[Optional["Mission"]] = relationship("Mission", back_populates="actions")
