from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from ...models.healthcare_models import (
    Doctor as DoctorPydantic,
    DoctorCreate,
    DoctorUpdate,
    DoctorAvailabilitySlot,
    DoctorsResponse,
    HealthcareStaff as HealthcareStaffPydantic,
    HealthcareStaffCreate,
    HealthcareStaffUpdate,
    HealthcareStaffResponse,
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
    get_healthcare_staff_by_id,
    get_healthcare_staff,
    get_healthcare_staff_count,
    create_healthcare_staff,
    update_healthcare_staff,
    get_user_by_email,
    create_user,
)
from ...api.dependencies import get_current_user, get_tenant_context, require_permission
from ...models.common import ModulePermission
from ...services.rbac_service import RBACService
from ...config.core_models import User as UserModel, TenantUser as TenantUserModel, Role as RoleModel
from ...core.auth import get_password_hash
from uuid import UUID
from sqlalchemy import and_

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


HEALTHCARE_PERMISSION_SET = {
    ModulePermission.HEALTHCARE_VIEW.value,
    ModulePermission.HEALTHCARE_CREATE.value,
    ModulePermission.HEALTHCARE_UPDATE.value,
    ModulePermission.HEALTHCARE_DELETE.value,
}


def _normalize_healthcare_permissions(perms: Optional[List[str]]) -> List[str]:
    items = [p for p in (perms or []) if isinstance(p, str)]
    filtered = [p for p in items if p in HEALTHCARE_PERMISSION_SET]
    deduped = list(dict.fromkeys(filtered))
    if not deduped:
        deduped = [ModulePermission.HEALTHCARE_VIEW.value]
    return deduped


def _merge_healthcare_permissions(existing: Optional[List[str]], healthcare_perms: List[str]) -> List[str]:
    base = [p for p in (existing or []) if isinstance(p, str) and not p.startswith("healthcare:")]
    merged = base + healthcare_perms
    return list(dict.fromkeys(merged))


def _ensure_healthcare_staff_role(db: Session, tenant_id: str) -> RoleModel:
    role = db.query(RoleModel).filter(
        and_(
            RoleModel.tenant_id == tenant_id,
            RoleModel.name == "healthcare_staff",
            RoleModel.isActive == True,
        )
    ).first()
    if role:
        return role
    role = RoleModel(
        tenant_id=tenant_id,
        name="healthcare_staff",
        display_name="Healthcare Staff",
        description="Healthcare module staff",
        permissions=[],
        isActive=True,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def _db_staff_to_pydantic(db_staff, db_user: UserModel, tenant_id: str, permissions: List[str]) -> HealthcareStaffPydantic:
    return HealthcareStaffPydantic(
        id=str(db_staff.id),
        tenant_id=str(db_staff.tenant_id),
        user_id=str(db_staff.user_id),
        username=db_user.userName,
        email=db_user.email,
        first_name=db_user.firstName,
        last_name=db_user.lastName,
        phone=db_staff.phone,
        role=db_staff.role,
        permissions=permissions,
        is_active=db_staff.is_active if hasattr(db_staff, "is_active") else True,
        createdAt=db_staff.createdAt,
        updatedAt=db_staff.updatedAt,
    )


@router.get("/staff", response_model=HealthcareStaffResponse)
async def list_healthcare_staff(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]
    skip = (page - 1) * limit
    db_staff = get_healthcare_staff(db, tenant_id, skip=skip, limit=limit, search=search, is_active=is_active)
    total = get_healthcare_staff_count(db, tenant_id, search=search, is_active=is_active)

    out: List[HealthcareStaffPydantic] = []
    for s in db_staff:
        u = db.query(UserModel).filter(UserModel.id == s.user_id).first()
        if not u:
            continue
        perms = RBACService.get_user_permissions(db, str(u.id), tenant_id)
        healthcare_perms = [p for p in perms if p.startswith("healthcare:")]
        out.append(_db_staff_to_pydantic(s, u, tenant_id, healthcare_perms))

    return HealthcareStaffResponse(staff=out, total=total)


@router.post("/staff", response_model=HealthcareStaffPydantic, status_code=status.HTTP_201_CREATED)
async def create_healthcare_staff_endpoint(
    body: HealthcareStaffCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user=Depends(require_permission(ModulePermission.USERS_CREATE.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]

    existing = get_user_by_email(body.email, db)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A user with this email already exists")

    if not RBACService.validate_username_uniqueness(db, body.username, tenant_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken in this tenant")

    role = _ensure_healthcare_staff_role(db, tenant_id)
    healthcare_perms = _normalize_healthcare_permissions(body.permissions)

    user_dict = {
        "tenant_id": UUID(tenant_id),
        "userName": body.username,
        "email": body.email,
        "firstName": body.first_name,
        "lastName": body.last_name,
        "hashedPassword": get_password_hash(body.password),
        "isActive": True,
    }
    db_user = create_user(user_dict, db)

    tenant_user = TenantUserModel(
        tenant_id=UUID(tenant_id),
        userId=UUID(str(db_user.id)),
        role_id=UUID(str(role.id)),
        role=role.name,
        custom_permissions=healthcare_perms,
        isActive=True,
        invitedBy=UUID(str(current_user.id)),
    )
    db.add(tenant_user)
    db.commit()
    db.refresh(tenant_user)

    staff_dict = {
        "tenant_id": UUID(tenant_id),
        "user_id": UUID(str(db_user.id)),
        "phone": body.phone,
        "role": body.role,
        "is_active": True,
    }
    db_staff = create_healthcare_staff(staff_dict, db)
    return _db_staff_to_pydantic(db_staff, db_user, tenant_id, healthcare_perms)


@router.put("/staff/{staff_id}", response_model=HealthcareStaffPydantic)
async def update_healthcare_staff_endpoint(
    staff_id: str,
    body: HealthcareStaffUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user=Depends(require_permission(ModulePermission.USERS_UPDATE.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]

    db_staff = get_healthcare_staff_by_id(staff_id, db, tenant_id)
    if not db_staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")

    db_user = db.query(UserModel).filter(UserModel.id == db_staff.user_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if body.email is not None and body.email != db_user.email:
        if get_user_by_email(body.email, db):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        db_user.email = body.email

    if body.username is not None and body.username != db_user.userName:
        if not RBACService.validate_username_uniqueness(db, body.username, tenant_id, exclude_user_id=str(db_user.id)):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken in this tenant")
        db_user.userName = body.username

    if body.first_name is not None:
        db_user.firstName = body.first_name
    if body.last_name is not None:
        db_user.lastName = body.last_name
    if body.password is not None and body.password.strip():
        db_user.hashedPassword = get_password_hash(body.password)

    staff_update = {}
    if body.phone is not None:
        staff_update["phone"] = body.phone
    if body.role is not None:
        staff_update["role"] = body.role
    if body.is_active is not None:
        staff_update["is_active"] = body.is_active
    if staff_update:
        db_staff = update_healthcare_staff(staff_id, staff_update, db, tenant_id)

    if body.permissions is not None:
        healthcare_perms = _normalize_healthcare_permissions(body.permissions)
        tenant_user = db.query(TenantUserModel).filter(
            and_(
                TenantUserModel.tenant_id == tenant_id,
                TenantUserModel.userId == db_user.id,
                TenantUserModel.isActive == True,
            )
        ).first()
        if tenant_user:
            tenant_user.custom_permissions = _merge_healthcare_permissions(tenant_user.custom_permissions, healthcare_perms)
            db.commit()
        perms = RBACService.get_user_permissions(db, str(db_user.id), tenant_id)
        effective = [p for p in perms if p.startswith("healthcare:")]
        return _db_staff_to_pydantic(db_staff, db_user, tenant_id, effective)

    perms = RBACService.get_user_permissions(db, str(db_user.id), tenant_id)
    effective = [p for p in perms if p.startswith("healthcare:")]
    db.commit()
    db.refresh(db_user)
    return _db_staff_to_pydantic(db_staff, db_user, tenant_id, effective)


@router.delete("/staff/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_healthcare_staff_endpoint(
    staff_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission(ModulePermission.USERS_DELETE.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]

    db_staff = get_healthcare_staff_by_id(staff_id, db, tenant_id)
    if not db_staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")

    db_staff.is_active = False
    tenant_user = db.query(TenantUserModel).filter(
        and_(
            TenantUserModel.tenant_id == tenant_id,
            TenantUserModel.userId == db_staff.user_id,
            TenantUserModel.isActive == True,
        )
    ).first()
    if tenant_user:
        tenant_user.custom_permissions = _merge_healthcare_permissions(tenant_user.custom_permissions, [])
    db.commit()
