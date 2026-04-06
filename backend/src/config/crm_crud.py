import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, cast, String
from sqlalchemy.exc import IntegrityError
from .crm_models import Lead, Contact, Company, Opportunity, SalesActivity, Customer, CustomerGuarantor
from .core_models import User
from .database_config import get_db
from ..services.s3_service import s3_service

def _attachment_url_from_stored(item: Any) -> Optional[str]:
    if isinstance(item, dict):
        u = item.get("url")
        return str(u) if u else None
    if isinstance(item, str):
        return item
    return None

def _attachment_urls_set(attachments: Any) -> set:
    if not attachments:
        return set()
    return {u for u in (_attachment_url_from_stored(a) for a in attachments) if u}

def _delete_s3_for_file_url(url: Optional[str]) -> None:
    if not url or not (str(url).startswith("http://") or str(url).startswith("https://")):
        return
    try:
        s3_key = s3_service.extract_s3_key_from_url(str(url))
        if s3_key:
            s3_service.delete_file(s3_key)
    except Exception:
        pass

def _attachment_item_to_dict(x: Any) -> Dict[str, Any]:
    if isinstance(x, dict):
        return dict(x)
    md = getattr(x, "model_dump", None)
    if callable(md):
        return md()
    raise TypeError("Invalid attachment item")

_LABELS = frozenset({"work", "personal", "other"})

def _norm_label(x: Any) -> str:
    s = str(x or "personal").lower()
    return s if s in _LABELS else "personal"

def _prepare_labeled_contact_dict(d: Dict[str, Any], *, customer_email_blank_string: bool) -> None:
    emails = []
    for x in d.get("emails") or []:
        if isinstance(x, dict):
            v = (x.get("value") or "").strip()
            if v:
                emails.append({"value": v, "label": _norm_label(x.get("label"))})
    if not emails and d.get("email"):
        v = str(d["email"]).strip()
        if v:
            emails.append({"value": v, "label": "personal"})
    phones = []
    for x in d.get("phones") or []:
        if isinstance(x, dict):
            v = (x.get("value") or "").strip()
            if v:
                phones.append({"value": v, "label": _norm_label(x.get("label"))})
    if not phones:
        if d.get("phone") and str(d["phone"]).strip():
            phones.append({"value": str(d["phone"]).strip(), "label": "work"})
        if d.get("mobile") and str(d["mobile"]).strip():
            phones.append({"value": str(d["mobile"]).strip(), "label": "personal"})
    d["emails"] = emails
    d["phones"] = phones
    if customer_email_blank_string:
        d["email"] = (emails[0]["value"].strip().lower() if emails else "") or ""
    else:
        d["email"] = emails[0]["value"].strip().lower() if emails else None
    d["phone"] = phones[0]["value"] if len(phones) > 0 else None
    d["mobile"] = phones[1]["value"] if len(phones) > 1 else None

def _contact_addresses_to_orm(addresses: Any) -> List[Dict[str, Any]]:
    if not addresses:
        return []
    out: List[Dict[str, Any]] = []
    keys = ("label", "line1", "line2", "city", "state", "postalCode", "country")
    for a in addresses:
        if hasattr(a, "model_dump"):
            d = a.model_dump(exclude_none=False)
        elif isinstance(a, dict):
            d = dict(a)
        else:
            continue
        cleaned: Dict[str, Any] = {}
        for k in keys:
            val = d.get(k)
            if val is not None and isinstance(val, str):
                val = val.strip() or None
            elif val is not None:
                s = str(val).strip()
                val = s or None
            if val:
                cleaned[k] = val
        if cleaned:
            out.append(cleaned)
    return out

def _contact_social_to_orm(social: Any) -> Dict[str, str]:
    if social is None:
        return {}
    if hasattr(social, "model_dump"):
        d = social.model_dump(exclude_none=True)
    elif isinstance(social, dict):
        d = dict(social)
    else:
        return {}
    out: Dict[str, str] = {}
    for k in ("facebook", "instagram", "x", "linkedin", "skype", "tiktok", "threads"):
        v = d.get(k)
        if v is not None and str(v).strip():
            out[k] = str(v).strip()
    return out

def find_customer_by_any_email(db: Session, email_lower: str, tenant_id: str) -> Optional[Customer]:
    if not email_lower or not str(email_lower).strip():
        return None
    email_lower = str(email_lower).strip().lower()
    for c in db.query(Customer).filter(Customer.tenant_id == tenant_id).all():
        for e in (c.emails or []):
            if isinstance(e, dict) and (e.get("value") or "").strip().lower() == email_lower:
                return c
        if c.email and str(c.email).strip().lower() == email_lower:
            return c
    return None

def find_contact_by_any_email(db: Session, email_lower: str, tenant_id: str) -> Optional[Contact]:
    if not email_lower or not str(email_lower).strip():
        return None
    email_lower = str(email_lower).strip().lower()
    for c in db.query(Contact).filter(Contact.tenant_id == tenant_id).all():
        for e in (c.emails or []):
            if isinstance(e, dict) and (e.get("value") or "").strip().lower() == email_lower:
                return c
        if c.email and str(c.email).strip().lower() == email_lower:
            return c
    return None

# Customer CRUD Operations
def create_customer(db: Session, customer_data: Dict[str, Any], tenant_id: str) -> Customer:
    """Create a new customer"""
    try:
        # Generate unique customer ID
        customer_data["customerId"] = generate_customer_id(db, tenant_id)
        customer_data["tenant_id"] = tenant_id
        customer_data["createdAt"] = datetime.utcnow()
        customer_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['cnic', 'phone', 'mobile', 'address', 'city', 'state', 'postalCode', 'notes', 'description', 'image_url', 'email']
        for field in optional_fields:
            if field in customer_data and customer_data[field] == '':
                customer_data[field] = None

        _prepare_labeled_contact_dict(customer_data, customer_email_blank_string=True)

        uuid_fields = ['assignedToId']
        for field in uuid_fields:
            if field in customer_data and customer_data[field] is None:
                del customer_data[field]
        
        if customer_data.get('cnic'):
            existing_customer = get_customer_by_cnic(db, customer_data['cnic'], tenant_id)
            if existing_customer:
                raise ValueError(f"Customer with CNIC '{customer_data['cnic']}' already exists")
        
        for em in customer_data.get("emails") or []:
            ev = (em.get("value") or "").strip().lower()
            if not ev:
                continue
            existing_customer = find_customer_by_any_email(db, ev, tenant_id)
            if existing_customer:
                raise ValueError(f"Customer with email '{ev}' already exists")

        atts = customer_data.get('attachments')
        if atts is None:
            customer_data['attachments'] = []
        else:
            customer_data['attachments'] = [_attachment_item_to_dict(x) for x in atts]

        customer = Customer(**customer_data)
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer
        
    except IntegrityError as e:
        db.rollback()
        err = e.orig
        error_msg = str(err)
        pgcode = getattr(err, 'pgcode', None) or getattr(err, 'sqlstate', None)
        if "cnic" in error_msg.lower():
            raise ValueError("Customer with this CNIC already exists")
        if "email" in error_msg.lower():
            if pgcode == '23502':
                raise ValueError("Database requires customer email. Update the customers table to allow NULL on the email column.")
            if pgcode == '23505':
                raise ValueError("Customer with this email already exists")
            raise ValueError("Customer with this email already exists")
        raise ValueError(f"Database constraint violation: {error_msg}")
    except Exception as e:
        db.rollback()
        raise

def get_customer_by_id(db: Session, customer_id: str, tenant_id: str) -> Optional[Customer]:
    """Get customer by ID"""
    return db.query(Customer).filter(
        and_(Customer.id == customer_id, Customer.tenant_id == tenant_id)
    ).first()

def get_customer_by_cnic(db: Session, cnic: str, tenant_id: str) -> Optional[Customer]:
    """Get customer by CNIC"""
    return db.query(Customer).filter(
        and_(Customer.cnic == cnic, Customer.tenant_id == tenant_id)
    ).first()

def get_customer_by_email(db: Session, email: str, tenant_id: str) -> Optional[Customer]:
    if email is None or (isinstance(email, str) and not email.strip()):
        return None
    return db.query(Customer).filter(
        and_(Customer.email == email.strip().lower(), Customer.tenant_id == tenant_id)
    ).first()

def get_customers(
    db: Session, 
    tenant_id: str, 
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    customer_type: Optional[str] = None
) -> Tuple[List[Customer], int]:
    """Get customers with optional filtering and search. Returns (customers, total_count)."""
    query = db.query(Customer).filter(Customer.tenant_id == tenant_id)
    
    if search:
        normalized_search = ' '.join(search.split())
        search_filter = or_(
            func.regexp_replace(Customer.firstName, r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
            func.regexp_replace(Customer.lastName, r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
            func.regexp_replace(func.concat(Customer.firstName, ' ', Customer.lastName), r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
            Customer.customerId.ilike(f"%{normalized_search}%"),
            Customer.phone.ilike(f"%{normalized_search}%"),
            Customer.mobile.ilike(f"%{normalized_search}%"),
            Customer.cnic.ilike(f"%{normalized_search}%"),
            Customer.email.ilike(f"%{normalized_search}%")
        )
        query = query.filter(search_filter)
    
    if status:
        query = query.filter(Customer.customerStatus == status)
    
    if customer_type:
        query = query.filter(Customer.customerType == customer_type)
    
    total = query.count()
    customers = query.offset(skip).limit(limit).all()
    return (customers, total)

def update_customer(db: Session, customer_id: str, customer_data: Dict[str, Any], tenant_id: str) -> Optional[Customer]:
    """Update customer"""
    try:
        customer = get_customer_by_id(db, customer_id, tenant_id)
        if not customer:
            return None
        
        customer_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['cnic', 'phone', 'mobile', 'address', 'city', 'state', 'postalCode', 'notes', 'description', 'image_url', 'email']
        for field in optional_fields:
            if field in customer_data and customer_data[field] == '':
                customer_data[field] = None
        if 'attachments' in customer_data:
            new_atts = customer_data.get('attachments')
            if new_atts is None:
                customer_data['attachments'] = []
            else:
                old_urls = _attachment_urls_set(customer.attachments)
                new_urls = _attachment_urls_set(new_atts)
                for url in old_urls - new_urls:
                    _delete_s3_for_file_url(url)
                customer_data['attachments'] = [_attachment_item_to_dict(x) for x in new_atts]
        if any(k in customer_data for k in ('emails', 'phones', 'email', 'phone', 'mobile')):
            merged = {
                "emails": list(customer.emails or []),
                "phones": list(customer.phones or []),
                "email": customer.email,
                "phone": customer.phone,
                "mobile": customer.mobile,
            }
            for k in ('emails', 'phones', 'email', 'phone', 'mobile'):
                if k in customer_data:
                    merged[k] = customer_data[k]
            _prepare_labeled_contact_dict(merged, customer_email_blank_string=True)
            for k in ('emails', 'phones', 'email', 'phone', 'mobile'):
                customer_data[k] = merged[k]

        uuid_fields = ['assignedToId']
        for field in uuid_fields:
            if field in customer_data and customer_data[field] is None:
                del customer_data[field]
        
        if customer_data.get('cnic') and customer_data['cnic'] != customer.cnic:
            existing_customer = get_customer_by_cnic(db, customer_data['cnic'], tenant_id)
            if existing_customer and existing_customer.id != customer_id:
                raise ValueError(f"Customer with CNIC '{customer_data['cnic']}' already exists")
        
        for em in customer_data.get("emails") or []:
            ev = (em.get("value") or "").strip().lower()
            if not ev:
                continue
            existing_customer = find_customer_by_any_email(db, ev, tenant_id)
            if existing_customer and str(existing_customer.id) != str(customer_id):
                raise ValueError(f"Customer with email '{ev}' already exists")
        
        for field, value in customer_data.items():
            if hasattr(customer, field):
                setattr(customer, field, value)
        
        db.commit()
        db.refresh(customer)
        return customer
        
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig)
        if "cnic" in error_msg.lower():
            raise ValueError("Customer with this CNIC already exists")
        elif "email" in error_msg.lower():
            raise ValueError("Customer with this email already exists")
        else:
            raise ValueError(f"Database constraint violation: {error_msg}")
    except Exception as e:
        db.rollback()
        raise

def delete_customer(db: Session, customer_id: str, tenant_id: str) -> bool:
    """Delete customer"""
    customer = get_customer_by_id(db, customer_id, tenant_id)
    if not customer:
        return False

    _delete_s3_for_file_url(customer.image_url)
    for att in (customer.attachments or []):
        _delete_s3_for_file_url(_attachment_url_from_stored(att))

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
    
    individual_customers = db.query(Customer).filter(
        and_(Customer.tenant_id == tenant_id, Customer.customerType == "individual")
    ).count()
    business_customers = db.query(Customer).filter(
        and_(Customer.tenant_id == tenant_id, Customer.customerType == "business")
    ).count()
    
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
    last_customer = db.query(Customer).filter(
        Customer.tenant_id == tenant_id
    ).order_by(desc(Customer.customerId)).first()
    
    if last_customer and last_customer.customerId:
        try:
            last_number = int(last_customer.customerId.replace("CUST", ""))
            new_number = last_number + 1
        except ValueError:
            new_number = 1
    else:
        new_number = 1
    
    max_attempts = 1000
    attempts = 0
    
    while attempts < max_attempts:
        candidate_id = f"CUST{new_number:03d}"
        
        existing_customer = db.query(Customer).filter(
            Customer.tenant_id == tenant_id,
            Customer.customerId == candidate_id
        ).first()
        
        if not existing_customer:
            return candidate_id
        
        new_number += 1
        attempts += 1
    
    return f"CUST{str(uuid.uuid4())[:8].upper()}"

def search_customers(
    db: Session, 
    tenant_id: str, 
    search_term: str, 
    limit: int = 20
) -> List[Customer]:
    """Search customers by name, ID, CNIC, phone, or email"""
    query = db.query(Customer).filter(Customer.tenant_id == tenant_id)
    
    normalized_search = ' '.join(search_term.split())
    
    search_filter = or_(
        func.regexp_replace(Customer.firstName, r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
        func.regexp_replace(Customer.lastName, r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
        func.regexp_replace(func.concat(Customer.firstName, ' ', Customer.lastName), r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
        Customer.customerId.ilike(f"%{normalized_search}%"),
        Customer.phone.ilike(f"%{normalized_search}%"),
        Customer.mobile.ilike(f"%{normalized_search}%"),
        Customer.cnic.ilike(f"%{normalized_search}%"),
        Customer.email.ilike(f"%{normalized_search}%"),
        cast(Customer.emails, String).ilike(f"%{normalized_search}%"),
        cast(Customer.phones, String).ilike(f"%{normalized_search}%"),
    )
    
    return query.filter(search_filter).limit(limit).all()


def create_guarantor(db: Session, customer_id: str, guarantor_data: Dict[str, Any], tenant_id: str) -> CustomerGuarantor:
    customer = get_customer_by_id(db, customer_id, tenant_id)
    if not customer:
        raise ValueError("Customer not found")
    data = dict(guarantor_data)
    data["tenant_id"] = tenant_id
    data["customer_id"] = customer_id
    data["createdAt"] = datetime.utcnow()
    data["updatedAt"] = datetime.utcnow()
    guarantor = CustomerGuarantor(**data)
    db.add(guarantor)
    db.commit()
    db.refresh(guarantor)
    return guarantor


def get_guarantors_by_customer(db: Session, customer_id: str, tenant_id: str) -> List[CustomerGuarantor]:
    return db.query(CustomerGuarantor).filter(
        and_(CustomerGuarantor.customer_id == customer_id, CustomerGuarantor.tenant_id == tenant_id)
    ).order_by(CustomerGuarantor.display_order.asc(), CustomerGuarantor.createdAt.asc()).all()


def get_guarantor_by_id(db: Session, guarantor_id: str, tenant_id: str) -> Optional[CustomerGuarantor]:
    return db.query(CustomerGuarantor).filter(
        and_(CustomerGuarantor.id == guarantor_id, CustomerGuarantor.tenant_id == tenant_id)
    ).first()


def update_guarantor(db: Session, guarantor_id: str, guarantor_data: Dict[str, Any], tenant_id: str) -> Optional[CustomerGuarantor]:
    guarantor = get_guarantor_by_id(db, guarantor_id, tenant_id)
    if not guarantor:
        return None
    guarantor_data["updatedAt"] = datetime.utcnow()
    for field, value in guarantor_data.items():
        if hasattr(guarantor, field):
            setattr(guarantor, field, value)
    db.commit()
    db.refresh(guarantor)
    return guarantor


def delete_guarantor(db: Session, guarantor_id: str, tenant_id: str) -> bool:
    guarantor = get_guarantor_by_id(db, guarantor_id, tenant_id)
    if not guarantor:
        return False
    db.delete(guarantor)
    db.commit()
    return True


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

def get_contacts(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Contact]:
    """Get all contacts (alias for get_all_contacts)"""
    return get_all_contacts(db, tenant_id, skip, limit)

def get_contacts_by_company(company_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Contact]:
    query = db.query(Contact).filter(Contact.companyId == company_id)
    if tenant_id:
        query = query.filter(Contact.tenant_id == tenant_id)
    return query.order_by(Contact.createdAt.desc()).offset(skip).limit(limit).all()

def create_contact(contact_data: dict, db: Session) -> Contact:
    contact_data["addresses"] = _contact_addresses_to_orm(contact_data.get("addresses"))
    contact_data["socialLinks"] = _contact_social_to_orm(contact_data.get("socialLinks"))
    atts = contact_data.get("attachments")
    if atts is None:
        contact_data["attachments"] = []
    else:
        contact_data["attachments"] = [_attachment_item_to_dict(x) for x in atts]
    if contact_data.get("description") == "":
        contact_data["description"] = None
    tid = str(contact_data.get("tenant_id", ""))
    _prepare_labeled_contact_dict(contact_data, customer_email_blank_string=False)
    for em in contact_data.get("emails") or []:
        ev = (em.get("value") or "").strip().lower()
        if not ev:
            continue
        existing = find_contact_by_any_email(db, ev, tid)
        if existing:
            raise ValueError(f"Contact with email '{ev}' already exists")
    db_contact = Contact(**contact_data)
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

def update_contact(contact_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Contact]:
    contact = get_contact_by_id(contact_id, db, tenant_id)
    if not contact:
        return None
    if "description" in update_data and update_data["description"] == "":
        update_data["description"] = None
    if "attachments" in update_data:
        new_atts = update_data.get("attachments")
        if new_atts is None:
            update_data["attachments"] = []
        else:
            old_urls = _attachment_urls_set(contact.attachments)
            new_urls = _attachment_urls_set(new_atts)
            for url in old_urls - new_urls:
                _delete_s3_for_file_url(url)
            update_data["attachments"] = [_attachment_item_to_dict(x) for x in new_atts]
    if "addresses" in update_data:
        update_data["addresses"] = _contact_addresses_to_orm(update_data.get("addresses"))
    if "socialLinks" in update_data:
        update_data["socialLinks"] = _contact_social_to_orm(update_data.get("socialLinks"))
    tid = str(tenant_id) if tenant_id else str(contact.tenant_id)
    if any(k in update_data for k in ("emails", "phones", "email", "phone", "mobile")):
        merged = {
            "emails": list(contact.emails or []),
            "phones": list(contact.phones or []),
            "email": contact.email,
            "phone": contact.phone,
            "mobile": contact.mobile,
        }
        for k in ("emails", "phones", "email", "phone", "mobile"):
            if k in update_data:
                merged[k] = update_data[k]
        _prepare_labeled_contact_dict(merged, customer_email_blank_string=False)
        for k in ("emails", "phones", "email", "phone", "mobile"):
            update_data[k] = merged[k]
        for em in merged.get("emails") or []:
            ev = (em.get("value") or "").strip().lower()
            if not ev:
                continue
            existing = find_contact_by_any_email(db, ev, tid)
            if existing and str(existing.id) != str(contact_id):
                raise ValueError(f"Contact with email '{ev}' already exists")
    for key, value in update_data.items():
        if not hasattr(contact, key):
            continue
        if value is not None or key in (
            "email", "notes", "description", "phone", "mobile", "emails", "phones",
            "initials", "fullName", "birthday", "businessTaxId", "addresses", "socialLinks",
        ):
            setattr(contact, key, value)
    contact.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(contact)
    return contact

def delete_contact(contact_id: str, db: Session, tenant_id: str = None) -> bool:
    contact = get_contact_by_id(contact_id, db, tenant_id)
    if not contact:
        return False
    for att in (contact.attachments or []):
        _delete_s3_for_file_url(_attachment_url_from_stored(att))
    db.delete(contact)
    db.commit()
    return True

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
    open_opportunities = db.query(Opportunity).filter(
        Opportunity.tenant_id == tenant_id,
        Opportunity.stage.in_(["prospecting", "qualification", "proposal", "negotiation"])
    ).count()
    
    total_contacts = db.query(Contact).filter(Contact.tenant_id == tenant_id).count()
    total_companies = db.query(Company).filter(Company.tenant_id == tenant_id).count()
    
    won_opportunities_query = db.query(Opportunity).filter(
        Opportunity.tenant_id == tenant_id,
        Opportunity.stage == "closed_won"
    )
    total_revenue_result = db.query(func.sum(Opportunity.amount)).filter(
        Opportunity.tenant_id == tenant_id,
        Opportunity.stage == "closed_won",
        Opportunity.amount.isnot(None)
    ).scalar()
    total_revenue = float(total_revenue_result) if total_revenue_result else 0.0
    
    won_opportunities_count = won_opportunities_query.count()
    average_deal_size = 0.0
    if won_opportunities_count > 0:
        average_deal_size = total_revenue / won_opportunities_count
    
    all_opportunities = db.query(Opportunity).filter(
        Opportunity.tenant_id == tenant_id,
        Opportunity.amount.isnot(None)
    ).all()
    projected_revenue = sum(
        (opp.amount or 0) * (opp.probability or 0) / 100.0
        for opp in all_opportunities
    )
    
    conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0.0
    
    return {
        "totalLeads": total_leads,
        "activeLeads": active_leads,
        "totalContacts": total_contacts,
        "totalCompanies": total_companies,
        "totalOpportunities": total_opportunities,
        "openOpportunities": open_opportunities,
        "totalRevenue": float(total_revenue),
        "projectedRevenue": float(projected_revenue),
        "conversionRate": float(conversion_rate),
        "averageDealSize": float(average_deal_size)
    }
