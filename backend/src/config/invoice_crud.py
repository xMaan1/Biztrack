from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from .invoice_models import Invoice, Payment
from sqlalchemy import func

# Invoice functions
def get_invoice_by_id(invoice_id: str, db: Session, tenant_id: str = None) -> Optional[Invoice]:
    query = db.query(Invoice).filter(Invoice.id == invoice_id)
    if tenant_id:
        query = query.filter(Invoice.tenant_id == tenant_id)
    return query.first()

def get_invoice_by_number(invoice_number: str, db: Session, tenant_id: str = None) -> Optional[Invoice]:
    query = db.query(Invoice).filter(Invoice.invoiceNumber == invoice_number)
    if tenant_id:
        query = query.filter(Invoice.tenant_id == tenant_id)
    return query.first()

def get_all_invoices(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Invoice]:
    query = db.query(Invoice)
    if tenant_id:
        query = query.filter(Invoice.tenant_id == tenant_id)
    return query.order_by(Invoice.createdAt.desc()).offset(skip).limit(limit).all()

def get_invoices_by_status(status: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Invoice]:
    query = db.query(Invoice).filter(Invoice.status == status)
    if tenant_id:
        query = query.filter(Invoice.tenant_id == tenant_id)
    return query.order_by(Invoice.createdAt.desc()).offset(skip).limit(limit).all()

def get_invoices_by_customer(customer_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Invoice]:
    query = db.query(Invoice).filter(Invoice.customerId == customer_id)
    if tenant_id:
        query = query.filter(Invoice.tenant_id == tenant_id)
    return query.order_by(Invoice.createdAt.desc()).offset(skip).limit(limit).all()

def get_overdue_invoices(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Invoice]:
    query = db.query(Invoice).filter(
        Invoice.dueDate < datetime.utcnow(),
        Invoice.status.in_(["sent", "draft"])
    )
    if tenant_id:
        query = query.filter(Invoice.tenant_id == tenant_id)
    return query.order_by(Invoice.dueDate.asc()).offset(skip).limit(limit).all()

def create_invoice(invoice_data: dict, db: Session) -> Invoice:
    db_invoice = Invoice(**invoice_data)
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def update_invoice(invoice_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Invoice]:
    invoice = get_invoice_by_id(invoice_id, db, tenant_id)
    if invoice:
        for key, value in update_data.items():
            if hasattr(invoice, key) and value is not None:
                setattr(invoice, key, value)
        invoice.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(invoice)
    return invoice

def delete_invoice(invoice_id: str, db: Session, tenant_id: str = None) -> bool:
    invoice = get_invoice_by_id(invoice_id, db, tenant_id)
    if invoice:
        db.delete(invoice)
        db.commit()
        return True
    return False

# Payment functions
def get_payment_by_id(payment_id: str, db: Session, tenant_id: str = None) -> Optional[Payment]:
    query = db.query(Payment).filter(Payment.id == payment_id)
    if tenant_id:
        query = query.filter(Payment.tenant_id == tenant_id)
    return query.first()

def get_all_payments(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payment]:
    query = db.query(Payment)
    if tenant_id:
        query = query.filter(Payment.tenant_id == tenant_id)
    return query.order_by(Payment.createdAt.desc()).offset(skip).limit(limit).all()

def get_payments_by_invoice(invoice_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payment]:
    query = db.query(Payment).filter(Payment.invoiceId == invoice_id)
    if tenant_id:
        query = query.filter(Payment.tenant_id == tenant_id)
    return query.order_by(Payment.paymentDate.desc()).offset(skip).limit(limit).all()

def get_payments_by_status(status: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payment]:
    query = db.query(Payment).filter(Payment.status == status)
    if tenant_id:
        query = query.filter(Payment.tenant_id == tenant_id)
    return query.order_by(Payment.createdAt.desc()).offset(skip).limit(limit).all()

def create_payment(payment_data: dict, db: Session) -> Payment:
    db_payment = Payment(**payment_data)
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

def update_payment(payment_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Payment]:
    payment = get_payment_by_id(payment_id, db, tenant_id)
    if payment:
        for key, value in update_data.items():
            if hasattr(payment, key) and value is not None:
                setattr(payment, key, value)
        payment.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(payment)
    return payment

def delete_payment(payment_id: str, db: Session, tenant_id: str = None) -> bool:
    payment = get_payment_by_id(payment_id, db, tenant_id)
    if payment:
        db.delete(payment)
        db.commit()
        return True
    return False

# Alias functions for backward compatibility
def get_invoices(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Invoice]:
    """Get all invoices (alias for get_all_invoices)"""
    return get_all_invoices(db, tenant_id, skip, limit)

def get_payments(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payment]:
    """Get all payments (alias for get_all_payments)"""
    return get_all_payments(db, tenant_id, skip, limit)

# Invoice Dashboard functions
def get_invoice_dashboard_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get invoice dashboard statistics"""
    total_invoices = db.query(Invoice).filter(Invoice.tenant_id == tenant_id).count()
    draft_invoices = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.status == "draft"
    ).count()
    sent_invoices = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.status == "sent"
    ).count()
    paid_invoices = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.status == "paid"
    ).count()
    overdue_invoices = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.status.in_(["sent", "draft"]),
        Invoice.dueDate < datetime.utcnow()
    ).count()
    
    total_amount = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.status.in_(["sent", "paid"])
    ).with_entities(func.sum(Invoice.total)).scalar() or 0
    
    paid_amount = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.status == "paid"
    ).with_entities(func.sum(Invoice.total)).scalar() or 0
    
    outstanding_amount = total_amount - paid_amount
    
    return {
        "invoices": {
            "total": total_invoices,
            "draft": draft_invoices,
            "sent": sent_invoices,
            "paid": paid_invoices,
            "overdue": overdue_invoices
        },
        "amounts": {
            "total": round(total_amount, 2),
            "paid": round(paid_amount, 2),
            "outstanding": round(outstanding_amount, 2)
        }
    }
