"""Pydantic request/response schemas for the API."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, field_validator
import re


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Mission ──────────────────────────────────────────────────────────────────

class MissionInput(BaseModel):
    objective: str
    industry: Optional[str] = None
    target_market: Optional[str] = None
    geographic_scope: Optional[str] = None
    competitors: Optional[list[str]] = None
    reference_urls: Optional[list[str]] = None
    deliverables: Optional[list[str]] = None
    include_monitoring: bool = False
    include_browser_action: bool = False


class MissionStepResponse(BaseModel):
    id: str
    mission_id: str
    step_type: str
    provider: str
    status: str
    input_summary: Optional[str] = None
    output_summary: Optional[str] = None
    error_code: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SourceResponse(BaseModel):
    id: str
    url: str
    domain: str
    title: Optional[str] = None
    source_type: Optional[str] = None
    snippet: Optional[str] = None
    discovered_at: datetime
    extraction_status: Optional[str] = None

    model_config = {"from_attributes": True}


class FindingResponse(BaseModel):
    id: str
    mission_id: str
    source_id: Optional[str] = None
    source_url: Optional[str] = None
    category: str
    claim: str
    structured_value: Optional[dict] = None
    evidence_excerpt: Optional[str] = None
    confidence: str
    verification_status: str
    observed_at: datetime

    model_config = {"from_attributes": True}


class ReportContent(BaseModel):
    key_findings: list[str] = []
    competitor_comparison: Optional[list[dict]] = None
    market_opportunities: Optional[list[str]] = None
    recommendations: list[dict] = []
    risks_and_uncertainties: list[str] = []
    missing_information: list[str] = []
    next_steps: list[str] = []
    sources: list[dict] = []


class ReportResponse(BaseModel):
    id: str
    mission_id: str
    title: str
    executive_summary: str
    structured_content: dict
    status: str
    generated_at: datetime

    model_config = {"from_attributes": True}


class MissionResponse(BaseModel):
    id: str
    title: str
    objective: str
    status: str
    input_parameters: dict
    execution_plan: Optional[dict] = None
    error_summary: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Monitor ──────────────────────────────────────────────────────────────────

class MonitorCreateRequest(BaseModel):
    name: Optional[str] = None
    target: str
    monitor_type: str = "page"
    schedule_cron: str = "0 9 * * *"
    purpose: Optional[str] = None
    mission_id: Optional[str] = None

    @field_validator("monitor_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ("page", "topic"):
            raise ValueError("monitor_type must be 'page' or 'topic'")
        return v


class MonitorResponse(BaseModel):
    id: str
    mission_id: Optional[str] = None
    provider_monitor_id: Optional[str] = None
    name: str
    target: str
    monitor_type: str
    schedule_cron: str
    status: str
    purpose: Optional[str] = None
    last_checked_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MonitorEventResponse(BaseModel):
    id: str
    monitor_id: str
    event_type: str
    previous_value: Optional[str] = None
    current_value: Optional[str] = None
    change_summary: Optional[str] = None
    evidence_url: Optional[str] = None
    observed_at: datetime

    model_config = {"from_attributes": True}


# ─── Browser Actions ──────────────────────────────────────────────────────────

class BrowserActionResponse(BaseModel):
    id: str
    mission_id: Optional[str] = None
    action_type: str
    target: str
    proposed_steps: list[str]
    approval_status: str
    execution_status: str
    result_summary: Optional[str] = None
    evidence: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Research ─────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    purpose: Optional[str] = None
    num_results: int = 10


class FetchRequest(BaseModel):
    urls: list[str]
    purpose: Optional[str] = None
