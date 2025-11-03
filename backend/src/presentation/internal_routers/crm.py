from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import json
import uuid
from datetime import datetime, timedelta

from ...models.crm import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerStatsResponse
)
from ...models.unified_models import (
    Lead, LeadCreate, LeadUpdate,
    Contact, ContactCreate, ContactUpdate,
    Company, CompanyCreate, CompanyUpdate,
    Opportunity, OpportunityCreate, OpportunityUpdate,
    SalesActivity, SalesActivityCreate, SalesActivityUpdate,
    CRMLeadsResponse, CRMContactsResponse, CRMCompaniesResponse,
    CRMOpportunitiesResponse, CRMActivitiesResponse,
    CRMDashboard, CRMMetrics, CRMPipeline
)
from ...config.database import get_db
from ...config.crm_crud import (
    create_lead, get_lead_by_id, get_leads, update_lead, delete_lead,
    create_contact, get_contact_by_id, get_contacts, update_contact, delete_contact,
    create_company, get_company_by_id, get_companies, update_company, delete_company,
    create_opportunity, get_opportunity_by_id, get_opportunities, update_opportunity, delete_opportunity,
    create_customer, get_customer_by_id, get_customers, update_customer, delete_customer,
    get_customer_stats, search_customers
)
from ...presentation.dependencies.auth import get_current_user, get_tenant_context
from ...presentation.dependencies.mediator import get_mediator
from ...core.mediator import Mediator
from ...core.result import Result
from ...application.commands import (
    CreateCustomerCommand, UpdateCustomerCommand, DeleteCustomerCommand,
    CreateLeadCommand, UpdateLeadCommand, DeleteLeadCommand,
    CreateContactCommand, UpdateContactCommand, DeleteContactCommand,
    CreateCompanyCommand, UpdateCompanyCommand, DeleteCompanyCommand,
    CreateOpportunityCommand, UpdateOpportunityCommand, DeleteOpportunityCommand,
    CreateSalesActivityCommand, UpdateSalesActivityCommand, DeleteSalesActivityCommand
)
from ...application.queries import (
    GetCustomerByIdQuery, GetAllCustomersQuery,
    GetLeadByIdQuery, GetAllLeadsQuery,
    GetContactByIdQuery, GetAllContactsQuery,
    GetCompanyByIdQuery, GetAllCompaniesQuery,
    GetOpportunityByIdQuery, GetAllOpportunitiesQuery,
    GetSalesActivityByIdQuery, GetAllSalesActivitiesQuery
)


router = APIRouter(prefix="/crm", tags=["crm"])

# Customer endpoints
@router.post("/customers", response_model=CustomerResponse)
async def create_customer_endpoint(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Create a new customer"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    customer_dict = customer_data.dict()
    command = CreateCustomerCommand(
        tenant_id=tenant_context["tenant_id"],
        firstName=customer_dict.get('firstName', ''),
        lastName=customer_dict.get('lastName', ''),
        email=customer_dict.get('email', ''),
        phone=customer_dict.get('phone'),
        mobile=customer_dict.get('mobile'),
        cnic=customer_dict.get('cnic'),
        dateOfBirth=customer_dict.get('dateOfBirth'),
        gender=customer_dict.get('gender'),
        address=customer_dict.get('address'),
        city=customer_dict.get('city'),
        state=customer_dict.get('state'),
        country=customer_dict.get('country', 'Pakistan'),
        postalCode=customer_dict.get('postalCode'),
        customerType=customer_dict.get('customerType', 'individual'),
        customerStatus=customer_dict.get('customerStatus', 'active'),
        creditLimit=customer_dict.get('creditLimit', 0.0),
        currentBalance=customer_dict.get('currentBalance', 0.0),
        paymentTerms=customer_dict.get('paymentTerms', 'Cash'),
        assignedToId=customer_dict.get('assignedToId'),
        notes=customer_dict.get('notes'),
        tags=customer_dict.get('tags', [])
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=400, detail=result.error_message)
    
    customer_entity = result.value
    customer_db = get_customer_by_id(db, str(customer_entity.id), tenant_context["tenant_id"]) if hasattr(customer_entity, 'id') else None
    
    if customer_db:
        return CustomerResponse.from_orm(customer_db)
    else:
        raise HTTPException(status_code=500, detail="Failed to retrieve created customer")

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
    mediator: Mediator = Depends(get_mediator)
):
    """Get customers with optional filtering and search"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    page = (skip // limit) + 1 if limit > 0 else 1
    query = GetAllCustomersQuery(
        page=page,
        page_size=limit,
        tenant_id=tenant_context["tenant_id"],
        search=search,
        status=status,
        customer_type=customer_type
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    customers_data = result.value
    customers = customers_data.get("items", []) if isinstance(customers_data, dict) else customers_data if isinstance(customers_data, list) else []
    
    customer_list = []
    for customer_entity in customers:
        if hasattr(customer_entity, 'id'):
            customer_db = get_customer_by_id(db, str(customer_entity.id), tenant_context["tenant_id"])
            if customer_db:
                customer_list.append(CustomerResponse.from_orm(customer_db))
        else:
            customer_list.append(CustomerResponse.from_orm(customer_entity))
    
    return customer_list

@router.get("/customers/stats", response_model=CustomerStatsResponse)
async def get_customer_stats_endpoint(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
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
    tenant_context: Optional[dict] = Depends(get_tenant_context)
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
    mediator: Mediator = Depends(get_mediator)
):
    """Get customer by ID"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    query = GetCustomerByIdQuery(
        customer_id=customer_id,
        tenant_id=tenant_context["tenant_id"]
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    customer_entity = result.value
    if not customer_entity:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer_db = get_customer_by_id(db, customer_id, tenant_context["tenant_id"])
    if customer_db:
        return CustomerResponse.from_orm(customer_db)
    else:
        raise HTTPException(status_code=404, detail="Customer not found")

@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer_endpoint(
    customer_id: str,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Update customer"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    update_dict = customer_data.dict(exclude_unset=True)
    command = UpdateCustomerCommand(
        customer_id=customer_id,
        tenant_id=tenant_context["tenant_id"],
        firstName=update_dict.get('firstName'),
        lastName=update_dict.get('lastName'),
        email=update_dict.get('email'),
        phone=update_dict.get('phone'),
        mobile=update_dict.get('mobile'),
        cnic=update_dict.get('cnic'),
        dateOfBirth=update_dict.get('dateOfBirth'),
        gender=update_dict.get('gender'),
        address=update_dict.get('address'),
        city=update_dict.get('city'),
        state=update_dict.get('state'),
        country=update_dict.get('country'),
        postalCode=update_dict.get('postalCode'),
        customerType=update_dict.get('customerType'),
        customerStatus=update_dict.get('customerStatus'),
        creditLimit=update_dict.get('creditLimit'),
        currentBalance=update_dict.get('currentBalance'),
        paymentTerms=update_dict.get('paymentTerms'),
        assignedToId=update_dict.get('assignedToId'),
        notes=update_dict.get('notes'),
        tags=update_dict.get('tags')
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    customer_entity = result.value
    customer_db = get_customer_by_id(db, customer_id, tenant_context["tenant_id"])
    if customer_db:
        return CustomerResponse.from_orm(customer_db)
    else:
        raise HTTPException(status_code=404, detail="Customer not found")

@router.delete("/customers/{customer_id}")
async def delete_customer_endpoint(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Delete customer"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    command = DeleteCustomerCommand(
        customer_id=customer_id,
        tenant_id=tenant_context["tenant_id"]
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    return {"message": "Customer deleted successfully"}

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
    mediator: Mediator = Depends(get_mediator)
):
    """Get all leads with optional filtering"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    query = GetAllLeadsQuery(
        page=page,
        page_size=limit,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    leads_data = result.value
    leads = leads_data.get("items", []) if isinstance(leads_data, dict) else leads_data if isinstance(leads_data, list) else []
    
    if status or source or assigned_to or search:
        filtered_leads = []
        for lead in leads:
            if status and getattr(lead, 'status', None) != status:
                continue
            if source and getattr(lead, 'source', None) != source:
                continue
            if assigned_to and getattr(lead, 'assignedTo', None) != assigned_to:
                continue
            if search:
                search_lower = search.lower()
                if not any([
                    search_lower in (getattr(lead, 'firstName', "") or "").lower(),
                    search_lower in (getattr(lead, 'lastName', "") or "").lower(),
                    search_lower in (getattr(lead, 'email', "") or "").lower(),
                    search_lower in (getattr(lead, 'company', "") or "").lower()
                ]):
                    continue
            filtered_leads.append(lead)
        leads = filtered_leads
    
    total = len(leads) if (status or source or assigned_to or search) else (leads_data.get("total", len(leads)) if isinstance(leads_data, dict) else len(leads))
    
    return CRMLeadsResponse(
        leads=[lead if isinstance(lead, Lead) else Lead(**lead.__dict__ if hasattr(lead, '__dict__') else lead) for lead in leads],
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    )

@router.post("/leads", response_model=Lead)
async def create_crm_lead(
    lead_data: LeadCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Create a new lead"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    lead_dict = lead_data.dict()
    
    command = CreateLeadCommand(
        tenant_id=tenant_id or "",
        firstName=lead_dict.get('firstName', ''),
        lastName=lead_dict.get('lastName', ''),
        email=lead_dict.get('email', ''),
        phone=lead_dict.get('phone'),
        company=lead_dict.get('company'),
        leadSource=lead_dict.get('source', 'manual'),
        status=lead_dict.get('status', 'new'),
        assignedToId=lead_dict.get('assignedTo'),
        notes=lead_dict.get('notes')
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=400, detail=result.error_message)
    
    lead_entity = result.value
    lead_db = get_lead_by_id(str(lead_entity.id), db, tenant_id) if hasattr(lead_entity, 'id') else None
    
    if lead_db:
        return Lead.from_orm(lead_db) if hasattr(Lead, 'from_orm') else Lead(**lead_db.__dict__)
    else:
        raise HTTPException(status_code=500, detail="Failed to retrieve created lead")

@router.get("/leads/{lead_id}", response_model=Lead)
async def get_crm_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Get a specific lead by ID"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    query = GetLeadByIdQuery(
        lead_id=lead_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    lead_entity = result.value
    if not lead_entity:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead_db = get_lead_by_id(lead_id, db, tenant_id)
    if lead_db:
        return Lead.from_orm(lead_db) if hasattr(Lead, 'from_orm') else Lead(**lead_db.__dict__)
    else:
        raise HTTPException(status_code=404, detail="Lead not found")

@router.put("/leads/{lead_id}", response_model=Lead)
async def update_crm_lead(
    lead_id: str,
    lead_data: LeadUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Update a lead"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    update_dict = lead_data.dict(exclude_unset=True)
    
    command = UpdateLeadCommand(
        lead_id=lead_id,
        tenant_id=tenant_id,
        firstName=update_dict.get('firstName'),
        lastName=update_dict.get('lastName'),
        email=update_dict.get('email'),
        phone=update_dict.get('phone'),
        company=update_dict.get('company'),
        leadSource=update_dict.get('source'),
        status=update_dict.get('status'),
        assignedToId=update_dict.get('assignedTo'),
        notes=update_dict.get('notes')
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    lead_entity = result.value
    lead_db = get_lead_by_id(lead_id, db, tenant_id)
    if lead_db:
        return Lead.from_orm(lead_db) if hasattr(Lead, 'from_orm') else Lead(**lead_db.__dict__)
    else:
        raise HTTPException(status_code=404, detail="Lead not found")

@router.delete("/leads/{lead_id}")
async def delete_crm_lead(
    lead_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Delete a lead"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    command = DeleteLeadCommand(
        lead_id=lead_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    return {"message": "Lead deleted successfully"}

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
    mediator: Mediator = Depends(get_mediator)
):
    """Get all contacts with optional filtering"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    query = GetAllContactsQuery(
        page=page,
        page_size=limit,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    contacts_data = result.value
    contacts = contacts_data.get("items", []) if isinstance(contacts_data, dict) else contacts_data if isinstance(contacts_data, list) else []
    
    if type or company_id or search:
        filtered_contacts = []
        for contact in contacts:
            if type and getattr(contact, 'type', None) != type:
                continue
            if company_id and getattr(contact, 'companyId', None) != company_id:
                continue
            if search:
                search_lower = search.lower()
                if not any([
                    search_lower in (getattr(contact, 'firstName', "") or "").lower(),
                    search_lower in (getattr(contact, 'lastName', "") or "").lower(),
                    search_lower in (getattr(contact, 'email', "") or "").lower(),
                    search_lower in (getattr(contact, 'jobTitle', "") or "").lower()
                ]):
                    continue
            filtered_contacts.append(contact)
        contacts = filtered_contacts
    
    total = len(contacts) if (type or company_id or search) else (contacts_data.get("total", len(contacts)) if isinstance(contacts_data, dict) else len(contacts))
    
    return CRMContactsResponse(
        contacts=[contact if isinstance(contact, Contact) else Contact(**contact.__dict__ if hasattr(contact, '__dict__') else contact) for contact in contacts],
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    )

@router.post("/contacts", response_model=Contact)
async def create_crm_contact(
    contact_data: ContactCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Create a new contact"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    contact_dict = contact_data.dict()
    command = CreateContactCommand(
        tenant_id=tenant_context["tenant_id"],
        companyId=contact_dict.get('companyId', ''),
        contactSource=contact_dict.get('source', 'manual'),
        department=contact_dict.get('department', ''),
        email=contact_dict.get('email', ''),
        firstName=contact_dict.get('firstName', ''),
        isActive=contact_dict.get('isActive', True),
        jobTitle=contact_dict.get('jobTitle', ''),
        lastName=contact_dict.get('lastName', ''),
        mobile=contact_dict.get('mobile', ''),
        notes=contact_dict.get('notes', ''),
        phone=contact_dict.get('phone', ''),
        created_by=str(current_user.id)
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=400, detail=result.error_message)
    
    contact_entity = result.value
    contact_db = get_contact_by_id(str(contact_entity.id), db, tenant_context["tenant_id"]) if hasattr(contact_entity, 'id') else None
    
    if contact_db:
        return Contact.from_orm(contact_db) if hasattr(Contact, 'from_orm') else Contact(**contact_db.__dict__)
    else:
        raise HTTPException(status_code=500, detail="Failed to retrieve created contact")

@router.get("/contacts/{contact_id}", response_model=Contact)
async def get_crm_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Get a specific contact by ID"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    query = GetContactByIdQuery(
        contact_id=contact_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    contact_entity = result.value
    if not contact_entity:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    contact_db = get_contact_by_id(contact_id, db, tenant_id)
    if contact_db:
        return Contact.from_orm(contact_db) if hasattr(Contact, 'from_orm') else Contact(**contact_db.__dict__)
    else:
        raise HTTPException(status_code=404, detail="Contact not found")

@router.put("/contacts/{contact_id}", response_model=Contact)
async def update_crm_contact(
    contact_id: str,
    contact_data: ContactUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Update a contact"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    update_dict = contact_data.dict(exclude_unset=True)
    
    command = UpdateContactCommand(
        contact_id=contact_id,
        tenant_id=tenant_id,
        companyId=update_dict.get('companyId'),
        contactSource=update_dict.get('source'),
        department=update_dict.get('department'),
        email=update_dict.get('email'),
        firstName=update_dict.get('firstName'),
        isActive=update_dict.get('isActive'),
        jobTitle=update_dict.get('jobTitle'),
        lastName=update_dict.get('lastName'),
        mobile=update_dict.get('mobile'),
        notes=update_dict.get('notes'),
        phone=update_dict.get('phone')
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    contact_entity = result.value
    contact_db = get_contact_by_id(contact_id, db, tenant_id)
    if contact_db:
        return Contact.from_orm(contact_db) if hasattr(Contact, 'from_orm') else Contact(**contact_db.__dict__)
    else:
        raise HTTPException(status_code=404, detail="Contact not found")

@router.delete("/contacts/{contact_id}")
async def delete_crm_contact(
    contact_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Delete a contact"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    command = DeleteContactCommand(
        contact_id=contact_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    return {"message": "Contact deleted successfully"}

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
    mediator: Mediator = Depends(get_mediator)
):
    """Get all companies with optional filtering"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    query = GetAllCompaniesQuery(
        page=page,
        page_size=limit,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    companies_data = result.value
    companies = companies_data.get("items", []) if isinstance(companies_data, dict) else companies_data if isinstance(companies_data, list) else []
    
    if industry or size or search:
        filtered_companies = []
        for company in companies:
            if industry and getattr(company, 'industry', None) != industry:
                continue
            if size and getattr(company, 'size', None) != size:
                continue
            if search:
                search_lower = search.lower()
                if not any([
                    search_lower in (getattr(company, 'name', "") or "").lower(),
                    search_lower in (getattr(company, 'industry', "") or "").lower(),
                    search_lower in (getattr(company, 'city', "") or "").lower()
                ]):
                    continue
            filtered_companies.append(company)
        companies = filtered_companies
    
    total = len(companies) if (industry or size or search) else (companies_data.get("total", len(companies)) if isinstance(companies_data, dict) else len(companies))
    
    return CRMCompaniesResponse(
        companies=[company if isinstance(company, Company) else Company(**company.__dict__ if hasattr(company, '__dict__') else company) for company in companies],
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    )

@router.post("/companies", response_model=Company)
async def create_crm_company(
    company_data: CompanyCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Create a new company"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    company_dict = company_data.dict()
    
    command = CreateCompanyCommand(
        tenant_id=tenant_id or "",
        name=company_dict.get('name', ''),
        address=company_dict.get('address', ''),
        city=company_dict.get('city', ''),
        state=company_dict.get('state', ''),
        country=company_dict.get('country', 'Pakistan'),
        postalCode=company_dict.get('postalCode', ''),
        phone=company_dict.get('phone', ''),
        website=company_dict.get('website', ''),
        industry=company_dict.get('industry', ''),
        employeeCount=company_dict.get('employeeCount', 0),
        annualRevenue=company_dict.get('annualRevenue', 0.0),
        notes=company_dict.get('notes', ''),
        isActive=company_dict.get('isActive', True),
        created_by=str(current_user.id)
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=400, detail=result.error_message)
    
    company_entity = result.value
    company_db = get_company_by_id(str(company_entity.id), db, tenant_id) if hasattr(company_entity, 'id') else None
    
    if company_db:
        return Company.from_orm(company_db) if hasattr(Company, 'from_orm') else Company(**company_db.__dict__)
    else:
        raise HTTPException(status_code=500, detail="Failed to retrieve created company")

@router.get("/companies/{company_id}", response_model=Company)
async def get_crm_company(
    company_id: str,
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Get a specific company by ID"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    query = GetCompanyByIdQuery(
        company_id=company_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    company_entity = result.value
    if not company_entity:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company_db = get_company_by_id(company_id, db, tenant_id)
    if company_db:
        return Company.from_orm(company_db) if hasattr(Company, 'from_orm') else Company(**company_db.__dict__)
    else:
        raise HTTPException(status_code=404, detail="Company not found")

@router.put("/companies/{company_id}", response_model=Company)
async def update_crm_company(
    company_id: str,
    company_data: CompanyUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Update a company"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    update_dict = company_data.dict(exclude_unset=True)
    
    command = UpdateCompanyCommand(
        company_id=company_id,
        tenant_id=tenant_id,
        name=update_dict.get('name'),
        address=update_dict.get('address'),
        city=update_dict.get('city'),
        state=update_dict.get('state'),
        country=update_dict.get('country'),
        postalCode=update_dict.get('postalCode'),
        phone=update_dict.get('phone'),
        website=update_dict.get('website'),
        industry=update_dict.get('industry'),
        employeeCount=update_dict.get('employeeCount'),
        annualRevenue=update_dict.get('annualRevenue'),
        notes=update_dict.get('notes'),
        isActive=update_dict.get('isActive')
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    company_entity = result.value
    company_db = get_company_by_id(company_id, db, tenant_id)
    if company_db:
        return Company.from_orm(company_db) if hasattr(Company, 'from_orm') else Company(**company_db.__dict__)
    else:
        raise HTTPException(status_code=404, detail="Company not found")

@router.delete("/companies/{company_id}")
async def delete_crm_company(
    company_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Delete a company"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    command = DeleteCompanyCommand(
        company_id=company_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    return {"message": "Company deleted successfully"}

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
    mediator: Mediator = Depends(get_mediator)
):
    """Get all opportunities with optional filtering"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    query = GetAllOpportunitiesQuery(
        page=page,
        page_size=limit,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    opportunities_data = result.value
    opportunities = opportunities_data.get("items", []) if isinstance(opportunities_data, dict) else opportunities_data if isinstance(opportunities_data, list) else []
    
    if stage or assigned_to or search:
        filtered_opportunities = []
        for opportunity in opportunities:
            if stage and getattr(opportunity, 'stage', None) != stage:
                continue
            if assigned_to and getattr(opportunity, 'assignedTo', None) != assigned_to:
                continue
            if search:
                search_lower = search.lower()
                if not any([
                    search_lower in (getattr(opportunity, 'title', "") or "").lower(),
                    search_lower in (getattr(opportunity, 'description', "") or "").lower()
                ]):
                    continue
            filtered_opportunities.append(opportunity)
        opportunities = filtered_opportunities
    
    total = len(opportunities) if (stage or assigned_to or search) else (opportunities_data.get("total", len(opportunities)) if isinstance(opportunities_data, dict) else len(opportunities))
    
    return CRMOpportunitiesResponse(
        opportunities=[opp if isinstance(opp, Opportunity) else Opportunity(**opp.__dict__ if hasattr(opp, '__dict__') else opp) for opp in opportunities],
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    )

@router.post("/opportunities", response_model=Opportunity)
async def create_crm_opportunity(
    opportunity_data: OpportunityCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Create a new opportunity"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    opp_dict = opportunity_data.dict()
    
    command = CreateOpportunityCommand(
        tenant_id=tenant_id or "",
        name=opp_dict.get('title', ''),
        description=opp_dict.get('description', ''),
        amount=opp_dict.get('amount', 0.0),
        assignedToId=opp_dict.get('assignedTo', ''),
        companyId=opp_dict.get('companyId', ''),
        contactId=opp_dict.get('contactId', ''),
        expectedCloseDate=opp_dict.get('expectedCloseDate'),
        leadSource=opp_dict.get('source', 'manual'),
        notes=opp_dict.get('notes', ''),
        probability=opp_dict.get('probability', 0),
        stage=opp_dict.get('stage', 'prospecting'),
        created_by=str(current_user.id)
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=400, detail=result.error_message)
    
    opp_entity = result.value
    opp_db = get_opportunity_by_id(str(opp_entity.id), db, tenant_id) if hasattr(opp_entity, 'id') else None
    
    if opp_db:
        return Opportunity.from_orm(opp_db) if hasattr(Opportunity, 'from_orm') else Opportunity(**opp_db.__dict__)
    else:
        raise HTTPException(status_code=500, detail="Failed to retrieve created opportunity")

@router.get("/opportunities/{opportunity_id}", response_model=Opportunity)
async def get_crm_opportunity(
    opportunity_id: str,
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Get a specific opportunity by ID"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    query = GetOpportunityByIdQuery(
        opportunity_id=opportunity_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    opp_entity = result.value
    if not opp_entity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    opp_db = get_opportunity_by_id(opportunity_id, db, tenant_id)
    if opp_db:
        return Opportunity.from_orm(opp_db) if hasattr(Opportunity, 'from_orm') else Opportunity(**opp_db.__dict__)
    else:
        raise HTTPException(status_code=404, detail="Opportunity not found")

@router.put("/opportunities/{opportunity_id}", response_model=Opportunity)
async def update_crm_opportunity(
    opportunity_id: str,
    opportunity_data: OpportunityUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Update an opportunity"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    update_dict = opportunity_data.dict(exclude_unset=True)
    
    command = UpdateOpportunityCommand(
        opportunity_id=opportunity_id,
        tenant_id=tenant_id,
        name=update_dict.get('title'),
        description=update_dict.get('description'),
        amount=update_dict.get('amount'),
        assignedToId=update_dict.get('assignedTo'),
        companyId=update_dict.get('companyId'),
        contactId=update_dict.get('contactId'),
        expectedCloseDate=update_dict.get('expectedCloseDate'),
        leadSource=update_dict.get('source'),
        notes=update_dict.get('notes'),
        probability=update_dict.get('probability'),
        stage=update_dict.get('stage')
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    opp_entity = result.value
    opp_db = get_opportunity_by_id(opportunity_id, db, tenant_id)
    if opp_db:
        return Opportunity.from_orm(opp_db) if hasattr(Opportunity, 'from_orm') else Opportunity(**opp_db.__dict__)
    else:
        raise HTTPException(status_code=404, detail="Opportunity not found")

@router.delete("/opportunities/{opportunity_id}")
async def delete_crm_opportunity(
    opportunity_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Delete an opportunity"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    command = DeleteOpportunityCommand(
        opportunity_id=opportunity_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    return {"message": "Opportunity deleted successfully"}

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
    mediator: Mediator = Depends(get_mediator)
):
    """Get all sales activities with optional filtering"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    query = GetAllSalesActivitiesQuery(
        page=page,
        page_size=limit,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    activities_data = result.value
    activities = activities_data.get("items", []) if isinstance(activities_data, dict) else activities_data if isinstance(activities_data, list) else []
    
    if type or completed is not None or search:
        filtered_activities = []
        for activity in activities:
            if type and getattr(activity, 'type', None) != type:
                continue
            if completed is not None and getattr(activity, 'completed', None) != completed:
                continue
            if search:
                search_lower = search.lower()
                if not any([
                    search_lower in (getattr(activity, 'subject', "") or "").lower(),
                    search_lower in (getattr(activity, 'description', "") or "").lower()
                ]):
                    continue
            filtered_activities.append(activity)
        activities = filtered_activities
    
    total = len(activities) if (type or completed is not None or search) else (activities_data.get("total", len(activities)) if isinstance(activities_data, dict) else len(activities))
    
    return CRMActivitiesResponse(
        activities=[act if isinstance(act, SalesActivity) else SalesActivity(**act.__dict__ if hasattr(act, '__dict__') else act) for act in activities],
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    )

@router.post("/activities", response_model=SalesActivity)
async def create_crm_activity(
    activity_data: SalesActivityCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Create a new sales activity"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    act_dict = activity_data.dict()
    
    command = CreateSalesActivityCommand(
        tenant_id=tenant_id or "",
        subject=act_dict.get('subject', ''),
        description=act_dict.get('description', ''),
        type=act_dict.get('type', 'call'),
        assignedToId=act_dict.get('assignedTo', ''),
        relatedToId=act_dict.get('relatedTo', ''),
        relatedToType=act_dict.get('relatedToType', 'lead'),
        dueDate=act_dict.get('dueDate'),
        completedAt=act_dict.get('completedAt') or datetime.now(),
        priority=act_dict.get('priority', 'medium'),
        status=act_dict.get('status', 'pending'),
        notes=act_dict.get('notes', ''),
        created_by=str(current_user.id)
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=400, detail=result.error_message)
    
    act_entity = result.value
    act_db = get_sales_activity_by_id(str(act_entity.id), db, tenant_id) if hasattr(act_entity, 'id') else None
    
    if act_db:
        return SalesActivity.from_orm(act_db) if hasattr(SalesActivity, 'from_orm') else SalesActivity(**act_db.__dict__)
    else:
        raise HTTPException(status_code=500, detail="Failed to retrieve created activity")

@router.get("/activities/{activity_id}", response_model=SalesActivity)
async def get_crm_activity(
    activity_id: str,
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Get a specific sales activity by ID"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    query = GetSalesActivityByIdQuery(
        activity_id=activity_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    act_entity = result.value
    if not act_entity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    act_db = get_sales_activity_by_id(activity_id, db, tenant_id)
    if act_db:
        return SalesActivity.from_orm(act_db) if hasattr(SalesActivity, 'from_orm') else SalesActivity(**act_db.__dict__)
    else:
        raise HTTPException(status_code=404, detail="Activity not found")

@router.put("/activities/{activity_id}", response_model=SalesActivity)
async def update_crm_activity(
    activity_id: str,
    activity_data: SalesActivityUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Update a sales activity"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    update_dict = activity_data.dict(exclude_unset=True)
    
    command = UpdateSalesActivityCommand(
        activity_id=activity_id,
        tenant_id=tenant_id,
        subject=update_dict.get('subject'),
        description=update_dict.get('description'),
        type=update_dict.get('type'),
        assignedToId=update_dict.get('assignedTo'),
        relatedToId=update_dict.get('relatedTo'),
        relatedToType=update_dict.get('relatedToType'),
        dueDate=update_dict.get('dueDate'),
        completedAt=update_dict.get('completedAt'),
        priority=update_dict.get('priority'),
        status=update_dict.get('status'),
        notes=update_dict.get('notes')
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    act_entity = result.value
    act_db = get_sales_activity_by_id(activity_id, db, tenant_id)
    if act_db:
        return SalesActivity.from_orm(act_db) if hasattr(SalesActivity, 'from_orm') else SalesActivity(**act_db.__dict__)
    else:
        raise HTTPException(status_code=404, detail="Activity not found")

@router.delete("/activities/{activity_id}")
async def delete_crm_activity(
    activity_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Delete a sales activity"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    
    command = DeleteSalesActivityCommand(
        activity_id=activity_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    return {"message": "Activity deleted successfully"}

# Dashboard endpoint
@router.get("/dashboard", response_model=CRMDashboard)
async def get_crm_dashboard(
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
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
    tenant_context: Optional[dict] = Depends(get_tenant_context)
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
