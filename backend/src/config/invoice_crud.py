from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, text
from .invoice_models import Invoice, Payment, InvoiceShareLink, DeliveryNote
from ..core.cache import cached_sync


def _parse_uuid(value: str) -> UUID:
    return value if isinstance(value, UUID) else UUID(str(value))


def _delete_legacy_invoice_items(db: Session, invoice_id: UUID) -> None:
    table_check = db.execute(
        text(
            """
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'invoice_items'
            """
        )
    ).scalar()
    if not table_check:
        return

    columns = db.execute(
        text(
            """
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'invoice_items'
            AND column_name IN ('invoiceId', 'invoice_id')
            """
        )
    ).fetchall()
    for (column_name,) in columns:
        if column_name == "invoiceId":
            db.execute(
                text('DELETE FROM invoice_items WHERE "invoiceId" = :invoice_id'),
                {"invoice_id": invoice_id},
            )
        else:
            db.execute(
                text("DELETE FROM invoice_items WHERE invoice_id = :invoice_id"),
                {"invoice_id": invoice_id},
            )


def delete_invoice_dependencies(
    db: Session, invoice_id: str, tenant_id: Optional[str] = None
) -> None:
    invoice_uuid = _parse_uuid(invoice_id)
    tenant_uuid = _parse_uuid(tenant_id) if tenant_id else None

    share_query = db.query(InvoiceShareLink).filter(
        InvoiceShareLink.invoice_id == invoice_uuid
    )
    if tenant_uuid:
        share_query = share_query.filter(InvoiceShareLink.tenant_id == tenant_uuid)
    share_query.delete(synchronize_session=False)

    delivery_query = db.query(DeliveryNote).filter(
        DeliveryNote.invoice_id == invoice_uuid
    )
    if tenant_uuid:
        delivery_query = delivery_query.filter(DeliveryNote.tenant_id == tenant_uuid)
    delivery_query.delete(synchronize_session=False)

    try:
        from .installment_models import InstallmentPlan, Installment

        plan_query = db.query(InstallmentPlan).filter(
            InstallmentPlan.invoice_id == invoice_uuid
        )
        if tenant_uuid:
            plan_query = plan_query.filter(InstallmentPlan.tenant_id == tenant_uuid)
        plan_ids = [plan.id for plan in plan_query.all()]
        if plan_ids:
            installment_query = db.query(Installment).filter(
                Installment.installment_plan_id.in_(plan_ids)
            )
            if tenant_uuid:
                installment_query = installment_query.filter(
                    Installment.tenant_id == tenant_uuid
                )
            installment_query.delete(synchronize_session=False)
            plan_query.delete(synchronize_session=False)
    except Exception:
        pass

    payment_query = db.query(Payment).filter(Payment.invoiceId == invoice_uuid)
    if tenant_uuid:
        payment_query = payment_query.filter(Payment.tenant_id == tenant_uuid)
    payment_query.delete(synchronize_session=False)

    try:
        from .banking_models import BankTransaction

        bank_query = db.query(BankTransaction).filter(
            BankTransaction.related_invoice_id == invoice_uuid
        )
        if tenant_uuid:
            bank_query = bank_query.filter(BankTransaction.tenant_id == tenant_uuid)
        bank_query.update(
            {BankTransaction.related_invoice_id: None}, synchronize_session=False
        )
    except Exception:
        pass

    try:
        from .ledger_models import AccountReceivable

        ar_query = db.query(AccountReceivable).filter(
            AccountReceivable.invoice_id == str(invoice_uuid)
        )
        if tenant_uuid:
            ar_query = ar_query.filter(AccountReceivable.tenant_id == tenant_uuid)
        ar_query.delete(synchronize_session=False)
    except Exception:
        pass

    _delete_legacy_invoice_items(db, invoice_uuid)

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
        delete_invoice_dependencies(db, invoice_id, tenant_id)
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

def get_invoices_by_order_prefix(
    db: Session,
    tenant_id: str,
    order_prefix: str,
    skip: int = 0,
    limit: int = 100,
) -> List[Invoice]:
    query = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.orderNumber.like(f"{order_prefix}%"),
    )
    return query.order_by(Invoice.createdAt.desc()).offset(skip).limit(limit).all()

def get_invoices_by_order_prefix_count(db: Session, tenant_id: str, order_prefix: str) -> int:
    return db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.orderNumber.like(f"{order_prefix}%"),
    ).count()

def get_payments(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payment]:
    """Get all payments (alias for get_all_payments)"""
    return get_all_payments(db, tenant_id, skip, limit)

# Invoice Dashboard functions
@cached_sync(ttl=60, key_prefix="invoice_dashboard_")
def get_invoice_dashboard_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    # Single optimized query using CASE statements
    result = db.query(
        func.count(Invoice.id).label('total'),
        func.sum(case([(Invoice.status == "draft", 1)], else_=0)).label('draft'),
        func.sum(case([(Invoice.status == "sent", 1)], else_=0)).label('sent'),
        func.sum(case([(Invoice.status == "paid", 1)], else_=0)).label('paid'),
        func.sum(case([
            (and_(Invoice.status.in_(["sent", "draft"]), Invoice.dueDate < datetime.utcnow()), 1)
        ], else_=0)).label('overdue'),
        func.sum(case([
            (Invoice.status.in_(["sent", "paid"]), Invoice.total)
        ], else_=0)).label('total_amount'),
        func.sum(case([
            (Invoice.status == "paid", Invoice.total)
        ], else_=0)).label('paid_amount')
    ).filter(Invoice.tenant_id == tenant_id).first()
    
    total_amount = result.total_amount or 0
    paid_amount = result.paid_amount or 0
    outstanding_amount = total_amount - paid_amount
    
    return {
        "invoices": {
            "total": result.total or 0,
            "draft": result.draft or 0,
            "sent": result.sent or 0,
            "paid": result.paid or 0,
            "overdue": result.overdue or 0
        },
        "amounts": {
            "total": round(total_amount, 2),
            "paid": round(paid_amount, 2),
            "outstanding": round(outstanding_amount, 2)
        }
    }
