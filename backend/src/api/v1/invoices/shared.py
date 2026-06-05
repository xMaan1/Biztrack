import json
import logging
import time
from datetime import datetime
from typing import List

from sqlalchemy import and_, desc, func
from sqlalchemy.orm import Session

from ....models.invoices import Invoice
from ..crm.customers.logic import get_customer_by_id
from ..crm.db_common import resolve_phone_from_customer
from .items.schemas import Invoice as PydanticInvoice, InvoiceItem

logger = logging.getLogger(__name__)


def resolve_invoice_customer_phone(db, tenant_id: str, invoice_data, customer=None) -> str:
    explicit = getattr(invoice_data, "customerPhone", None)
    if explicit and str(explicit).strip():
        return str(explicit).strip()
    if customer is None and getattr(invoice_data, "customerId", None):
        try:
            customer = get_customer_by_id(db, str(invoice_data.customerId), tenant_id)
        except Exception:
            customer = None
    if customer:
        return resolve_phone_from_customer(customer) or ""
    return ""


def generate_invoice_number(tenant_id: str, db: Session) -> str:
    year = datetime.now().year
    month = datetime.now().month
    max_retries = 10
    for attempt in range(max_retries):
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
                    last_number = int(parts[2])
                    new_number = last_number + 1
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
        existing_invoice = db.query(Invoice).filter(
            Invoice.invoiceNumber == new_invoice_number
        ).first()

        if not existing_invoice:
            return new_invoice_number

        if attempt < max_retries - 1:
            continue
        timestamp = int(time.time() * 1000) % 10000
        return f"INV-{year}{month:02d}-{timestamp:04d}"

    timestamp = int(time.time() * 1000) % 10000
    return f"INV-{year}{month:02d}-{timestamp:04d}"


def calculate_invoice_totals(items: List, tax_rate: float, discount: float) -> dict:
    subtotal = 0
    for item in items:
        if isinstance(item, dict):
            subtotal += item.get("quantity", 0) * item.get("unitPrice", 0)
        else:
            subtotal += item.quantity * item.unitPrice

    discount_amount = subtotal * (discount / 100) if discount > 0 else 0
    taxable_amount = subtotal - discount_amount
    tax_amount = taxable_amount * (tax_rate / 100) if tax_rate > 0 else 0
    total = taxable_amount + tax_amount

    return {
        "subtotal": round(subtotal, 2),
        "discountAmount": round(discount_amount, 2),
        "taxAmount": round(tax_amount, 2),
        "total": round(total, 2),
    }


def transform_invoice_to_pydantic(db_invoice: Invoice):
    invoice_items = []
    if db_invoice.items:
        if isinstance(db_invoice.items, str):
            items_data = json.loads(db_invoice.items)
        else:
            items_data = db_invoice.items

        for item in items_data:
            if isinstance(item, dict):
                invoice_items.append(
                    InvoiceItem(
                        id=str(item.get("id", "")),
                        description=item.get("description", ""),
                        quantity=item.get("quantity", 0),
                        unitPrice=item.get("unitPrice", 0),
                        discount=item.get("discount", 0),
                        taxRate=item.get("taxRate", 0),
                        taxAmount=item.get("taxAmount", 0),
                        total=item.get("total", 0),
                        unit=item.get("unit"),
                        productId=str(item.get("productId")) if item.get("productId") else None,
                        projectId=str(item.get("projectId")) if item.get("projectId") else None,
                        taskId=str(item.get("taskId")) if item.get("taskId") else None,
                    )
                )

    payments = []
    if db_invoice.payments:
        if isinstance(db_invoice.payments, str):
            payments = json.loads(db_invoice.payments)
        else:
            payments = db_invoice.payments

    return PydanticInvoice(
        id=str(db_invoice.id),
        tenant_id=str(db_invoice.tenant_id),
        invoiceNumber=db_invoice.invoiceNumber,
        customerId=str(db_invoice.customerId) if db_invoice.customerId else "",
        customerName=db_invoice.customerName,
        customerEmail=db_invoice.customerEmail or "",
        customerPhone=db_invoice.customerPhone,
        billingAddress=db_invoice.billingAddress,
        shippingAddress=db_invoice.shippingAddress,
        issueDate=db_invoice.issueDate,
        dueDate=db_invoice.dueDate,
        orderNumber=db_invoice.orderNumber,
        orderTime=db_invoice.orderTime,
        paymentTerms=db_invoice.paymentTerms,
        currency=db_invoice.currency,
        subtotal=db_invoice.subtotal,
        taxRate=db_invoice.taxRate,
        taxAmount=db_invoice.taxAmount,
        discount=db_invoice.discount,
        total=db_invoice.total,
        notes=db_invoice.notes,
        terms=db_invoice.terms,
        status=db_invoice.status,
        items=invoice_items,
        createdBy=str(db_invoice.createdBy),
        opportunityId=str(db_invoice.opportunityId) if db_invoice.opportunityId else None,
        quoteId=str(db_invoice.quoteId) if db_invoice.quoteId else None,
        projectId=str(db_invoice.projectId) if db_invoice.projectId else None,
        sentAt=getattr(db_invoice, "sentAt", None),
        viewedAt=getattr(db_invoice, "viewedAt", None),
        paidAt=getattr(db_invoice, "paidAt", None),
        overdueAt=getattr(db_invoice, "overdueAt", None),
        createdAt=db_invoice.createdAt,
        updatedAt=db_invoice.updatedAt,
        payments=payments,
        totalPaid=db_invoice.totalPaid if hasattr(db_invoice, "totalPaid") else 0.0,
        balance=db_invoice.balance if hasattr(db_invoice, "balance") else 0.0,
        daysOverdue=db_invoice.daysOverdue if hasattr(db_invoice, "daysOverdue") else 0,
        vehicleMake=db_invoice.vehicleMake,
        vehicleModel=db_invoice.vehicleModel,
        vehicleYear=db_invoice.vehicleYear,
        vehicleColor=db_invoice.vehicleColor,
        vehicleVin=db_invoice.vehicleVin,
        vehicleReg=db_invoice.vehicleReg,
        vehicleMileage=db_invoice.vehicleMileage,
        documentNo=db_invoice.documentNo,
        jobDescription=db_invoice.jobDescription,
        partsDescription=db_invoice.partsDescription,
        labourTotal=db_invoice.labourTotal,
        partsTotal=db_invoice.partsTotal,
    )
