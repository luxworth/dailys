"""one active challenge unique index

Revision ID: 003
Revises: 002
Create Date: 2026-06-12

"""

from typing import Sequence, Union

from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE UNIQUE INDEX uq_challenges_one_active
        ON challenges ((true)) WHERE status = 'ACTIVE'
        """
    )


def downgrade() -> None:
    op.drop_index("uq_challenges_one_active", table_name="challenges")
