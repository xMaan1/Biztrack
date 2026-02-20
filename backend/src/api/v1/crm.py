from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import json
import uuid
import base64
import logging
from datetime import datetime, timedelta
from pydantic import BaseModel as PydanticBaseModel

from ...services.s3_service import s3_service

from ...models.crm import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerStatsResponse,
    GuarantorCreate, GuarantorUpdate, GuarantorResponse,
)
from ...models.crm_models import (
    Lead, LeadCreate, LeadUpdate,
    Contact, ContactCreate, ContactUpdate,
    Company, CompanyCreate, CompanyUpdate,
    Opportunity as OpportunityPydantic, OpportunityCreate, OpportunityUpdate,
    SalesActivity, SalesActivityCreate, SalesActivityUpdate,
    CRMLeadsResponse, CRMContactsResponse, CRMCompaniesResponse,
    CRMOpportunitiesResponse, CRMActivitiesResponse,
    CRMDashboard, CRMMetrics, CRMPipeline
)
from ...config.crm_models import Opportunity
from ...config.database import get_db
from ...config.crm_crud import (
    create_lead, get_lead_by_id, get_leads, update_lead, delete_lead,
    create_contact, get_contact_by_id, get_contacts, update_contact, delete_contact,
    create_company, get_company_by_id, get_companies, update_company, delete_company,
    create_opportunity, get_opportunity_by_id, get_opportunities, update_opportunity, delete_opportunity,
    create_customer, get_customer_by_id, get_customers, update_customer, delete_customer,
    get_customer_stats, search_customers, get_sales_activities, get_crm_dashboard_data,
    get_sales_activity_by_id, update_sales_activity, delete_sales_activity,
    create_guarantor, get_guarantors_by_customer, get_guarantor_by_id, update_guarantor, delete_guarantor,
)
from ...api.dependencies import get_current_user, get_tenant_context, require_permission
from ...models.common import ModulePermission


router = APIRouter(prefix="/crm", tags=["crm"])
logger = logging.getLogger(__name__)


class CustomerPhotoUpload(PydanticBaseModel):
    image: str


def process_customer_photo_upload(image_data: str, tenant_id: str, customer_id: str) -> Optional[str]:
    if not image_data:
        return None
    if image_data.startswith("data:image"):
        try:
            if "," not in image_data:
                raise ValueError("Invalid base64 data format")
            header, encoded = image_data.split(",", 1)
            if not encoded or len(encoded) < 100:
                raise ValueError("Base64 data is too short or empty")
            try:
                raw = base64.b64decode(encoded, validate=True)
            except Exception as e:
                logger.error(f"Base64 decode error: {str(e)}")
                raise ValueError("Invalid base64 encoding")
            if len(raw) > 5 * 1024 * 1024:
                raise ValueError("Image size exceeds 5MB limit")
            if len(raw) < 100:
                raise ValueError("Image file is too small")
            file_ext = ".png"
            if "jpeg" in header.lower() or "jpg" in header.lower():
                file_ext = ".jpg"
            elif "gif" in header.lower():
                file_ext = ".gif"
            elif "webp" in header.lower():
                file_ext = ".webp"
            filename = f"customer_{customer_id}_{uuid.uuid4().hex}{file_ext}"
            try:
                result = s3_service.upload_file(
                    file_content=raw,
                    tenant_id=str(tenant_id),
                    folder="customer-photos",
                    original_filename=filename,
                )
            except ValueError as e:
                raise HTTPException(status_code=503, detail="File upload service is not configured. Please contact administrator.")
            if not result or "file_url" not in result:
                raise ValueError("S3 upload failed - no file URL returned")
            return result["file_url"]
        except ValueError as ve:
            logger.error(f"Validation error processing customer photo: {str(ve)}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid image: {str(ve)}")
        except Exception as e:
            logger.error(f"Error processing customer photo: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
    if image_data.startswith("http://") or image_data.startswith("https://"):
        return image_data
    return None


# Customer endpoints
@router.post("/customers", response_model=CustomerResponse)
async def create_customer_endpoint(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value))
):
    """Create a new customer"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
        
        customer = create_customer(db, customer_data.dict(), tenant_context["tenant_id"])
        
        try:
            from ...services.notification_service import create_crm_notification_for_all_tenant_users
            from ...config.notification_models import NotificationType
            
            user_name = f"{current_user.firstName} {current_user.lastName}".strip() if hasattr(current_user, 'firstName') else current_user.userName if hasattr(current_user, 'userName') else "A user"
            
            create_crm_notification_for_all_tenant_users(
                db,
                str(tenant_context["tenant_id"]),
                "New Customer Created",
                f"{user_name} created a new customer: {customer_data.name}",
                NotificationType.INFO,
                f"/crm/customers/{str(customer.id)}",
                {"customer_id": str(customer.id), "created_by": str(current_user.id)}
            )
        except Exception as notification_error:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create notification: {notification_error}", exc_info=True)
        
        return CustomerResponse.from_orm(customer)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create customer: {str(e)}")

@router.get("/customers", response_model=List[CustomerResponse])
async def get_customers_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    customer_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Get customers with optional filtering and search"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    customers = get_customers(
        db, 
        tenant_context["tenant_id"], 
        skip, 
        limit, 
        search, 
        status, 
        customer_type
    )
    return [CustomerResponse.from_orm(customer) for customer in customers]

@router.get("/customers/stats", response_model=CustomerStatsResponse)
async def get_customer_stats_endpoint(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Get customer statistics"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    stats = get_customer_stats(db, tenant_context["tenant_id"])
    return CustomerStatsResponse(**stats)

@router.get("/customers/search", response_model=List[CustomerResponse])
async def search_customers_endpoint(
    q: str = Query(..., min_length=1, description="Search term"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Search customers by name, ID, CNIC, phone, or email"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    customers = search_customers(db, tenant_context["tenant_id"], q, limit)
    return [CustomerResponse.from_orm(customer) for customer in customers]

@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer_endpoint(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Get customer by ID"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    customer = get_customer_by_id(db, customer_id, tenant_context["tenant_id"])
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerResponse.from_orm(customer)

@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer_endpoint(
    customer_id: str,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value))
):
    """Update customer"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    customer = update_customer(db, customer_id, customer_data.dict(exclude_unset=True), tenant_context["tenant_id"])
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    try:
        from ...services.notification_service import create_crm_notification_for_all_tenant_users
        from ...config.notification_models import NotificationType
        
        user_name = f"{current_user.firstName} {current_user.lastName}".strip() if hasattr(current_user, 'firstName') else current_user.userName if hasattr(current_user, 'userName') else "A user"
        
        create_crm_notification_for_all_tenant_users(
            db,
            str(tenant_context["tenant_id"]),
            "Customer Updated",
            f"{user_name} updated customer: {customer.name}",
            NotificationType.INFO,
            f"/crm/customers/{customer_id}",
            {"customer_id": customer_id, "updated_by": str(current_user.id)}
        )
    except Exception as notification_error:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to create notification: {notification_error}", exc_info=True)
    
    return CustomerResponse.from_orm(customer)

@router.delete("/customers/{customer_id}")
async def delete_customer_endpoint(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value))
):
    """Delete customer"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    success = delete_customer(db, customer_id, tenant_context["tenant_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}


@router.patch("/customers/{customer_id}/photo", response_model=CustomerResponse)
async def upload_customer_photo(
    customer_id: str,
    body: CustomerPhotoUpload,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    customer = get_customer_by_id(db, customer_id, str(tenant_context["tenant_id"]))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    try:
        url = process_customer_photo_upload(body.image, tenant_context["tenant_id"], customer_id)
        if url:
            customer = update_customer(db, customer_id, {"image_url": url}, str(tenant_context["tenant_id"]))
        return CustomerResponse.from_orm(customer)
    except HTTPException:
        raise


@router.delete("/customers/{customer_id}/photo", response_model=CustomerResponse)
async def delete_customer_photo(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    customer = get_customer_by_id(db, customer_id, str(tenant_context["tenant_id"]))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if customer.image_url and (customer.image_url.startswith("http://") or customer.image_url.startswith("https://")):
        try:
            s3_key = s3_service.extract_s3_key_from_url(customer.image_url)
            if s3_key:
                s3_service.delete_file(s3_key)
        except Exception as e:
            logger.warning(f"Failed to delete customer photo from S3: {e}")
    customer = update_customer(db, customer_id, {"image_url": None}, str(tenant_context["tenant_id"]))
    return CustomerResponse.from_orm(customer)


@router.get("/customers/{customer_id}/guarantors", response_model=List[GuarantorResponse])
async def get_customer_guarantors(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    guarantors = get_guarantors_by_customer(db, customer_id, str(tenant_context["tenant_id"]))
    return [GuarantorResponse.model_validate(g) for g in guarantors]


@router.post("/customers/{customer_id}/guarantors", response_model=GuarantorResponse)
async def create_guarantor_endpoint(
    customer_id: str,
    data: GuarantorCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        guarantor = create_guarantor(db, customer_id, data.model_dump(), str(tenant_context["tenant_id"]))
        return GuarantorResponse.model_validate(guarantor)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/guarantors/{guarantor_id}", response_model=GuarantorResponse)
async def update_guarantor_endpoint(
    guarantor_id: str,
    data: GuarantorUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    guarantor = update_guarantor(db, guarantor_id, data.model_dump(exclude_unset=True), str(tenant_context["tenant_id"]))
    if not guarantor:
        raise HTTPException(status_code=404, detail="Guarantor not found")
    return GuarantorResponse.model_validate(guarantor)


@router.delete("/guarantors/{guarantor_id}")
async def delete_guarantor_endpoint(
    guarantor_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    success = delete_guarantor(db, guarantor_id, str(tenant_context["tenant_id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Guarantor not found")
    return {"message": "Guarantor deleted successfully"}


# Lead endpoints
@router.get("/leads", response_model=CRMLeadsResponse)
async def get_crm_leads(
    status: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Get all leads with optional filtering"""
    try:
        skip = (page - 1) * limit
        leads = get_leads(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if status or source or assigned_to or search:
            filtered_leads = []
            for lead in leads:
                if status and lead.status != status:
                    continue
                if source and lead.source != source:
                    continue
                if assigned_to and lead.assignedTo != assigned_to:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in (lead.firstName or "").lower(),
                        search_lower in (lead.lastName or "").lower(),
                        search_lower in (lead.email or "").lower(),
                        search_lower in (lead.company or "").lower()
                    ]):
                        continue
                filtered_leads.append(lead)
            leads = filtered_leads
        
        # Get total count for pagination
        total = len(leads)
        
        return CRMLeadsResponse(
            leads=leads,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leads: {str(e)}")

@router.post("/leads", response_model=Lead)
async def create_crm_lead(
    lead_data: LeadCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value))
):
    """Create a new lead"""
    try:
        lead = Lead(
            id=str(uuid.uuid4()),
            **lead_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(lead)
        db.commit()
        db.refresh(lead)
        
        try:
            from ...services.notification_service import create_crm_notification_for_all_tenant_users
            from ...config.notification_models import NotificationType
            
            user_name = f"{current_user.firstName} {current_user.lastName}".strip() if hasattr(current_user, 'firstName') else current_user.userName if hasattr(current_user, 'userName') else "A user"
            
            create_crm_notification_for_all_tenant_users(
                db,
                str(tenant_context["tenant_id"]) if tenant_context else str(uuid.uuid4()),
                "New Lead Created",
                f"{user_name} created a new lead: {lead_data.name}",
                NotificationType.INFO,
                f"/crm/leads/{str(lead.id)}",
                {"lead_id": str(lead.id), "created_by": str(current_user.id)}
            )
        except Exception as notification_error:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create notification: {notification_error}", exc_info=True)
        
        return lead
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating lead: {str(e)}")

@router.get("/leads/{lead_id}", response_model=Lead)
async def get_crm_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Get a specific lead by ID"""
    try:
        lead = get_lead_by_id(lead_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        return lead
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching lead: {str(e)}")

@router.put("/leads/{lead_id}", response_model=Lead)
async def update_crm_lead(
    lead_id: str,
    lead_data: LeadUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value))
):
    """Update a lead"""
    try:
        lead = get_lead_by_id(lead_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        update_data = lead_data.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.now()
        
        updated_lead = update_lead(lead_id, update_data, db, tenant_context["tenant_id"] if tenant_context else None)
        
        try:
            from ...services.notification_service import create_crm_notification_for_all_tenant_users
            from ...config.notification_models import NotificationType
            
            user_name = f"{current_user.firstName} {current_user.lastName}".strip() if hasattr(current_user, 'firstName') else current_user.userName if hasattr(current_user, 'userName') else "A user"
            
            create_crm_notification_for_all_tenant_users(
                db,
                str(tenant_context["tenant_id"]) if tenant_context else str(uuid.uuid4()),
                "Lead Updated",
                f"{user_name} updated lead: {updated_lead.name}",
                NotificationType.INFO,
                f"/crm/leads/{lead_id}",
                {"lead_id": lead_id, "updated_by": str(current_user.id)}
            )
        except Exception as notification_error:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create notification: {notification_error}", exc_info=True)
        
        return updated_lead
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating lead: {str(e)}")

@router.delete("/leads/{lead_id}")
async def delete_crm_lead(
    lead_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value))
):
    """Delete a lead"""
    try:
        success = delete_lead(lead_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not success:
            raise HTTPException(status_code=404, detail="Lead not found")
        return {"message": "Lead deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting lead: {str(e)}")

# Contact endpoints
@router.get("/contacts", response_model=CRMContactsResponse)
async def get_crm_contacts(
    type: Optional[str] = Query(None),
    company_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Get all contacts with optional filtering"""
    try:
        skip = (page - 1) * limit
        contacts = get_contacts(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if type or company_id or search:
            filtered_contacts = []
            for contact in contacts:
                if type and contact.type != type:
                    continue
                if company_id and contact.companyId != company_id:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in (contact.firstName or "").lower(),
                        search_lower in (contact.lastName or "").lower(),
                        search_lower in (contact.email or "").lower(),
                        search_lower in (contact.jobTitle or "").lower()
                    ]):
                        continue
                filtered_contacts.append(contact)
            contacts = filtered_contacts
        
        total = len(contacts)
        
        return CRMContactsResponse(
            contacts=contacts,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contacts: {str(e)}")

@router.post("/contacts", response_model=Contact)
async def create_crm_contact(
    contact_data: ContactCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value))
):
    """Create a new contact"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
        
        contact = Contact(
            id=str(uuid.uuid4()),
            **contact_data.dict(),
            tenant_id=tenant_context["tenant_id"],
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(contact)
        db.commit()
        db.refresh(contact)
        
        try:
            from ...services.notification_service import create_crm_notification_for_all_tenant_users
            from ...config.notification_models import NotificationType
            
            user_name = f"{current_user.firstName} {current_user.lastName}".strip() if hasattr(current_user, 'firstName') else current_user.userName if hasattr(current_user, 'userName') else "A user"
            
            create_crm_notification_for_all_tenant_users(
                db,
                str(tenant_context["tenant_id"]),
                "New Contact Created",
                f"{user_name} created a new contact: {contact_data.name}",
                NotificationType.INFO,
                f"/crm/contacts/{str(contact.id)}",
                {"contact_id": str(contact.id), "created_by": str(current_user.id)}
            )
        except Exception as notification_error:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create notification: {notification_error}", exc_info=True)
        
        return contact
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating contact: {str(e)}")

@router.get("/contacts/{contact_id}", response_model=Contact)
async def get_crm_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Get a specific contact by ID"""
    try:
        contact = get_contact_by_id(contact_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        return contact
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contact: {str(e)}")

@router.put("/contacts/{contact_id}", response_model=Contact)
async def update_crm_contact(
    contact_id: str,
    contact_data: ContactUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value))
):
    """Update a contact"""
    try:
        contact = get_contact_by_id(contact_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        update_data = contact_data.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.now()
        
        updated_contact = update_contact(contact_id, update_data, db, tenant_context["tenant_id"] if tenant_context else None)
        
        try:
            from ...services.notification_service import create_crm_notification_for_all_tenant_users
            from ...config.notification_models import NotificationType
            
            user_name = f"{current_user.firstName} {current_user.lastName}".strip() if hasattr(current_user, 'firstName') else current_user.userName if hasattr(current_user, 'userName') else "A user"
            
            create_crm_notification_for_all_tenant_users(
                db,
                str(tenant_context["tenant_id"]) if tenant_context else str(uuid.uuid4()),
                "Contact Updated",
                f"{user_name} updated contact: {updated_contact.name}",
                NotificationType.INFO,
                f"/crm/contacts/{contact_id}",
                {"contact_id": contact_id, "updated_by": str(current_user.id)}
            )
        except Exception as notification_error:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create notification: {notification_error}", exc_info=True)
        
        return updated_contact
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating contact: {str(e)}")

@router.delete("/contacts/{contact_id}")
async def delete_crm_contact(
    contact_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value))
):
    """Delete a contact"""
    try:
        success = delete_contact(contact_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not success:
            raise HTTPException(status_code=404, detail="Contact not found")
        return {"message": "Contact deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting contact: {str(e)}")

# Company endpoints
@router.get("/companies", response_model=CRMCompaniesResponse)
async def get_crm_companies(
    industry: Optional[str] = Query(None),
    size: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Get all companies with optional filtering"""
    try:
        skip = (page - 1) * limit
        companies = get_companies(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if industry or size or search:
            filtered_companies = []
            for company in companies:
                if industry and company.industry != industry:
                    continue
                if size and company.size != size:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in (company.name or "").lower(),
                        search_lower in (company.industry or "").lower(),
                        search_lower in (company.city or "").lower()
                    ]):
                        continue
                filtered_companies.append(company)
            companies = filtered_companies
        
        total = len(companies)
        
        return CRMCompaniesResponse(
            companies=companies,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching companies: {str(e)}")

@router.post("/companies", response_model=Company)
async def create_crm_company(
    company_data: CompanyCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value))
):
    """Create a new company"""
    try:
        company = Company(
            id=str(uuid.uuid4()),
            **company_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(company)
        db.commit()
        db.refresh(company)
        
        return company
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating company: {str(e)}")

@router.get("/companies/{company_id}", response_model=Company)
async def get_crm_company(
    company_id: str,
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Get a specific company by ID"""
    try:
        company = get_company_by_id(company_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        return company
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching company: {str(e)}")

@router.put("/companies/{company_id}", response_model=Company)
async def update_crm_company(
    company_id: str,
    company_data: CompanyUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value))
):
    """Update a company"""
    try:
        company = get_company_by_id(company_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        update_data = company_data.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.now()
        
        updated_company = update_company(company_id, update_data, db, tenant_context["tenant_id"] if tenant_context else None)
        return updated_company
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating company: {str(e)}")

@router.delete("/companies/{company_id}")
async def delete_crm_company(
    company_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value))
):
    """Delete a company"""
    try:
        success = delete_company(company_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not success:
            raise HTTPException(status_code=404, detail="Company not found")
        return {"message": "Company deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting company: {str(e)}")

# Opportunity endpoints
@router.get("/opportunities", response_model=CRMOpportunitiesResponse)
async def get_crm_opportunities(
    stage: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Get all opportunities with optional filtering"""
    try:
        skip = (page - 1) * limit
        opportunities = get_opportunities(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if stage or assigned_to or search:
            filtered_opportunities = []
            for opportunity in opportunities:
                if stage and opportunity.stage != stage:
                    continue
                if assigned_to and opportunity.assignedTo != assigned_to:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in (opportunity.title or "").lower(),
                        search_lower in (opportunity.description or "").lower()
                    ]):
                        continue
                filtered_opportunities.append(opportunity)
            opportunities = filtered_opportunities
        
        total = len(opportunities)
        
        return CRMOpportunitiesResponse(
            opportunities=opportunities,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching opportunities: {str(e)}")

@router.post("/opportunities", response_model=OpportunityPydantic)
async def create_crm_opportunity(
    opportunity_data: OpportunityCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value))
):
    """Create a new opportunity"""
    try:
        data = opportunity_data.dict()
        
        if not data.get('companyId'):
            raise HTTPException(status_code=400, detail="companyId is required to create an opportunity")
        
        expected_close_date = None
        if data.get('expectedCloseDate'):
            try:
                expected_close_date = datetime.fromisoformat(data['expectedCloseDate'].replace('Z', '+00:00'))
            except:
                try:
                    expected_close_date = datetime.strptime(data['expectedCloseDate'], '%Y-%m-%d')
                except:
                    pass
        
        opportunity = Opportunity(
            id=uuid.uuid4(),
            name=data.get('title', ''),
            description=data.get('description'),
            stage=data.get('stage', 'prospecting'),
            amount=data.get('amount'),
            probability=data.get('probability', 50),
            expectedCloseDate=expected_close_date,
            companyId=uuid.UUID(data['companyId']),
            contactId=uuid.UUID(data['contactId']) if data.get('contactId') else None,
            assignedToId=uuid.UUID(data['assignedTo']) if data.get('assignedTo') else None,
            notes=data.get('notes'),
            tenant_id=uuid.UUID(tenant_context["tenant_id"]) if tenant_context else uuid.uuid4(),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(opportunity)
        db.commit()
        db.refresh(opportunity)
        
        return OpportunityPydantic.model_validate(opportunity)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating opportunity: {str(e)}")

@router.get("/opportunities/{opportunity_id}", response_model=OpportunityPydantic)
async def get_crm_opportunity(
    opportunity_id: str,
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Get a specific opportunity by ID"""
    try:
        opportunity = get_opportunity_by_id(opportunity_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        return OpportunityPydantic.model_validate(opportunity)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching opportunity: {str(e)}")

@router.put("/opportunities/{opportunity_id}", response_model=OpportunityPydantic)
async def update_crm_opportunity(
    opportunity_id: str,
    opportunity_data: OpportunityUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value))
):
    """Update an opportunity"""
    try:
        opportunity = get_opportunity_by_id(opportunity_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        
        data = opportunity_data.dict(exclude_unset=True)
        
        if 'title' in data:
            opportunity.name = data['title']
        if 'description' in data:
            opportunity.description = data['description']
        if 'stage' in data:
            opportunity.stage = data['stage']
        if 'amount' in data:
            opportunity.amount = data['amount']
        if 'probability' in data:
            opportunity.probability = data['probability']
        if 'expectedCloseDate' in data and data['expectedCloseDate']:
            try:
                opportunity.expectedCloseDate = datetime.fromisoformat(data['expectedCloseDate'].replace('Z', '+00:00'))
            except:
                try:
                    opportunity.expectedCloseDate = datetime.strptime(data['expectedCloseDate'], '%Y-%m-%d')
                except:
                    pass
        if 'companyId' in data and data['companyId']:
            opportunity.companyId = uuid.UUID(data['companyId'])
        if 'contactId' in data and data['contactId']:
            opportunity.contactId = uuid.UUID(data['contactId'])
        if 'assignedTo' in data and data['assignedTo']:
            opportunity.assignedToId = uuid.UUID(data['assignedTo'])
        if 'notes' in data:
            opportunity.notes = data['notes']
        
        opportunity.updatedAt = datetime.now()
        db.commit()
        db.refresh(opportunity)
        
        return OpportunityPydantic.model_validate(opportunity)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating opportunity: {str(e)}")

@router.delete("/opportunities/{opportunity_id}")
async def delete_crm_opportunity(
    opportunity_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value))
):
    """Delete an opportunity"""
    try:
        success = delete_opportunity(opportunity_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not success:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        return {"message": "Opportunity deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting opportunity: {str(e)}")

# Sales Activity endpoints
@router.get("/activities", response_model=CRMActivitiesResponse)
async def get_crm_activities(
    type: Optional[str] = Query(None),
    completed: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Get all sales activities with optional filtering"""
    try:
        skip = (page - 1) * limit
        activities = get_sales_activities(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if type or completed is not None or search:
            filtered_activities = []
            for activity in activities:
                if type and activity.type != type:
                    continue
                if completed is not None and activity.completed != completed:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in (activity.subject or "").lower(),
                        search_lower in (activity.description or "").lower()
                    ]):
                        continue
                filtered_activities.append(activity)
            activities = filtered_activities
        
        total = len(activities)
        
        return CRMActivitiesResponse(
            activities=activities,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activities: {str(e)}")

@router.post("/activities", response_model=SalesActivity)
async def create_crm_activity(
    activity_data: SalesActivityCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value))
):
    """Create a new sales activity"""
    try:
        activity = SalesActivity(
            id=str(uuid.uuid4()),
            **activity_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(activity)
        db.commit()
        db.refresh(activity)
        
        return activity
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating activity: {str(e)}")

@router.get("/activities/{activity_id}", response_model=SalesActivity)
async def get_crm_activity(
    activity_id: str,
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Get a specific sales activity by ID"""
    try:
        activity = get_sales_activity_by_id(activity_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        return activity
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activity: {str(e)}")

@router.put("/activities/{activity_id}", response_model=SalesActivity)
async def update_crm_activity(
    activity_id: str,
    activity_data: SalesActivityUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value))
):
    """Update a sales activity"""
    try:
        activity = get_sales_activity_by_id(activity_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        update_data = activity_data.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.now()
        
        # If marking as completed, set completedAt
        if update_data.get("completed") and not activity.completed:
            update_data["completedAt"] = datetime.now()
        
        updated_activity = update_sales_activity(activity_id, update_data, db, tenant_context["tenant_id"] if tenant_context else None)
        return updated_activity
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating activity: {str(e)}")

@router.delete("/activities/{activity_id}")
async def delete_crm_activity(
    activity_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value))
):
    """Delete a sales activity"""
    try:
        success = delete_sales_activity(activity_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not success:
            raise HTTPException(status_code=404, detail="Activity not found")
        return {"message": "Activity deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting activity: {str(e)}")

# Dashboard endpoint
@router.get("/dashboard", response_model=CRMDashboard)
async def get_crm_dashboard(
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    """Get CRM dashboard data and metrics"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
        
        # Get dashboard metrics
        metrics_data = get_crm_dashboard_data(db, tenant_context["tenant_id"])
        
        # Get recent activities
        recent_activities = get_sales_activities(db, tenant_context["tenant_id"], 0, 10)
        
        # Get top opportunities
        opportunities = get_opportunities(db, tenant_context["tenant_id"], 0, 10)
        top_opportunities = sorted(opportunities, key=lambda x: x.amount or 0, reverse=True)[:5]
        
        # Get recent leads
        recent_leads = get_leads(db, tenant_context["tenant_id"], 0, 10)
        
        # Create pipeline data
        pipeline_stages = ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"]
        pipeline_data = []
        
        for stage in pipeline_stages:
            stage_opportunities = [o for o in opportunities if o.stage == stage]
            count = len(stage_opportunities)
            value = sum(o.amount or 0 for o in stage_opportunities)
            probability = 50  # Default probability, can be enhanced later
            
            pipeline_data.append(CRMPipeline(
                stage=stage,
                count=count,
                value=value,
                probability=probability
            ))
        
        # Create dashboard response
        dashboard = CRMDashboard(
            metrics=CRMMetrics(**metrics_data),
            pipeline=pipeline_data,
            recentActivities=recent_activities,
            topOpportunities=top_opportunities,
            recentLeads=recent_leads
        )
        
        return dashboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard data: {str(e)}")

# Convert lead to contact
@router.post("/leads/{lead_id}/convert")
async def convert_lead_to_contact(
    lead_id: str,
    contact_data: ContactCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value))
):
    """Convert a lead to a contact"""
    try:
        # Get the lead
        lead = get_lead_by_id(lead_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Create contact
        contact = Contact(
            id=str(uuid.uuid4()),
            **contact_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(contact)
        
        # Update lead status
        lead.status = "converted"
        lead.convertedToContact = contact.id
        lead.updatedAt = datetime.now()
        
        db.commit()
        db.refresh(contact)
        
        return {"message": "Lead converted successfully", "contact": contact}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error converting lead: {str(e)}")
