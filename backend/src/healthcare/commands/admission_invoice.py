import uuid
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc

from ...config.database import get_admission_by_id, get_patient_by_id
from ...config.invoice_models import Invoice
from ...config.invoice_crud import create_invoice


def _generate_invoice_number(tenant_id: str, db: Session) -> str:
    year = datetime.now().year
    month = datetime.now().month
    for attempt in range(10):
        highest_invoice = db.query(Invoice).filter(
            and_(
                Invoice.tenant_id == tenant_id,
                func.extract("year", Invoice.createdAt) == year,
                func.extract("month", Invoice.createdAt) == month,
            )
        ).order_by(desc(Invoice.invoiceNumber)).first()
        if highest_invoice:
            try:
                parts = highest_invoice.invoiceNumber.split("-")
                if len(parts) == 3:
                    new_number = int(parts[2]) + 1
                else:
                    count = db.query(Invoice).filter(
                        and_(
                            Invoice.tenant_id == tenant_id,
                            func.extract("year", Invoice.createdAt) == year,
                            func.extract("month", Invoice.createdAt) == month,
                        )
                    ).count()
                    new_number = count + 1
            except (ValueError, IndexError):
                count = db.query(Invoice).filter(
                    and_(
                        Invoice.tenant_id == tenant_id,
                        func.extract("year", Invoice.createdAt) == year,
                        func.extract("month", Invoice.createdAt) == month,
                    )
                ).count()
                new_number = count + 1
        else:
            new_number = 1
        new_invoice_number = f"INV-{year}{month:02d}-{new_number:04d}"
        if not db.query(Invoice).filter(Invoice.invoiceNumber == new_invoice_number).first():
            return new_invoice_number
        if attempt >= 9:
            return f"INV-{year}{month:02d}-{int(time.time() * 1000) % 10000:04d}"
    return f"INV-{year}{month:02d}-{int(time.time() * 1000) % 10000:04d}"


def _calculate_totals(items: List[Dict], tax_rate: float, discount: float) -> dict:
    subtotal = sum(
        (x.get("quantity", 0) or 0) * (x.get("unitPrice", 0) or 0) for x in items
    )
    discount_amount = subtotal * (discount / 100) if discount > 0 else 0
    taxable = subtotal - discount_amount
    tax_amount = taxable * (tax_rate / 100) if tax_rate > 0 else 0
    return {
        "subtotal": round(subtotal, 2),
        "discountAmount": round(discount_amount, 2),
        "taxAmount": round(tax_amount, 2),
        "total": round(taxable + tax_amount, 2),
    }


def create_admission_invoice_handler(
    tenant_id: str,
    admission_id: str,
    line_items: List[Dict[str, Any]],
    created_by_user_id: str,
    db: Session,
    currency: str = "USD",
    tax_rate: float = 0.0,
    discount: float = 0.0,
):
    adm = get_admission_by_id(admission_id, db, tenant_id)
    if not adm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found"
        )
    if not line_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one line item is required",
        )
    patient = get_patient_by_id(str(adm.patient_id), db, tenant_id)
    customer_name = patient.full_name if patient else "Patient"
    customer_phone = patient.phone if patient else ""
    invoice_items = []
    for it in line_items:
        descr = (it.get("description") or "").strip()
        amount = float(it.get("amount", 0) or 0)
        if not descr:
            continue
        if amount < 0:
            amount = 0
        invoice_items.append(
            {
                "id": str(uuid.uuid4()),
                "description": descr,
                "quantity": 1,
                "unitPrice": amount,
                "discount": 0,
                "taxRate": 0,
                "taxAmount": 0,
                "total": amount,
                "productId": None,
                "productSku": "",
                "projectId": None,
                "taskId": None,
            }
        )
    if not invoice_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one valid line item (description and amount) is required",
        )
    totals = _calculate_totals(invoice_items, tax_rate, discount)
    issue_date = datetime.utcnow()
    due_date = issue_date + timedelta(days=30)
    invoice_number = _generate_invoice_number(tenant_id, db)
    invoice_data = {
        "id": str(uuid.uuid4()),
        "invoiceNumber": invoice_number,
        "tenant_id": tenant_id,
        "createdBy": created_by_user_id,
        "customerId": str(adm.patient_id),
        "customerName": customer_name,
        "customerEmail": "N/A",
        "customerPhone": customer_phone,
        "billingAddress": "",
        "shippingAddress": None,
        "issueDate": issue_date,
        "dueDate": due_date,
        "orderNumber": f"ADM-{admission_id}",
        "orderTime": issue_date,
        "paymentTerms": "Net 30",
        "currency": currency,
        "taxRate": tax_rate,
        "discount": discount,
        "notes": f"Invoice for admission from {adm.admit_date}",
        "terms": None,
        "status": "draft",
        "subtotal": totals["subtotal"],
        "discountAmount": totals["discountAmount"],
        "taxAmount": totals["taxAmount"],
        "total": totals["total"],
        "items": invoice_items,
        "paidAt": None,
        "sentAt": None,
        "totalPaid": 0.0,
        "balance": totals["total"],
    }
    inv = create_invoice(invoice_data, db)
    return inv
