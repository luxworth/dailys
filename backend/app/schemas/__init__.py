from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from zoneinfo import ZoneInfo, available_timezones

from enum import StrEnum
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import (
    AudioType,
    HapticType,
    ReactionType,
    SubmissionStatus,
    TaskType,
)

T = TypeVar("T")


class ErrorResponse(BaseModel):
    code: str
    message: str


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)
    timezone: str = Field(default="UTC", max_length=64)

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        if value not in available_timezones():
            raise ValueError(f"Invalid timezone: {value}")
        ZoneInfo(value)
        return value


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    username: str
    timezone: str


class TaskInfo(BaseModel):
    task_type: TaskType
    title: str
    placeholder: str | None


class SubmissionSummary(BaseModel):
    id: UUID
    status: SubmissionStatus
    is_ghost: bool
    submitted_at: datetime | None = None
    number_value: Decimal | None = None
    text_value: str | None = None
    image_url: str | None = None


class ChallengeTodayResponse(BaseModel):
    challenge_id: UUID
    sequence_number: int
    released_at: datetime
    closes_at: datetime
    task: TaskInfo
    submission: SubmissionSummary | None


class SubmissionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    number_value: Decimal | None = None
    text_value: str | None = None
    image_url: str | None = None

    @field_validator("number_value", "text_value", "image_url", mode="before")
    @classmethod
    def empty_string_to_none(cls, value):
        if value == "":
            return None
        return value


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    challenge_id: UUID
    status: SubmissionStatus
    is_ghost: bool
    number_value: Decimal | None
    text_value: str | None
    image_url: str | None
    submitted_at: datetime


class InteractionMeta(BaseModel):
    haptic: HapticType
    audio: AudioType | None = None
    milestone: str | None = None
    intensity: float = Field(default=1.0, ge=0.0, le=1.0)


class TransactionalResponse(BaseModel, Generic[T]):
    data: T
    interaction: InteractionMeta


class SubmissionTransactionalResponse(TransactionalResponse[SubmissionResponse]):
    pass


class ReactionCounts(BaseModel):
    mind_blown: int = 0
    laugh: int = 0
    respect: int = 0


class FeedItem(BaseModel):
    id: UUID
    username: str
    proof_preview: str
    submitted_at: datetime
    reactions: ReactionCounts
    viewer_reaction: ReactionType | None


class FeedPage(BaseModel):
    items: list[FeedItem]
    next_cursor: str | None


class ReactionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reaction_type: ReactionType


class ReactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    submission_id: UUID
    reaction_type: ReactionType


class StreakResponse(BaseModel):
    streak: int


class PercentileResponse(BaseModel):
    percentile: float | None


class SquadLeaderboardEntry(BaseModel):
    user_id: UUID
    username: str
    streak: int
    status: str
    today_status: SubmissionStatus | None = None
    rank: int


class SquadLeaderboardResponse(BaseModel):
    squad_id: UUID
    week_start: date | None = None
    week_end: date | None = None
    entries: list[SquadLeaderboardEntry]


class SquadCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=128)


class SquadJoin(BaseModel):
    model_config = ConfigDict(extra="forbid")

    invite_code: str = Field(min_length=1, max_length=32)


class SquadCreatedResponse(BaseModel):
    squad_id: UUID
    name: str
    invite_code: str


class MySquadResponse(BaseModel):
    squad_id: UUID
    name: str
    invite_code: str
    member_count: int
    max_members: int = 5


class PushTokenUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expo_push_token: str = Field(min_length=1, max_length=255)


class SquadNudgeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_id: UUID


class SquadNudgeResponse(BaseModel):
    delivered: bool


class EliminationSummary(BaseModel):
    squad_id: UUID
    user_id: UUID


class CloseWeekResponse(BaseModel):
    squads_processed: int
    eliminations: list[EliminationSummary]


class HistoryDayStatus(StrEnum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PENDING = "PENDING"
    NONE = "NONE"


class HistoryDay(BaseModel):
    date: date
    status: HistoryDayStatus


class HistoryTraceEntry(BaseModel):
    date: date
    task_type: TaskType
    title: str
    submission_preview: str


class UserHistoryResponse(BaseModel):
    streak: int
    days: list[HistoryDay]
    trace: list[HistoryTraceEntry]


class GhostDeployRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    challenge_id: UUID


class GhostDeployResponse(BaseModel):
    submission_id: UUID
    challenge_id: UUID
    ghosts_remaining: int


class GhostDeployTransactionalResponse(TransactionalResponse[GhostDeployResponse]):
    pass


class UploadResponse(BaseModel):
    image_url: str


class UserItemsResponse(BaseModel):
    ghost: int
