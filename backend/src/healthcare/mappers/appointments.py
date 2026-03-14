from ...models.healthcare_models import Appointment as AppointmentPydantic


def db_appointment_to_pydantic(db_appointment, db_doctor=None) -> AppointmentPydantic:
    if db_doctor is None and hasattr(db_appointment, "doctor") and db_appointment.doctor:
        db_doctor = db_appointment.doctor
    doctor_first_name = db_doctor.first_name if db_doctor else None
    doctor_last_name = db_doctor.last_name if db_doctor else None
    return AppointmentPydantic(
        id=str(db_appointment.id),
        tenant_id=str(db_appointment.tenant_id),
        doctor_id=str(db_appointment.doctor_id),
        patient_id=str(db_appointment.patient_id) if db_appointment.patient_id else None,
        patient_name=db_appointment.patient_name,
        patient_phone=db_appointment.patient_phone,
        appointment_date=db_appointment.appointment_date,
        start_time=db_appointment.start_time,
        end_time=db_appointment.end_time,
        status=db_appointment.status or "scheduled",
        notes=db_appointment.notes,
        is_active=db_appointment.is_active if hasattr(db_appointment, "is_active") else True,
        createdAt=db_appointment.createdAt,
        updatedAt=db_appointment.updatedAt,
        doctor_first_name=doctor_first_name,
        doctor_last_name=doctor_last_name,
    )
