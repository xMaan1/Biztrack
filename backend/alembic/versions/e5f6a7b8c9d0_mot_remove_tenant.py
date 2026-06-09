"""mot standalone tables remove tenant scoping

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index('ix_mot_bookings_tenant_status', table_name='mot_bookings')
    op.drop_index('ix_mot_bookings_tenant_date', table_name='mot_bookings')
    op.drop_index('ix_mot_bookings_tenant_id', table_name='mot_bookings')
    op.drop_constraint('mot_bookings_work_order_id_fkey', 'mot_bookings', type_='foreignkey')
    op.drop_constraint('mot_bookings_assigned_technician_id_fkey', 'mot_bookings', type_='foreignkey')
    op.drop_constraint('mot_bookings_vehicle_id_fkey', 'mot_bookings', type_='foreignkey')
    op.drop_constraint('mot_bookings_customer_id_fkey', 'mot_bookings', type_='foreignkey')
    op.drop_constraint('mot_bookings_tenant_id_fkey', 'mot_bookings', type_='foreignkey')
    op.drop_column('mot_bookings', 'work_order_id')
    op.drop_column('mot_bookings', 'assigned_technician_id')
    op.drop_column('mot_bookings', 'vehicle_id')
    op.drop_column('mot_bookings', 'customer_id')
    op.drop_column('mot_bookings', 'tenant_id')
    op.create_index('ix_mot_bookings_booking_date', 'mot_bookings', ['booking_date'], unique=False)
    op.create_index('ix_mot_bookings_status', 'mot_bookings', ['status'], unique=False)

    op.drop_index('ix_mot_retailers_tenant_default', table_name='mot_retailers')
    op.drop_index('ix_mot_retailers_tenant_id', table_name='mot_retailers')
    op.drop_constraint('mot_retailers_tenant_id_fkey', 'mot_retailers', type_='foreignkey')
    op.drop_column('mot_retailers', 'tenant_id')
    op.create_index('ix_mot_retailers_is_default', 'mot_retailers', ['is_default'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_mot_retailers_is_default', table_name='mot_retailers')
    op.add_column('mot_retailers', sa.Column('tenant_id', sa.UUID(), nullable=False))
    op.create_foreign_key('mot_retailers_tenant_id_fkey', 'mot_retailers', 'tenants', ['tenant_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_mot_retailers_tenant_id', 'mot_retailers', ['tenant_id'], unique=False)
    op.create_index('ix_mot_retailers_tenant_default', 'mot_retailers', ['tenant_id', 'is_default'], unique=False)

    op.drop_index('ix_mot_bookings_status', table_name='mot_bookings')
    op.drop_index('ix_mot_bookings_booking_date', table_name='mot_bookings')
    op.add_column('mot_bookings', sa.Column('tenant_id', sa.UUID(), nullable=False))
    op.add_column('mot_bookings', sa.Column('customer_id', sa.UUID(), nullable=True))
    op.add_column('mot_bookings', sa.Column('vehicle_id', sa.UUID(), nullable=True))
    op.add_column('mot_bookings', sa.Column('assigned_technician_id', sa.UUID(), nullable=True))
    op.add_column('mot_bookings', sa.Column('work_order_id', sa.UUID(), nullable=True))
    op.create_foreign_key('mot_bookings_tenant_id_fkey', 'mot_bookings', 'tenants', ['tenant_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('mot_bookings_customer_id_fkey', 'mot_bookings', 'customers', ['customer_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('mot_bookings_vehicle_id_fkey', 'mot_bookings', 'vehicles', ['vehicle_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('mot_bookings_assigned_technician_id_fkey', 'mot_bookings', 'users', ['assigned_technician_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('mot_bookings_work_order_id_fkey', 'mot_bookings', 'work_orders', ['work_order_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_mot_bookings_tenant_id', 'mot_bookings', ['tenant_id'], unique=False)
    op.create_index('ix_mot_bookings_tenant_date', 'mot_bookings', ['tenant_id', 'booking_date'], unique=False)
    op.create_index('ix_mot_bookings_tenant_status', 'mot_bookings', ['tenant_id', 'status'], unique=False)
