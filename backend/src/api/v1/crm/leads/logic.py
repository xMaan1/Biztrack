import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, Query
from sqlalchemy.orm import Session

from .....models.crm import Lead
from ..contacts.logic import create_contact
from ..http_common import (
    apply_scoped_filters,
    delete_message,
    notify_assignee,
    notify_crm_broadcast,
    pagination,
    require_tenant,
    safe_uuid,
    tenant_id_optional,
    user_display_name,
    visible_or_404,
)
from ..repository import create_entity, delete_by_id, get_by_id, list_for_tenant, update_entity
from ..shared import _contact_create_to_orm_dict
from ..contacts.schemas import ContactCreate
from .schemas import LeadCreate, LeadUpdate, CRMLeadsResponse

ORM_KEYS = frozenset({
    "id", "tenant_id", "firstName", "lastName", "email", "phone", "company", "jobTitle",
    "leadSource", "status", "priority", "assignedToId", "createdById", "notes", "createdAt", "updatedAt",
})


def get_lead_by_id(lead_id: str, db: Session, tenant_id: str = None) -> Optional[Lead]:
    return get_by_id(Lead, lead_id, db, tenant_id)


def _get_all_leads(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Lead]:
    return list_for_tenant(Lead, db, tenant_id, skip, limit)


get_leads = _get_all_leads
get_all_leads = _get_all_leads


def get_leads_by_status(status: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Lead]:
    return list_for_tenant(Lead, db, tenant_id, skip, limit, filters=[Lead.status == status])


def get_leads_by_assignee(assignee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Lead]:
    return list_for_tenant(Lead, db, tenant_id, skip, limit, filters=[Lead.assignedToId == assignee_id])


def create_lead(lead_data: dict, db: Session) -> Lead:
    return create_entity(Lead, lead_data, db)


def update_lead(lead_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Lead]:
    lead = get_lead_by_id(lead_id, db, tenant_id)
    if not lead:
        return None
    filtered = {k: v for k, v in update_data.items() if v is not None}
    return update_entity(lead, filtered, db)


def delete_lead(lead_id: str, db: Session, tenant_id: str = None) -> bool:
    return delete_by_id(Lead, lead_id, db, tenant_id)


def _lead_predicate(status, source, assigned_to, search):
    def _match(lead: Lead) -> bool:
        if status and lead.status != status:
            return False
        if source and (lead.leadSource or "") != source:
            return False
        if assigned_to and str(lead.assignedToId or "") != str(assigned_to):
            return False
        if search:
            sl = search.lower()
            if not any(
                sl in (getattr(lead, f, None) or "").lower()
                for f in ("firstName", "lastName", "email", "company")
            ):
                return False
        return True

    return _match


def get_crm_leads(
    db: Session,
    current_user,
    tenant_context: Optional[dict],
    status: Optional[str] = None,
    source: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
):
    try:
        skip = (page - 1) * limit
        tid = tenant_id_optional(tenant_context)
        leads = get_leads(db, tid, skip, limit)
        leads = apply_scoped_filters(
            leads, tenant_context, current_user, _lead_predicate(status, source, assigned_to, search)
        )
        total = len(leads)
        return CRMLeadsResponse(leads=leads, pagination=pagination(page, limit, total))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leads: {str(e)}")


def create_crm_lead(lead_data: LeadCreate, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        ctx = require_tenant(tenant_context)
        lead_dict = lead_data.dict()
        if lead_dict.get("assignedTo"):
            lead_dict["assignedToId"] = lead_dict.pop("assignedTo", None)
        lead_dict["tenant_id"] = ctx["tenant_id"]
        lead_dict["id"] = uuid.uuid4()
        lead_dict["createdById"] = safe_uuid(current_user.id)
        lead_dict["createdAt"] = datetime.utcnow()
        lead_dict["updatedAt"] = datetime.utcnow()
        lead_dict = {k: v for k, v in lead_dict.items() if k in ORM_KEYS}
        lead = create_lead(lead_dict, db)
        name = f"{lead_data.firstName} {lead_data.lastName}".strip() or "Lead"
        notify_crm_broadcast(
            db, ctx, current_user,
            title="New Lead Created",
            message=f"{user_display_name(current_user)} created a new lead: {name}",
            path=f"/crm/leads/{lead.id}",
            meta={"lead_id": str(lead.id), "created_by": str(current_user.id)},
        )
        notify_assignee(db, ctx, current_user, lead, entity_label="Lead", entity_name=name, path=f"/crm/leads/{lead.id}")
        return lead
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating lead: {str(e)}")


def get_crm_lead(lead_id: str, db: Session, current_user, tenant_context: Optional[dict] = None):
    try:
        lead = get_lead_by_id(lead_id, db, tenant_id_optional(tenant_context))
        return visible_or_404(lead, tenant_context, current_user, detail="Lead not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching lead: {str(e)}")


def update_crm_lead(lead_id: str, lead_data: LeadUpdate, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        ctx = require_tenant(tenant_context)
        tid = tenant_id_optional(tenant_context)
        lead = visible_or_404(get_lead_by_id(lead_id, db, tid), tenant_context, current_user, detail="Lead not found")
        update_data = lead_data.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        if "assignedTo" in update_data:
            update_data["assignedToId"] = update_data.pop("assignedTo", None)
        updated = update_lead(lead_id, update_data, db, tid)
        name = f"{getattr(updated, 'firstName', '')} {getattr(updated, 'lastName', '')}".strip() or "Lead"
        notify_crm_broadcast(
            db, ctx, current_user,
            title="Lead Updated",
            message=f"{user_display_name(current_user)} updated lead: {name}",
            path=f"/crm/leads/{lead_id}",
            meta={"lead_id": lead_id, "updated_by": str(current_user.id)},
        )
        notify_assignee(db, ctx, current_user, updated, entity_label="Lead", entity_name=name, path=f"/crm/leads/{lead_id}")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating lead: {str(e)}")


def delete_crm_lead(lead_id: str, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        tid = tenant_id_optional(tenant_context)
        visible_or_404(get_lead_by_id(lead_id, db, tid), tenant_context, current_user, detail="Lead not found")
        if not delete_lead(lead_id, db, tid):
            raise HTTPException(status_code=404, detail="Lead not found")
        return delete_message("Lead")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting lead: {str(e)}")


def convert_lead_to_contact(
    lead_id: str,
    contact_data: ContactCreate,
    current_user,
    db: Session,
    tenant_context: Optional[dict] = None,
):
    try:
        ctx = require_tenant(tenant_context)
        tid = str(ctx["tenant_id"])
        lead = visible_or_404(get_lead_by_id(lead_id, db, tid), tenant_context, current_user, detail="Lead not found")
        contact = create_contact(
            _contact_create_to_orm_dict(contact_data, tid, str(current_user.id)),
            db,
        )
        lead.status = "converted"
        lead.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(contact)
        db.refresh(lead)
        return {"message": "Lead converted successfully", "contact": contact}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error converting lead: {str(e)}")
