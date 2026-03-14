from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional

from ...models.healthcare_models import (
    Doctor as DoctorPydantic,
    DoctorCreate,
    DoctorUpdate,
    DoctorsResponse,
    Patient as PatientPydantic,
    PatientCreate,
    PatientUpdate,
    PatientsResponse,
    HealthcareStaff as HealthcareStaffPydantic,
    HealthcareStaffCreate,
    HealthcareStaffUpdate,
    HealthcareStaffResponse,
    Appointment as AppointmentPydantic,
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentsResponse,
    AppointmentInvoiceCreate,
    Prescription as PrescriptionPydantic,
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionsResponse,
    PatientHistoryResponse,
    ExpenseCategory as ExpenseCategoryPydantic,
    ExpenseCategoryCreate,
    ExpenseCategoryUpdate,
    ExpenseCategoriesResponse,
    DailyExpense as DailyExpensePydantic,
    DailyExpenseCreate,
    DailyExpenseUpdate,
    DailyExpensesResponse,
    Admission as AdmissionPydantic,
    AdmissionCreate,
    AdmissionUpdate,
    AdmissionsResponse,
    AdmissionInvoiceSummary,
    AdmissionInvoicesResponse,
)
from ...config.database import get_db
from ...config.invoice_crud import get_invoices_by_order_prefix, get_invoices_by_order_prefix_count
from ...api.dependencies import get_current_user, get_tenant_context, require_permission
from ...config.database import User
from ...models.common import ModulePermission
from ...healthcare.queries import (
    list_doctors_handler,
    get_doctor_handler,
    list_patients_handler,
    get_patient_handler,
    list_appointments_handler,
    list_appointments_calendar_handler,
    get_appointment_handler,
    list_prescriptions_handler,
    get_prescription_handler,
    list_healthcare_staff_handler,
    get_patient_history_handler,
    list_expense_categories_handler,
    get_expense_category_handler,
    list_daily_expenses_handler,
    get_daily_expense_handler,
    list_admissions_handler,
    get_admission_handler,
)
from ...healthcare.commands import (
    create_doctor_handler,
    update_doctor_handler,
    delete_doctor_handler,
    create_patient_handler,
    update_patient_handler,
    delete_patient_handler,
    create_appointment_handler,
    update_appointment_handler,
    delete_appointment_handler,
    create_prescription_handler,
    update_prescription_handler,
    delete_prescription_handler,
    create_healthcare_staff_handler,
    update_healthcare_staff_handler,
    delete_healthcare_staff_handler,
    create_expense_category_handler,
    update_expense_category_handler,
    delete_expense_category_handler,
    create_daily_expense_handler,
    update_daily_expense_handler,
    delete_daily_expense_handler,
    create_admission_handler,
    update_admission_handler,
    delete_admission_handler,
)
from ...healthcare.commands.appointment_invoice import create_appointment_invoice_handler
from ...healthcare.commands.admission_invoice import create_admission_invoice_handler

router = APIRouter(prefix="/healthcare", tags=["healthcare"])


@router.get("/doctors", response_model=DoctorsResponse)
async def list_doctors(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return list_doctors_handler(tenant_context["tenant_id"], db, search=search, is_active=is_active, page=page, limit=limit)


@router.get("/doctors/{doctor_id}", response_model=DoctorPydantic)
async def get_doctor(
    doctor_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return get_doctor_handler(tenant_context["tenant_id"], doctor_id, db)


@router.post("/doctors", response_model=DoctorPydantic, status_code=status.HTTP_201_CREATED)
async def create_doctor_endpoint(
    body: DoctorCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return create_doctor_handler(tenant_context["tenant_id"], body, db)


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
    return update_doctor_handler(tenant_context["tenant_id"], doctor_id, body, db)


@router.delete("/doctors/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doctor_endpoint(
    doctor_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    delete_doctor_handler(tenant_context["tenant_id"], doctor_id, db)


@router.get("/patients", response_model=PatientsResponse)
async def list_patients(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return list_patients_handler(tenant_context["tenant_id"], db, search=search, is_active=is_active, page=page, limit=limit)


@router.get("/patients/{patient_id}", response_model=PatientPydantic)
async def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return get_patient_handler(tenant_context["tenant_id"], patient_id, db)


@router.get("/patients/{patient_id}/history", response_model=PatientHistoryResponse)
async def get_patient_history(
    patient_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return get_patient_history_handler(tenant_context["tenant_id"], patient_id, db)


@router.post("/patients", response_model=PatientPydantic, status_code=status.HTTP_201_CREATED)
async def create_patient_endpoint(
    body: PatientCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return create_patient_handler(tenant_context["tenant_id"], body, db)


@router.put("/patients/{patient_id}", response_model=PatientPydantic)
async def update_patient_endpoint(
    patient_id: str,
    body: PatientUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return update_patient_handler(tenant_context["tenant_id"], patient_id, body, db)


@router.delete("/patients/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient_endpoint(
    patient_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    delete_patient_handler(tenant_context["tenant_id"], patient_id, db)


@router.get("/appointments", response_model=AppointmentsResponse)
async def list_appointments(
    doctor_id: Optional[str] = Query(None),
    patient_id: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return list_appointments_handler(
        tenant_context["tenant_id"],
        db,
        doctor_id=doctor_id,
        patient_id=patient_id,
        date_from=date_from,
        date_to=date_to,
        search=search,
        is_active=is_active,
        page=page,
        limit=limit,
    )


@router.get("/appointments/calendar", response_model=AppointmentsResponse)
async def list_appointments_calendar(
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    doctor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return list_appointments_calendar_handler(
        tenant_context["tenant_id"], db, date_from, date_to, doctor_id=doctor_id
    )


@router.get("/appointments/{appointment_id}", response_model=AppointmentPydantic)
async def get_appointment(
    appointment_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return get_appointment_handler(tenant_context["tenant_id"], appointment_id, db)


@router.post("/appointments", response_model=AppointmentPydantic, status_code=status.HTTP_201_CREATED)
async def create_appointment_endpoint(
    body: AppointmentCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return create_appointment_handler(tenant_context["tenant_id"], body, db)


@router.put("/appointments/{appointment_id}", response_model=AppointmentPydantic)
async def update_appointment_endpoint(
    appointment_id: str,
    body: AppointmentUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return update_appointment_handler(tenant_context["tenant_id"], appointment_id, body, db)


@router.delete("/appointments/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment_endpoint(
    appointment_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    delete_appointment_handler(tenant_context["tenant_id"], appointment_id, db)


@router.post("/appointments/{appointment_id}/invoice", status_code=status.HTTP_201_CREATED)
async def create_appointment_invoice_endpoint(
    appointment_id: str,
    body: AppointmentInvoiceCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    line_items = [{"description": i.description, "amount": i.amount} for i in body.line_items]
    inv = create_appointment_invoice_handler(
        tenant_context["tenant_id"],
        appointment_id,
        line_items,
        str(current_user.id),
        db,
        currency=body.currency,
        tax_rate=body.tax_rate,
        discount=body.discount,
    )
    return {"invoice_id": str(inv.id), "invoice_number": inv.invoiceNumber}


@router.get("/admissions", response_model=AdmissionsResponse)
async def list_admissions(
    status: Optional[str] = Query(None),
    patient_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return list_admissions_handler(
        tenant_context["tenant_id"],
        db,
        status=status,
        patient_id=patient_id,
        doctor_id=doctor_id,
        date_from=date_from,
        date_to=date_to,
        search=search,
        is_active=is_active,
        page=page,
        limit=limit,
    )


@router.get("/admissions/{admission_id}", response_model=AdmissionPydantic)
async def get_admission(
    admission_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return get_admission_handler(tenant_context["tenant_id"], admission_id, db)


@router.post("/admissions", response_model=AdmissionPydantic, status_code=status.HTTP_201_CREATED)
async def create_admission_endpoint(
    body: AdmissionCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return create_admission_handler(tenant_context["tenant_id"], body, db)


@router.put("/admissions/{admission_id}", response_model=AdmissionPydantic)
async def update_admission_endpoint(
    admission_id: str,
    body: AdmissionUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return update_admission_handler(tenant_context["tenant_id"], admission_id, body, db)


@router.delete("/admissions/{admission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admission_endpoint(
    admission_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    delete_admission_handler(tenant_context["tenant_id"], admission_id, db)


@router.post("/admissions/{admission_id}/invoice", status_code=status.HTTP_201_CREATED)
async def create_admission_invoice_endpoint(
    admission_id: str,
    body: AppointmentInvoiceCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user: User = Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    line_items = [{"description": i.description, "amount": i.amount} for i in body.line_items]
    inv = create_admission_invoice_handler(
        tenant_context["tenant_id"],
        admission_id,
        line_items,
        str(current_user.id),
        db,
        currency=body.currency,
        tax_rate=body.tax_rate,
        discount=body.discount,
    )
    return {"invoice_id": str(inv.id), "invoice_number": inv.invoiceNumber}


@router.get("/admission-invoices", response_model=AdmissionInvoicesResponse)
async def list_admission_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]
    skip = (page - 1) * limit
    db_invoices = get_invoices_by_order_prefix(db, tenant_id, "ADM-", skip=skip, limit=limit)
    total = get_invoices_by_order_prefix_count(db, tenant_id, "ADM-")
    invoices = [
        AdmissionInvoiceSummary(
            id=str(inv.id),
            invoice_number=inv.invoiceNumber or "",
            order_number=inv.orderNumber,
            customer_name=inv.customerName or "",
            total=float(inv.total or 0),
            total_paid=float(inv.totalPaid or 0),
            balance=float(inv.balance or 0),
            status=inv.status or "draft",
        )
        for inv in db_invoices
    ]
    return AdmissionInvoicesResponse(invoices=invoices, total=total)


@router.get("/prescriptions", response_model=PrescriptionsResponse)
async def list_prescriptions(
    appointment_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    patient_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return list_prescriptions_handler(
        tenant_context["tenant_id"],
        db,
        appointment_id=appointment_id,
        doctor_id=doctor_id,
        patient_id=patient_id,
        search=search,
        page=page,
        limit=limit,
    )


@router.get("/prescriptions/{prescription_id}", response_model=PrescriptionPydantic)
async def get_prescription(
    prescription_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return get_prescription_handler(tenant_context["tenant_id"], prescription_id, db)


@router.post("/prescriptions", response_model=PrescriptionPydantic, status_code=status.HTTP_201_CREATED)
async def create_prescription_endpoint(
    body: PrescriptionCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return create_prescription_handler(tenant_context["tenant_id"], body, db)


@router.put("/prescriptions/{prescription_id}", response_model=PrescriptionPydantic)
async def update_prescription_endpoint(
    prescription_id: str,
    body: PrescriptionUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return update_prescription_handler(tenant_context["tenant_id"], prescription_id, body, db)


@router.delete("/prescriptions/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prescription_endpoint(
    prescription_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    delete_prescription_handler(tenant_context["tenant_id"], prescription_id, db)


@router.get("/prescriptions/{prescription_id}/download")
async def download_prescription_pdf(
    prescription_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    from ...config.database import get_prescription_by_id, get_doctor_by_id, get_appointment_by_id
    from .prescription_pdf import generate_prescription_pdf
    db_rx = get_prescription_by_id(prescription_id, db, tenant_context["tenant_id"])
    if not db_rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    db_doctor = get_doctor_by_id(str(db_rx.doctor_id), db, tenant_context["tenant_id"])
    pdf_bytes = generate_prescription_pdf(db_rx, db_doctor, None)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=prescription-{prescription_id}.pdf"},
    )


@router.get("/staff", response_model=HealthcareStaffResponse)
async def list_healthcare_staff(
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
    return list_healthcare_staff_handler(
        tenant_context["tenant_id"], db, search=search, is_active=is_active, page=page, limit=limit
    )


@router.post("/staff", response_model=HealthcareStaffPydantic, status_code=status.HTTP_201_CREATED)
async def create_healthcare_staff_endpoint(
    body: HealthcareStaffCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user=Depends(require_permission(ModulePermission.USERS_CREATE.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return create_healthcare_staff_handler(
        tenant_context["tenant_id"], body, db, str(current_user.id)
    )


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
    return update_healthcare_staff_handler(tenant_context["tenant_id"], staff_id, body, db)


@router.delete("/staff/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_healthcare_staff_endpoint(
    staff_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(require_permission(ModulePermission.USERS_DELETE.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    delete_healthcare_staff_handler(tenant_context["tenant_id"], staff_id, db)


@router.get("/expense-categories", response_model=ExpenseCategoriesResponse)
async def list_expense_categories(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(500, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return list_expense_categories_handler(
        tenant_context["tenant_id"], db, search=search, is_active=is_active, page=page, limit=limit
    )


@router.get("/expense-categories/{category_id}", response_model=ExpenseCategoryPydantic)
async def get_expense_category(
    category_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return get_expense_category_handler(tenant_context["tenant_id"], category_id, db)


@router.post("/expense-categories", response_model=ExpenseCategoryPydantic, status_code=status.HTTP_201_CREATED)
async def create_expense_category_endpoint(
    body: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return create_expense_category_handler(tenant_context["tenant_id"], body, db)


@router.put("/expense-categories/{category_id}", response_model=ExpenseCategoryPydantic)
async def update_expense_category_endpoint(
    category_id: str,
    body: ExpenseCategoryUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return update_expense_category_handler(tenant_context["tenant_id"], category_id, body, db)


@router.delete("/expense-categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense_category_endpoint(
    category_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    delete_expense_category_handler(tenant_context["tenant_id"], category_id, db)


@router.get("/daily-expenses", response_model=DailyExpensesResponse)
async def list_daily_expenses(
    category_id: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(500, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    from datetime import date as date_type
    date_from_parsed = date_type.fromisoformat(date_from) if date_from else None
    date_to_parsed = date_type.fromisoformat(date_to) if date_to else None
    return list_daily_expenses_handler(
        tenant_context["tenant_id"],
        db,
        category_id=category_id,
        date_from=date_from_parsed,
        date_to=date_to_parsed,
        search=search,
        is_active=is_active,
        page=page,
        limit=limit,
    )


@router.get("/daily-expenses/{expense_id}", response_model=DailyExpensePydantic)
async def get_daily_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return get_daily_expense_handler(tenant_context["tenant_id"], expense_id, db)


@router.post("/daily-expenses", response_model=DailyExpensePydantic, status_code=status.HTTP_201_CREATED)
async def create_daily_expense_endpoint(
    body: DailyExpenseCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return create_daily_expense_handler(tenant_context["tenant_id"], body, db)


@router.put("/daily-expenses/{expense_id}", response_model=DailyExpensePydantic)
async def update_daily_expense_endpoint(
    expense_id: str,
    body: DailyExpenseUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return update_daily_expense_handler(tenant_context["tenant_id"], expense_id, body, db)


@router.delete("/daily-expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_daily_expense_endpoint(
    expense_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    delete_daily_expense_handler(tenant_context["tenant_id"], expense_id, db)
