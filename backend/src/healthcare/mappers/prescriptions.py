from typing import List

from ...models.healthcare_models import (
    Prescription as PrescriptionPydantic,
    PrescriptionItem,
)


def prescription_items_to_db(items: List[PrescriptionItem]) -> list:
    return [
        {
            "medicine_name": i.medicine_name,
            "dosage": i.dosage,
            "frequency": i.frequency,
            "duration": i.duration,
        }
        for i in (items or [])
    ]


def db_prescription_to_pydantic(db_rx, db_doctor=None, appointment_date=None) -> PrescriptionPydantic:
    if db_doctor is None and hasattr(db_rx, "doctor") and db_rx.doctor:
        db_doctor = db_rx.doctor
    items = db_rx.items or []
    prescription_items = [
        PrescriptionItem(
            medicine_name=x.get("medicine_name", ""),
            dosage=x.get("dosage"),
            frequency=x.get("frequency"),
            duration=x.get("duration"),
        )
        for x in (items if isinstance(items, list) else [])
    ]
    apt_date = appointment_date
    if apt_date is None and hasattr(db_rx, "appointment") and db_rx.appointment:
        apt_date = str(db_rx.appointment.appointment_date) if db_rx.appointment.appointment_date else None
    return PrescriptionPydantic(
        id=str(db_rx.id),
        tenant_id=str(db_rx.tenant_id),
        appointment_id=str(db_rx.appointment_id),
        doctor_id=str(db_rx.doctor_id),
        patient_name=db_rx.patient_name,
        patient_phone=db_rx.patient_phone,
        prescription_date=db_rx.prescription_date,
        notes=db_rx.notes,
        items=prescription_items,
        createdAt=db_rx.createdAt,
        updatedAt=db_rx.updatedAt,
        doctor_first_name=db_doctor.first_name if db_doctor else None,
        doctor_last_name=db_doctor.last_name if db_doctor else None,
        appointment_date=apt_date,
    )
