import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, ForeignKey, Index, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ...config.database_config import Base


class MotBooking(Base):
    __tablename__ = "mot_bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(50))
    customer_email = Column(String(255))
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    vehicle_registration = Column(String(50))
    vehicle_make = Column(String(100))
    vehicle_model = Column(String(100))
    vehicle_year = Column(String(10))
    retailer_id = Column(UUID(as_uuid=True), ForeignKey("mot_retailers.id", ondelete="SET NULL"), nullable=True)
    delivery_option = Column(String(50))
    booking_meta = Column(JSONB, nullable=True)
    booking_date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    test_type = Column(String(50), default="standard")
    status = Column(String(50), default="scheduled")
    price = Column(Numeric(12, 2), default=0)
    mileage = Column(String(50))
    mot_expiry_date = Column(Date, nullable=True)
    assigned_technician_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text)
    result_notes = Column(Text)
    work_order_id = Column(UUID(as_uuid=True), ForeignKey("work_orders.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant")
    customer = relationship("Customer", foreign_keys=[customer_id])
    vehicle = relationship("Vehicle", foreign_keys=[vehicle_id])
    retailer = relationship("MotRetailer", foreign_keys=[retailer_id])
    technician = relationship("User", foreign_keys=[assigned_technician_id])
    work_order = relationship("WorkOrder", foreign_keys=[work_order_id])

    __table_args__ = (
        Index("ix_mot_bookings_tenant_id", "tenant_id"),
        Index("ix_mot_bookings_tenant_date", "tenant_id", "booking_date"),
        Index("ix_mot_bookings_tenant_status", "tenant_id", "status"),
    )
