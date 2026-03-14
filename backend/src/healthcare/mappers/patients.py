from ...models.healthcare_models import Patient as PatientPydantic


def db_patient_to_pydantic(db_patient) -> PatientPydantic:
    return PatientPydantic(
        id=str(db_patient.id),
        tenant_id=str(db_patient.tenant_id),
        full_name=db_patient.full_name,
        phone=db_patient.phone,
        email=db_patient.email,
        date_of_birth=db_patient.date_of_birth,
        address=db_patient.address,
        notes=db_patient.notes,
        is_active=db_patient.is_active if hasattr(db_patient, "is_active") else True,
        createdAt=db_patient.createdAt,
        updatedAt=db_patient.updatedAt,
    )
