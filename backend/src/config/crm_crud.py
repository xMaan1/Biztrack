import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from .crm_models import Lead, Contact, Company, Opportunity, SalesActivity, Customer
from .core_models import User
from .database_config import get_db

# Customer CRUD Operations
def create_customer(db: Session, customer_data: Dict[str, Any], tenant_id: str) -> Customer:
    """Create a new customer"""
    # Generate unique customer ID
    customer_data["customerId"] = generate_customer_id(db, tenant_id)
    customer_data["tenant_id"] = tenant_id
    customer_data["createdAt"] = datetime.utcnow()
    customer_data["updatedAt"] = datetime.utcnow()
    
    # Convert empty strings to None for optional fields to avoid unique constraint violations
    optional_fields = ['cnic', 'phone', 'mobile', 'address', 'city', 'state', 'postalCode', 'notes']
    for field in optional_fields:
        if field in customer_data and customer_data[field] == '':
            customer_data[field] = None
    
    # Handle UUID fields properly - remove None values for UUID fields
    uuid_fields = ['assignedToId']
    for field in uuid_fields:
        if field in customer_data and customer_data[field] is None:
            del customer_data[field]
    
    customer = Customer(**customer_data)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

def get_customer_by_id(db: Session, customer_id: str, tenant_id: str) -> Optional[Customer]:
    """Get customer by ID"""
    return db.query(Customer).filter(
        and_(Customer.id == customer_id, Customer.tenant_id == tenant_id)
    ).first()

def get_customer_by_email(email: str, db: Session, tenant_id: str) -> Optional[Customer]:
    """Get customer by email"""
    return db.query(Customer).filter(
        and_(Customer.email == email.lower(), Customer.tenant_id == tenant_id)
    ).first()

def get_customers(
    db: Session, 
    tenant_id: str, 
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    customer_type: Optional[str] = None
) -> List[Customer]:
    """Get customers with optional filtering and search"""
    query = db.query(Customer).filter(Customer.tenant_id == tenant_id)
    
    if search:
        search_filter = or_(
            Customer.firstName.ilike(f"%{search}%"),
            Customer.lastName.ilike(f"%{search}%"),
            Customer.customerId.ilike(f"%{search}%"),
            Customer.phone.ilike(f"%{search}%"),
            Customer.mobile.ilike(f"%{search}%"),
            Customer.cnic.ilike(f"%{search}%"),
            Customer.email.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if status:
        query = query.filter(Customer.customerStatus == status)
    
    if customer_type:
        query = query.filter(Customer.customerType == customer_type)
    
    return query.offset(skip).limit(limit).all()

def update_customer(db: Session, customer_id: str, customer_data: Dict[str, Any], tenant_id: str) -> Optional[Customer]:
    """Update customer"""
    customer = get_customer_by_id(db, customer_id, tenant_id)
    if not customer:
        return None
    
    customer_data["updatedAt"] = datetime.utcnow()
    
    # Convert empty strings to None for optional fields to avoid unique constraint violations
    optional_fields = ['cnic', 'phone', 'mobile', 'address', 'city', 'state', 'postalCode', 'notes']
    for field in optional_fields:
        if field in customer_data and customer_data[field] == '':
            customer_data[field] = None
    
    # Handle UUID fields properly - remove None values for UUID fields
    uuid_fields = ['assignedToId']
    for field in uuid_fields:
        if field in customer_data and customer_data[field] is None:
            del customer_data[field]
    
    for field, value in customer_data.items():
        if hasattr(customer, field):
            setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    return customer

def delete_customer(db: Session, customer_id: str, tenant_id: str) -> bool:
    """Delete customer"""
    customer = get_customer_by_id(db, customer_id, tenant_id)
    if not customer:
        return False
    
    db.delete(customer)
    db.commit()
    return True

def get_customer_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get customer statistics"""
    total_customers = db.query(Customer).filter(Customer.tenant_id == tenant_id).count()
    active_customers = db.query(Customer).filter(
        and_(Customer.tenant_id == tenant_id, Customer.customerStatus == "active")
    ).count()
    inactive_customers = db.query(Customer).filter(
        and_(Customer.tenant_id == tenant_id, Customer.customerStatus == "inactive")
    ).count()
    blocked_customers = db.query(Customer).filter(
        and_(Customer.tenant_id == tenant_id, Customer.customerStatus == "blocked")
    ).count()
    
    # Customer type distribution
    individual_customers = db.query(Customer).filter(
        and_(Customer.tenant_id == tenant_id, Customer.customerType == "individual")
    ).count()
    business_customers = db.query(Customer).filter(
        and_(Customer.tenant_id == tenant_id, Customer.customerType == "business")
    ).count()
    
    # Recent customers (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_customers = db.query(Customer).filter(
        and_(Customer.tenant_id == tenant_id, Customer.createdAt >= thirty_days_ago)
    ).count()
    
    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "inactive_customers": inactive_customers,
        "blocked_customers": blocked_customers,
        "individual_customers": individual_customers,
        "business_customers": business_customers,
        "recent_customers": recent_customers
    }

def generate_customer_id(db: Session, tenant_id: str) -> str:
    """Generate unique customer ID"""
    # Get the last customer ID for this tenant
    last_customer = db.query(Customer).filter(
        Customer.tenant_id == tenant_id
    ).order_by(desc(Customer.customerId)).first()
    
    if last_customer and last_customer.customerId:
        try:
            # Extract number from last ID (e.g., CUST001 -> 1)
            last_number = int(last_customer.customerId.replace("CUST", ""))
            new_number = last_number + 1
        except ValueError:
            new_number = 1
    else:
        new_number = 1
    
    # Format as CUST001, CUST002, etc.
    return f"CUST{new_number:03d}"

def search_customers(
    db: Session, 
    tenant_id: str, 
    search_term: str, 
    limit: int = 20
) -> List[Customer]:
    """Search customers by name, ID, CNIC, phone, or email"""
    query = db.query(Customer).filter(Customer.tenant_id == tenant_id)
    
    search_filter = or_(
        Customer.firstName.ilike(f"%{search_term}%"),
        Customer.lastName.ilike(f"%{search_term}%"),
        Customer.customerId.ilike(f"%{search_term}%"),
        Customer.phone.ilike(f"%{search_term}%"),
        Customer.mobile.ilike(f"%{search_term}%"),
        Customer.cnic.ilike(f"%{search_term}%"),
        Customer.email.ilike(f"%{search_term}%")
    )
    
    return query.filter(search_filter).limit(limit).all()

# Existing Lead CRUD Operations
def get_lead_by_id(lead_id: str, db: Session, tenant_id: str = None) -> Optional[Lead]:
    query = db.query(Lead).filter(Lead.id == lead_id)
    if tenant_id:
        query = query.filter(Lead.tenant_id == tenant_id)
    return query.first()

def get_all_leads(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Lead]:
    query = db.query(Lead)
    if tenant_id:
        query = query.filter(Lead.tenant_id == tenant_id)
    return query.order_by(Lead.createdAt.desc()).offset(skip).limit(limit).all()

# Alias functions for backward compatibility
def get_leads(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Lead]:
    """Get all leads (alias for get_all_leads)"""
    return get_all_leads(db, tenant_id, skip, limit)

def get_leads_by_status(status: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Lead]:
    query = db.query(Lead).filter(Lead.status == status)
    if tenant_id:
        query = query.filter(Lead.tenant_id == tenant_id)
    return query.order_by(Lead.createdAt.desc()).offset(skip).limit(limit).all()

def get_leads_by_assignee(assignee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Lead]:
    query = db.query(Lead).filter(Lead.assignedToId == assignee_id)
    if tenant_id:
        query = query.filter(Lead.tenant_id == tenant_id)
    return query.order_by(Lead.createdAt.desc()).offset(skip).limit(limit).all()

def create_lead(lead_data: dict, db: Session) -> Lead:
    db_lead = Lead(**lead_data)
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

def update_lead(lead_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Lead]:
    lead = get_lead_by_id(lead_id, db, tenant_id)
    if lead:
        for key, value in update_data.items():
            if hasattr(lead, key) and value is not None:
                setattr(lead, key, value)
        lead.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(lead)
    return lead

def delete_lead(lead_id: str, db: Session, tenant_id: str = None) -> bool:
    lead = get_lead_by_id(lead_id, db, tenant_id)
    if lead:
        db.delete(lead)
        db.commit()
        return True
    return False

# Contact functions
def get_contact_by_id(contact_id: str, db: Session, tenant_id: str = None) -> Optional[Contact]:
    query = db.query(Contact).filter(Contact.id == contact_id)
    if tenant_id:
        query = query.filter(Contact.tenant_id == tenant_id)
    return query.first()

def get_all_contacts(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Contact]:
    query = db.query(Contact)
    if tenant_id:
        query = query.filter(Contact.tenant_id == tenant_id)
    return query.order_by(Contact.createdAt.desc()).offset(skip).limit(limit).all()

# Alias functions for backward compatibility
def get_contacts(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Contact]:
    """Get all contacts (alias for get_all_contacts)"""
    return get_all_contacts(db, tenant_id, skip, limit)

def get_contacts_by_company(company_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Contact]:
    query = db.query(Contact).filter(Contact.companyId == company_id)
    if tenant_id:
        query = query.filter(Contact.tenant_id == tenant_id)
    return query.order_by(Contact.createdAt.desc()).offset(skip).limit(limit).all()

def create_contact(contact_data: dict, db: Session) -> Contact:
    db_contact = Contact(**contact_data)
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

def update_contact(contact_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Contact]:
    contact = get_contact_by_id(contact_id, db, tenant_id)
    if contact:
        for key, value in update_data.items():
            if hasattr(contact, key) and value is not None:
                setattr(contact, key, value)
        contact.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(contact)
    return contact

def delete_contact(contact_id: str, db: Session, tenant_id: str = None) -> bool:
    contact = get_contact_by_id(contact_id, db, tenant_id)
    if contact:
        db.delete(contact)
        db.commit()
        return True
    return False

# Company functions
def get_company_by_id(company_id: str, db: Session, tenant_id: str = None) -> Optional[Company]:
    query = db.query(Company).filter(Company.id == company_id)
    if tenant_id:
        query = query.filter(Company.tenant_id == tenant_id)
    return query.first()

def get_all_companies(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Company]:
    query = db.query(Company)
    if tenant_id:
        query = query.filter(Company.tenant_id == tenant_id)
    return query.order_by(Company.createdAt.desc()).offset(skip).limit(limit).all()

# Alias functions for backward compatibility
def get_companies(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Company]:
    """Get all companies (alias for get_all_companies)"""
    return get_all_companies(db, tenant_id, skip, limit)

def get_companies_by_industry(industry: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Company]:
    query = db.query(Company).filter(Company.industry == industry)
    if tenant_id:
        query = query.filter(Company.tenant_id == tenant_id)
    return query.order_by(Company.createdAt.desc()).offset(skip).limit(limit).all()

def create_company(company_data: dict, db: Session) -> Company:
    db_company = Company(**company_data)
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company

def update_company(company_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Company]:
    company = get_company_by_id(company_id, db, tenant_id)
    if company:
        for key, value in update_data.items():
            if hasattr(company, key) and value is not None:
                setattr(company, key, value)
        company.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(company)
    return company

def delete_company(company_id: str, db: Session, tenant_id: str = None) -> bool:
    company = get_company_by_id(company_id, db, tenant_id)
    if company:
        db.delete(company)
        db.commit()
        return True
    return False

# Opportunity functions
def get_opportunity_by_id(opportunity_id: str, db: Session, tenant_id: str = None) -> Optional[Opportunity]:
    query = db.query(Opportunity).filter(Opportunity.id == opportunity_id)
    if tenant_id:
        query = query.filter(Opportunity.tenant_id == tenant_id)
    return query.first()

def get_all_opportunities(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Opportunity]:
    query = db.query(Opportunity)
    if tenant_id:
        query = query.filter(Opportunity.tenant_id == tenant_id)
    return query.order_by(Opportunity.createdAt.desc()).offset(skip).limit(limit).all()

# Alias functions for backward compatibility
def get_opportunities(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Opportunity]:
    """Get all opportunities (alias for get_all_opportunities)"""
    return get_all_opportunities(db, tenant_id, skip, limit)

def get_opportunities_by_stage(stage: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Opportunity]:
    query = db.query(Opportunity).filter(Opportunity.stage == stage)
    if tenant_id:
        query = query.filter(Opportunity.tenant_id == tenant_id)
    return query.order_by(Opportunity.createdAt.desc()).offset(skip).limit(limit).all()

def get_opportunities_by_assignee(assignee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Opportunity]:
    query = db.query(Opportunity).filter(Opportunity.assignedToId == assignee_id)
    if tenant_id:
        query = query.filter(Opportunity.tenant_id == tenant_id)
    return query.order_by(Opportunity.createdAt.desc()).offset(skip).limit(limit).all()

def create_opportunity(opportunity_data: dict, db: Session) -> Opportunity:
    db_opportunity = Opportunity(**opportunity_data)
    db.add(db_opportunity)
    db.commit()
    db.refresh(db_opportunity)
    return db_opportunity

def update_opportunity(opportunity_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Opportunity]:
    opportunity = get_opportunity_by_id(opportunity_id, db, tenant_id)
    if opportunity:
        for key, value in update_data.items():
            if hasattr(opportunity, key) and value is not None:
                setattr(opportunity, key, value)
        opportunity.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(opportunity)
    return opportunity

def delete_opportunity(opportunity_id: str, db: Session, tenant_id: str = None) -> bool:
    opportunity = get_opportunity_by_id(opportunity_id, db, tenant_id)
    if opportunity:
        db.delete(opportunity)
        db.commit()
        return True
    return False

# SalesActivity functions
def get_sales_activity_by_id(activity_id: str, db: Session, tenant_id: str = None) -> Optional[SalesActivity]:
    query = db.query(SalesActivity).filter(SalesActivity.id == activity_id)
    if tenant_id:
        query = query.filter(SalesActivity.tenant_id == tenant_id)
    return query.first()

def get_all_sales_activities(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[SalesActivity]:
    query = db.query(SalesActivity)
    if tenant_id:
        query = query.filter(SalesActivity.tenant_id == tenant_id)
    return query.order_by(SalesActivity.createdAt.desc()).offset(skip).limit(limit).all()

# Alias functions for backward compatibility
def get_sales_activities(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[SalesActivity]:
    """Get all sales activities (alias for get_all_sales_activities)"""
    return get_all_sales_activities(db, tenant_id, skip, limit)

def get_sales_activities_by_assignee(assignee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[SalesActivity]:
    query = db.query(SalesActivity).filter(SalesActivity.assignedToId == assignee_id)
    if tenant_id:
        query = query.filter(SalesActivity.tenant_id == tenant_id)
    return query.order_by(SalesActivity.dueDate.asc()).offset(skip).limit(limit).all()

def create_sales_activity(activity_data: dict, db: Session) -> SalesActivity:
    db_activity = SalesActivity(**activity_data)
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

def update_sales_activity(activity_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[SalesActivity]:
    activity = get_sales_activity_by_id(activity_id, db, tenant_id)
    if activity:
        for key, value in update_data.items():
            if hasattr(activity, key) and value is not None:
                setattr(activity, key, value)
        activity.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(activity)
    return activity

def delete_sales_activity(activity_id: str, db: Session, tenant_id: str = None) -> bool:
    activity = get_sales_activity_by_id(activity_id, db, tenant_id)
    if activity:
        db.delete(activity)
        db.commit()
        return True
    return False

# CRM Dashboard functions
def get_crm_dashboard_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get CRM dashboard statistics"""
    total_leads = db.query(Lead).filter(Lead.tenant_id == tenant_id).count()
    active_leads = db.query(Lead).filter(
        Lead.tenant_id == tenant_id,
        Lead.status.in_(["new", "contacted", "qualified"])
    ).count()
    converted_leads = db.query(Lead).filter(
        Lead.tenant_id == tenant_id,
        Lead.status == "converted"
    ).count()
    
    total_opportunities = db.query(Opportunity).filter(Opportunity.tenant_id == tenant_id).count()
    active_opportunities = db.query(Opportunity).filter(
        Opportunity.tenant_id == tenant_id,
        Opportunity.stage.in_(["prospecting", "qualification", "proposal", "negotiation"])
    ).count()
    won_opportunities = db.query(Opportunity).filter(
        Opportunity.tenant_id == tenant_id,
        Opportunity.stage == "closed_won"
    ).count()
    
    total_contacts = db.query(Contact).filter(Contact.tenant_id == tenant_id).count()
    total_companies = db.query(Company).filter(Company.tenant_id == tenant_id).count()
    
    return {
        "leads": {
            "total": total_leads,
            "active": active_leads,
            "converted": converted_leads,
            "conversion_rate": (converted_leads / total_leads * 100) if total_leads > 0 else 0
        },
        "opportunities": {
            "total": total_opportunities,
            "active": active_opportunities,
            "won": won_opportunities,
            "win_rate": (won_opportunities / total_opportunities * 100) if total_opportunities > 0 else 0
        },
        "contacts": total_contacts,
        "companies": total_companies
    }
