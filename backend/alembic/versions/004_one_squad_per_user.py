"""one active squad membership per user

Revision ID: 004
Revises: 003
Create Date: 2026-06-13

"""

from typing import Sequence, Union

from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE UNIQUE INDEX uq_squad_memberships_one_active_user
        ON squad_memberships (user_id) WHERE status = 'ACTIVE'
        """
    )


def downgrade() -> None:
    op.drop_index("uq_squad_memberships_one_active_user", table_name="squad_memberships")
