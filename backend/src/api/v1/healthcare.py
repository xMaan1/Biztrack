from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from ...models.healthcare_models import (
    Doctor as DoctorPydantic,
    DoctorCreate,
    DoctorUpdate,
    DoctorAvailabilitySlot,
    DoctorsResponse,
)
from ...config.database import (
    get_db,
    get_doctor_by_id,
    get_doctor_by_pmdc,
    get_doctors,
    get_doctors_count,
    create_doctor,
    update_doctor,
    delete_doctor,
)
from ...api.dependencies import get_current_user, get_tenant_context

router = APIRouter(prefix="/healthcare", tags=["healthcare"])


def _db_doctor_to_pydantic(db_doctor) -> DoctorPydantic:
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


def _availability_to_db(availability: List[DoctorAvailabilitySlot]) -> list:
    return [{"day": s.day, "start_time": s.start_time, "end_time": s.end_time} for s in (availability or [])]


@router.get("/doctors", response_model=DoctorsResponse)
async def list_doctors(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]
    skip = (page - 1) * limit
    db_doctors = get_doctors(db, tenant_id, skip=skip, limit=limit, search=search, is_active=is_active)
    total = get_doctors_count(db, tenant_id, search=search, is_active=is_active)
    doctors = [_db_doctor_to_pydantic(d) for d in db_doctors]
    return DoctorsResponse(doctors=doctors, total=total)


@router.get("/doctors/{doctor_id}", response_model=DoctorPydantic)
async def get_doctor(
    doctor_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    db_doctor = get_doctor_by_id(doctor_id, db, tenant_context["tenant_id"])
    if not db_doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return _db_doctor_to_pydantic(db_doctor)


@router.post("/doctors", response_model=DoctorPydantic, status_code=status.HTTP_201_CREATED)
async def create_doctor_endpoint(
    body: DoctorCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]
    existing = get_doctor_by_pmdc(tenant_id, body.pmdc_number, db)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A doctor with this PMDC number already exists for this tenant",
        )
    doctor_data = {
        "tenant_id": tenant_id,
        "pmdc_number": body.pmdc_number,
        "phone": body.phone,
        "first_name": body.first_name,
        "last_name": body.last_name,
        "email": body.email,
        "specialization": body.specialization,
        "qualification": body.qualification,
        "address": body.address,
        "availability": _availability_to_db(body.availability),
        "is_active": True,
    }
    db_doctor = create_doctor(doctor_data, db)
    return _db_doctor_to_pydantic(db_doctor)


@router.put("/doctors/{doctor_id}", response_model=DoctorPydantic)
async def update_doctor_endpoint(
    doctor_id: str,
    body: DoctorUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]
    db_doctor = get_doctor_by_id(doctor_id, db, tenant_id)
    if not db_doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    if body.pmdc_number is not None and body.pmdc_number != db_doctor.pmdc_number:
        existing = get_doctor_by_pmdc(tenant_id, body.pmdc_number, db)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A doctor with this PMDC number already exists for this tenant",
            )
    update_data = body.model_dump(exclude_unset=True)
    if "availability" in update_data and update_data["availability"] is not None:
        update_data["availability"] = _availability_to_db(update_data["availability"])
    updated = update_doctor(doctor_id, update_data, db, tenant_id)
    return _db_doctor_to_pydantic(updated)


@router.delete("/doctors/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doctor_endpoint(
    doctor_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    deleted = delete_doctor(doctor_id, db, tenant_context["tenant_id"])
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
