from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ...config.database import get_db
from ...api.dependencies import get_current_user, get_tenant_context
from ...models.user_models import User
from ...models.job_card_models import JobCardCreate, JobCardUpdate, JobCardResponse
from ...config.job_card_crud import (
    get_job_card_by_id,
    get_all_job_cards,
    get_next_job_card_number,
    create_job_card,
    update_job_card,
    delete_job_card,
    get_job_card_stats,
)

router = APIRouter(prefix="/job-cards", tags=["Job Cards"])


def _job_card_to_response(jc) -> JobCardResponse:
    return JobCardResponse(
        id=str(jc.id),
        tenant_id=str(jc.tenant_id),
        job_card_number=jc.job_card_number,
        title=jc.title,
        description=jc.description,
        status=jc.status,
        priority=jc.priority,
        work_order_id=str(jc.work_order_id) if jc.work_order_id else None,
        customer_id=str(jc.customer_id) if jc.customer_id else None,
        customer_name=jc.customer_name,
        customer_phone=jc.customer_phone,
        vehicle_info=jc.vehicle_info or {},
        assigned_to_id=str(jc.assigned_to_id) if jc.assigned_to_id else None,
        created_by_id=str(jc.created_by_id),
        planned_date=jc.planned_date,
        completed_at=jc.completed_at,
        labor_estimate=jc.labor_estimate or 0.0,
        parts_estimate=jc.parts_estimate or 0.0,
        notes=jc.notes,
        attachments=jc.attachments or [],
        items=jc.items or [],
        is_active=jc.is_active,
        created_at=jc.created_at,
        updated_at=jc.updated_at,
    )


@router.get("", response_model=List[JobCardResponse])
def list_job_cards(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None),
    work_order_id: Optional[str] = Query(None),
    assigned_to_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    cards = get_all_job_cards(
        db, tenant_id, skip=skip, limit=limit,
        status=status, work_order_id=work_order_id, assigned_to_id=assigned_to_id,
    )
    return [_job_card_to_response(c) for c in cards]


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    return get_job_card_stats(db, tenant_id)


@router.get("/{job_card_id}", response_model=JobCardResponse)
def get_job_card(
    job_card_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    jc = get_job_card_by_id(job_card_id, db, tenant_id)
    if not jc:
        raise HTTPException(status_code=404, detail="Job card not found")
    return _job_card_to_response(jc)


@router.post("", response_model=JobCardResponse)
def create_job_card_endpoint(
    body: JobCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    job_card_number = get_next_job_card_number(db, tenant_id)
    data = body.model_dump(exclude_unset=True)
    if data.get("planned_date") and isinstance(data["planned_date"], str):
        data["planned_date"] = datetime.fromisoformat(data["planned_date"].replace("Z", "+00:00"))
    data["tenant_id"] = tenant_id
    data["created_by_id"] = str(current_user.id)
    data["job_card_number"] = job_card_number
    data["attachments"] = data.get("attachments") or []
    data["items"] = data.get("items") or []
    jc = create_job_card(data, db, tenant_id)
    return _job_card_to_response(jc)


@router.put("/{job_card_id}", response_model=JobCardResponse)
def update_job_card_endpoint(
    job_card_id: str,
    body: JobCardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    jc = get_job_card_by_id(job_card_id, db, tenant_id)
    if not jc:
        raise HTTPException(status_code=404, detail="Job card not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("planned_date") and isinstance(data["planned_date"], str):
        data["planned_date"] = datetime.fromisoformat(data["planned_date"].replace("Z", "+00:00"))
    if data.get("completed_at") and isinstance(data["completed_at"], str):
        data["completed_at"] = datetime.fromisoformat(data["completed_at"].replace("Z", "+00:00"))
    update_data = {k: v for k, v in data.items() if hasattr(jc, k)}
    update_job_card(job_card_id, update_data, db, tenant_id)
    jc = get_job_card_by_id(job_card_id, db, tenant_id)
    return _job_card_to_response(jc)


@router.delete("/{job_card_id}")
def delete_job_card_endpoint(
    job_card_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    if not delete_job_card(job_card_id, db, tenant_id):
        raise HTTPException(status_code=404, detail="Job card not found")
    return {"message": "Job card deleted"}
