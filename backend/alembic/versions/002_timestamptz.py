"""use timestamptz for all datetime columns

Revision ID: 002
Revises: 001
Create Date: 2026-06-12

"""

from typing import Sequence, Union

from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TIMESTAMP_COLUMNS = [
    ("users", "created_at"),
    ("challenges", "released_at"),
    ("user_challenge_windows", "opens_at"),
    ("user_challenge_windows", "closes_at"),
    ("submissions", "submitted_at"),
    ("submissions", "verified_at"),
    ("squads", "created_at"),
    ("squad_memberships", "joined_at"),
]


def upgrade() -> None:
    for table, column in TIMESTAMP_COLUMNS:
        op.execute(
            f"ALTER TABLE {table} ALTER COLUMN {column} TYPE TIMESTAMPTZ "
            f"USING {column} AT TIME ZONE 'UTC'"
        )


def downgrade() -> None:
    for table, column in reversed(TIMESTAMP_COLUMNS):
        op.execute(
            f"ALTER TABLE {table} ALTER COLUMN {column} TYPE TIMESTAMP "
            f"USING {column} AT TIME ZONE 'UTC'"
        )
