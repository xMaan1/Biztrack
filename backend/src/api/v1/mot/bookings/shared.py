from typing import Optional

from .....models.mot import MotBooking
from .schemas import MotBooking as MotBookingSchema


def mot_booking_to_schema(
    row: MotBooking,
    retailer_name: Optional[str] = None,
) -> MotBookingSchema:
    return MotBookingSchema(
        id=str(row.id),
        customer_name=row.customer_name or "",
        customer_phone=row.customer_phone,
        customer_email=row.customer_email,
        vehicle_registration=row.vehicle_registration,
        vehicle_make=row.vehicle_make,
        vehicle_model=row.vehicle_model,
        vehicle_year=row.vehicle_year,
        retailer_id=str(row.retailer_id) if row.retailer_id else None,
        delivery_option=row.delivery_option,
        booking_meta=row.booking_meta if row.booking_meta else None,
        booking_date=row.booking_date,
        start_time=row.start_time,
        end_time=row.end_time,
        test_type=row.test_type or "standard",
        status=row.status or "scheduled",
        price=row.price or 0,
        mileage=row.mileage,
        mot_expiry_date=row.mot_expiry_date,
        notes=row.notes,
        result_notes=row.result_notes,
        is_active=row.is_active if row.is_active is not None else True,
        retailer_name=retailer_name,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )
