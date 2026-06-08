import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ....api.v1.invoices.items.logic import create_invoice


def line_items_from_healthcare_input(line_items: List[Dict[str, Any]]) -> List[dict]:
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
    return invoice_items


def calculate_invoice_totals(items: List[Dict], tax_rate: float, discount: float) -> dict:
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


def generate_invoice_number(tenant_id: str, db: Session) -> str:
    from .....api.v1.invoices.shared import generate_invoice_number as shared_generate_invoice_number

    return shared_generate_invoice_number(tenant_id, db)


def build_draft_invoice_payload(
    *,
    tenant_id: str,
    created_by_user_id: str,
    order_number: str,
    customer_id: str,
    customer_name: str,
    customer_phone: str,
    notes: str,
    invoice_items: List[dict],
    totals: dict,
    currency: str,
    tax_rate: float,
    discount: float,
    db: Session,
) -> dict:
    issue_date = datetime.utcnow()
    due_date = issue_date + timedelta(days=30)
    invoice_number = generate_invoice_number(tenant_id, db)
    return {
        "id": str(uuid.uuid4()),
        "invoiceNumber": invoice_number,
        "tenant_id": tenant_id,
        "createdBy": created_by_user_id,
        "customerId": customer_id,
        "customerName": customer_name,
        "customerEmail": "N/A",
        "customerPhone": customer_phone,
        "billingAddress": "",
        "shippingAddress": None,
        "issueDate": issue_date,
        "dueDate": due_date,
        "orderNumber": order_number,
        "orderTime": issue_date,
        "paymentTerms": "Net 30",
        "currency": currency,
        "taxRate": tax_rate,
        "discount": discount,
        "notes": notes,
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


def create_healthcare_draft_invoice(
    tenant_id: str,
    line_items: List[Dict[str, Any]],
    created_by_user_id: str,
    db: Session,
    *,
    order_number: str,
    customer_id: str,
    customer_name: str,
    customer_phone: str,
    notes: str,
    currency: str = "USD",
    tax_rate: float = 0.0,
    discount: float = 0.0,
):
    if not line_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one line item is required",
        )
    invoice_items = line_items_from_healthcare_input(line_items)
    totals = calculate_invoice_totals(invoice_items, tax_rate, discount)
    payload = build_draft_invoice_payload(
        tenant_id=tenant_id,
        created_by_user_id=created_by_user_id,
        order_number=order_number,
        customer_id=customer_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        notes=notes,
        invoice_items=invoice_items,
        totals=totals,
        currency=currency,
        tax_rate=tax_rate,
        discount=discount,
        db=db,
    )
    return create_invoice(payload, db)
