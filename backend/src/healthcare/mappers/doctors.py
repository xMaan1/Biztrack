from typing import List

from ...models.healthcare_models import (
    Doctor as DoctorPydantic,
    DoctorAvailabilitySlot,
)


def db_doctor_to_pydantic(db_doctor) -> DoctorPydantic:
    availability = db_doctor.availability or []
    slots = [
        DoctorAvailabilitySlot(
            day=s.get("day", ""),
            start_time=s.get("start_time", ""),
            end_time=s.get("end_time", ""),
        )
        for s in (availability if isinstance(availability, list) else [])
    ]
    return DoctorPydantic(
        id=str(db_doctor.id),
        tenant_id=str(db_doctor.tenant_id),
        pmdc_number=db_doctor.pmdc_number,
        phone=db_doctor.phone,
        first_name=db_doctor.first_name,
        last_name=db_doctor.last_name,
        email=db_doctor.email,
        specialization=db_doctor.specialization,
        qualification=db_doctor.qualification,
        address=db_doctor.address,
        availability=slots,
        is_active=db_doctor.is_active if hasattr(db_doctor, "is_active") else True,
        createdAt=db_doctor.createdAt,
        updatedAt=db_doctor.updatedAt,
    )


def availability_to_db(availability: List[DoctorAvailabilitySlot]) -> list:
    return [{"day": s.day, "start_time": s.start_time, "end_time": s.end_time} for s in (availability or [])]
