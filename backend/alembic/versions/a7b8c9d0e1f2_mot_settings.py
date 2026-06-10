"""add mot settings

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-06-09 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'mot_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('inspection_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.execute(
        "INSERT INTO mot_settings (id, inspection_price, updated_at) VALUES (1, 49.00, NOW())"
    )


def downgrade() -> None:
    op.drop_table('mot_settings')
