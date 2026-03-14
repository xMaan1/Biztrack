from ...models.healthcare_models import Admission as AdmissionPydantic


def db_admission_to_pydantic(db_admission, db_patient=None, db_doctor=None) -> AdmissionPydantic:
    if db_patient is None and hasattr(db_admission, "patient") and db_admission.patient:
        db_patient = db_admission.patient
    if db_doctor is None and hasattr(db_admission, "doctor") and db_admission.doctor:
        db_doctor = db_admission.doctor
    patient_name = db_patient.full_name if db_patient else None
    doctor_first_name = db_doctor.first_name if db_doctor else None
    doctor_last_name = db_doctor.last_name if db_doctor else None
    return AdmissionPydantic(
        id=str(db_admission.id),
        tenant_id=str(db_admission.tenant_id),
        patient_id=str(db_admission.patient_id),
        doctor_id=str(db_admission.doctor_id),
        admit_date=db_admission.admit_date,
        discharge_date=db_admission.discharge_date,
        status=db_admission.status or "admitted",
        ward=db_admission.ward,
        room_or_bed=db_admission.room_or_bed,
        diagnosis=db_admission.diagnosis,
        notes=db_admission.notes,
        is_active=db_admission.is_active if hasattr(db_admission, "is_active") else True,
        createdAt=db_admission.createdAt,
        updatedAt=db_admission.updatedAt,
        patient_name=patient_name,
        doctor_first_name=doctor_first_name,
        doctor_last_name=doctor_last_name,
    )
