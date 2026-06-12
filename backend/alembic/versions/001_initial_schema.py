"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-12

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

task_type = postgresql.ENUM("NUMBER", "IMAGE", "TEXT", name="task_type", create_type=False)
submission_status = postgresql.ENUM("PENDING", "SUCCESS", "FAILED", name="submission_status", create_type=False)
reaction_type = postgresql.ENUM("MIND_BLOWN", "LAUGH", "RESPECT", name="reaction_type", create_type=False)
item_type = postgresql.ENUM("GHOST", name="item_type", create_type=False)
squad_member_status = postgresql.ENUM("ACTIVE", "ELIMINATED", name="squad_member_status", create_type=False)
challenge_status = postgresql.ENUM("ACTIVE", "CLOSED", name="challenge_status", create_type=False)


def upgrade() -> None:
    op.execute("CREATE TYPE task_type AS ENUM ('NUMBER', 'IMAGE', 'TEXT')")
    op.execute("CREATE TYPE submission_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED')")
    op.execute("CREATE TYPE reaction_type AS ENUM ('MIND_BLOWN', 'LAUGH', 'RESPECT')")
    op.execute("CREATE TYPE item_type AS ENUM ('GHOST')")
    op.execute("CREATE TYPE squad_member_status AS ENUM ('ACTIVE', 'ELIMINATED')")
    op.execute("CREATE TYPE challenge_status AS ENUM ('ACTIVE', 'CLOSED')")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("username", sa.String(64), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("timezone", sa.String(64), nullable=False, server_default="UTC"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "task_templates",
        sa.Column("id", sa.SmallInteger(), primary_key=True),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("task_type", task_type, nullable=False),
        sa.Column("placeholder", sa.Text(), nullable=True),
        sa.Column("verification_prompt", sa.Text(), nullable=False),
    )

    op.create_table(
        "challenges",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("sequence_number", sa.BigInteger(), nullable=False),
        sa.Column("task_template_id", sa.SmallInteger(), sa.ForeignKey("task_templates.id"), nullable=False),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", challenge_status, nullable=False, server_default="ACTIVE"),
    )
    op.create_index("ix_challenges_sequence_number", "challenges", ["sequence_number"], unique=True)
    op.create_index("ix_challenges_status_released", "challenges", ["status", "released_at"])

    op.create_table(
        "user_challenge_windows",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("challenge_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("challenges.id"), primary_key=True),
        sa.Column("opens_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("closes_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_user_challenge_windows_user_closes",
        "user_challenge_windows",
        ["user_id", "closes_at"],
    )

    op.create_table(
        "submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("challenge_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("challenges.id"), nullable=False),
        sa.Column("status", submission_status, nullable=False, server_default="PENDING"),
        sa.Column("is_ghost", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("number_value", sa.Numeric(20, 4), nullable=True),
        sa.Column("text_value", sa.Text(), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ai_verdict", postgresql.JSONB(), nullable=True),
        sa.UniqueConstraint("user_id", "challenge_id", name="uq_submissions_user_challenge"),
    )
    op.create_index("ix_submissions_user_id", "submissions", ["user_id"])
    op.create_index("ix_submissions_challenge_id", "submissions", ["challenge_id"])
    op.create_index(
        "ix_submissions_challenge_status_submitted",
        "submissions",
        ["challenge_id", "status", "submitted_at"],
    )
    op.create_index(
        "ix_submissions_user_challenge_status",
        "submissions",
        ["user_id", "challenge_id", "status"],
    )

    op.create_table(
        "reactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reaction_type", reaction_type, nullable=False),
        sa.UniqueConstraint("user_id", "submission_id", name="uq_reactions_user_submission"),
    )
    op.create_index("ix_reactions_submission_type", "reactions", ["submission_id", "reaction_type"])

    op.create_table(
        "user_items",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("item_type", item_type, primary_key=True),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.CheckConstraint("quantity >= 0", name="ck_user_items_quantity_nonneg"),
    )

    op.create_table(
        "squads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("invite_code", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_squads_invite_code", "squads", ["invite_code"], unique=True)

    op.create_table(
        "squad_memberships",
        sa.Column("squad_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("squads.id"), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("status", squad_member_status, nullable=False, server_default="ACTIVE"),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "squad_weeks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("squad_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("squads.id"), nullable=False),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("week_end", sa.Date(), nullable=False),
        sa.UniqueConstraint("squad_id", "week_start", name="uq_squad_weeks_squad_start"),
    )

    op.create_table(
        "squad_week_results",
        sa.Column("squad_week_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("squad_weeks.id"), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("status", squad_member_status, nullable=False, server_default="ACTIVE"),
        sa.Column("missed_challenge_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("challenges.id"), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("squad_week_results")
    op.drop_table("squad_weeks")
    op.drop_table("squad_memberships")
    op.drop_table("squads")
    op.drop_table("user_items")
    op.drop_table("reactions")
    op.drop_table("submissions")
    op.drop_table("user_challenge_windows")
    op.drop_table("challenges")
    op.drop_table("task_templates")
    op.drop_table("users")

    op.execute("DROP TYPE challenge_status")
    op.execute("DROP TYPE squad_member_status")
    op.execute("DROP TYPE item_type")
    op.execute("DROP TYPE reaction_type")
    op.execute("DROP TYPE submission_status")
    op.execute("DROP TYPE task_type")
