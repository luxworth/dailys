import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import (
    ChallengeStatus,
    ItemType,
    ReactionType,
    SquadMemberStatus,
    SubmissionStatus,
    TaskType,
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text)
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    expo_push_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    submissions: Mapped[list["Submission"]] = relationship(back_populates="user")
    items: Mapped[list["UserItem"]] = relationship(back_populates="user")


class TaskTemplate(Base):
    __tablename__ = "task_templates"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    title: Mapped[str] = mapped_column(Text)
    task_type: Mapped[TaskType] = mapped_column(Enum(TaskType, name="task_type", create_type=False))
    placeholder: Mapped[str | None] = mapped_column(Text)
    verification_prompt: Mapped[str] = mapped_column(Text)

    challenges: Mapped[list["Challenge"]] = relationship(back_populates="task_template")


class Challenge(Base):
    __tablename__ = "challenges"
    __table_args__ = (
        Index("ix_challenges_status_released", "status", "released_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sequence_number: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    task_template_id: Mapped[int] = mapped_column(ForeignKey("task_templates.id"))
    released_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[ChallengeStatus] = mapped_column(
        Enum(ChallengeStatus, name="challenge_status", create_type=False),
        default=ChallengeStatus.ACTIVE,
    )

    task_template: Mapped[TaskTemplate] = relationship(back_populates="challenges")
    windows: Mapped[list["UserChallengeWindow"]] = relationship(back_populates="challenge")
    submissions: Mapped[list["Submission"]] = relationship(back_populates="challenge")


class UserChallengeWindow(Base):
    __tablename__ = "user_challenge_windows"
    __table_args__ = (
        Index("ix_user_challenge_windows_user_closes", "user_id", "closes_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    challenge_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("challenges.id"), primary_key=True)
    opens_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    closes_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship()
    challenge: Mapped[Challenge] = relationship(back_populates="windows")


class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (
        UniqueConstraint("user_id", "challenge_id", name="uq_submissions_user_challenge"),
        Index("ix_submissions_challenge_status_submitted", "challenge_id", "status", "submitted_at"),
        Index("ix_submissions_user_challenge_status", "user_id", "challenge_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    challenge_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("challenges.id"), index=True)
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus, name="submission_status", create_type=False),
        default=SubmissionStatus.PENDING,
    )
    is_ghost: Mapped[bool] = mapped_column(Boolean, default=False)
    number_value: Mapped[Decimal | None] = mapped_column(Numeric(20, 4))
    text_value: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(Text)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ai_verdict: Mapped[dict | None] = mapped_column(JSONB)

    user: Mapped[User] = relationship(back_populates="submissions")
    challenge: Mapped[Challenge] = relationship(back_populates="submissions")
    reactions: Mapped[list["Reaction"]] = relationship(back_populates="submission")


class Reaction(Base):
    __tablename__ = "reactions"
    __table_args__ = (
        UniqueConstraint("user_id", "submission_id", name="uq_reactions_user_submission"),
        Index("ix_reactions_submission_type", "submission_id", "reaction_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("submissions.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    reaction_type: Mapped[ReactionType] = mapped_column(Enum(ReactionType, name="reaction_type", create_type=False))

    submission: Mapped[Submission] = relationship(back_populates="reactions")
    user: Mapped[User] = relationship()


class UserItem(Base):
    __tablename__ = "user_items"
    __table_args__ = (
        CheckConstraint("quantity >= 0", name="ck_user_items_quantity_nonneg"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    item_type: Mapped[ItemType] = mapped_column(Enum(ItemType, name="item_type", create_type=False), primary_key=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped[User] = relationship(back_populates="items")


class Squad(Base):
    __tablename__ = "squads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(128))
    invite_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    memberships: Mapped[list["SquadMembership"]] = relationship(back_populates="squad")
    weeks: Mapped[list["SquadWeek"]] = relationship(back_populates="squad")


class SquadMembership(Base):
    __tablename__ = "squad_memberships"

    squad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("squads.id"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    status: Mapped[SquadMemberStatus] = mapped_column(
        Enum(SquadMemberStatus, name="squad_member_status", create_type=False),
        default=SquadMemberStatus.ACTIVE,
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    squad: Mapped[Squad] = relationship(back_populates="memberships")
    user: Mapped[User] = relationship()


class SquadWeek(Base):
    __tablename__ = "squad_weeks"
    __table_args__ = (
        UniqueConstraint("squad_id", "week_start", name="uq_squad_weeks_squad_start"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    squad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("squads.id"))
    week_start: Mapped[date] = mapped_column(Date)
    week_end: Mapped[date] = mapped_column(Date)

    squad: Mapped[Squad] = relationship(back_populates="weeks")
    results: Mapped[list["SquadWeekResult"]] = relationship(back_populates="squad_week")


class SquadWeekResult(Base):
    __tablename__ = "squad_week_results"

    squad_week_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("squad_weeks.id"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    status: Mapped[SquadMemberStatus] = mapped_column(
        Enum(SquadMemberStatus, name="squad_member_status", create_type=False),
        default=SquadMemberStatus.ACTIVE,
    )
    missed_challenge_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("challenges.id"))

    squad_week: Mapped[SquadWeek] = relationship(back_populates="results")
    user: Mapped[User] = relationship()


class SquadNudge(Base):
    __tablename__ = "squad_nudges"
    __table_args__ = (
        UniqueConstraint(
            "sender_id",
            "recipient_id",
            "challenge_id",
            name="uq_squad_nudges_sender_recipient_challenge",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    recipient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    challenge_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("challenges.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    sender: Mapped[User] = relationship(foreign_keys=[sender_id])
    recipient: Mapped[User] = relationship(foreign_keys=[recipient_id])
    challenge: Mapped[Challenge] = relationship()
