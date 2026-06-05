import logging
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy import and_, or_, func, desc
from sqlalchemy.orm import Session

from .....config.database import User
from .....models.invoices import Invoice
from .....core.plan_types import is_retail_plan
from ...crm.customers.logic import get_customer_by_id
from ...crm.db_common import resolve_phone_from_customer
from ..db_common import delete_invoice_dependencies
from ..shared import (
    generate_invoice_number,
    calculate_invoice_totals,
    transform_invoice_to_pydantic,
    resolve_invoice_customer_phone,
)
from .schemas import (
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceStatus,
    InvoiceResponse,
    InvoicesResponse,
)

logger = logging.getLogger(__name__)


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
        Invoice.status.in_(["sent", "draft"]),
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


def get_invoices(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Invoice]:
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


def create_invoice_endpoint(
    invoice_data: InvoiceCreate,
    db: Session,
    current_user: User,
    tenant_context: dict,
):
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = tenant_context["tenant_id"]
        is_commerce_plan = is_retail_plan(str(tenant_context.get("plan_type", "")))

        if not invoice_data.customerName:
            raise HTTPException(status_code=400, detail="Customer name is required")

        if not invoice_data.items or len(invoice_data.items) == 0:
            raise HTTPException(status_code=400, detail="At least one item is required")

        try:
            issue_date = datetime.fromisoformat(invoice_data.issueDate)
            due_date = datetime.fromisoformat(invoice_data.dueDate)
            if due_date < issue_date:
                raise HTTPException(status_code=400, detail="Due date cannot be before issue date")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")

        invoice_number = generate_invoice_number(tenant_id, db)
        totals = calculate_invoice_totals(invoice_data.items, invoice_data.taxRate, invoice_data.discount)

        db_invoice = Invoice(
            id=str(uuid.uuid4()),
            invoiceNumber=invoice_number,
            tenant_id=tenant_id,
            createdBy=str(current_user.id),
            customerId=invoice_data.customerId or "",
            customerName=invoice_data.customerName,
            customerEmail=invoice_data.customerEmail or "",
            customerPhone=resolve_invoice_customer_phone(db, tenant_id, invoice_data),
            billingAddress=invoice_data.billingAddress or "",
            shippingAddress=invoice_data.shippingAddress,
            issueDate=issue_date,
            dueDate=due_date,
            orderNumber=invoice_data.orderNumber,
            orderTime=datetime.fromisoformat(invoice_data.orderTime) if invoice_data.orderTime else None,
            paymentTerms=invoice_data.paymentTerms,
            currency=invoice_data.currency,
            taxRate=invoice_data.taxRate,
            discount=invoice_data.discount,
            notes=invoice_data.notes,
            terms=invoice_data.terms,
            opportunityId=invoice_data.opportunityId,
            quoteId=invoice_data.quoteId,
            projectId=invoice_data.projectId,
            vehicleMake=invoice_data.vehicleMake,
            vehicleModel=invoice_data.vehicleModel,
            vehicleYear=invoice_data.vehicleYear,
            vehicleColor=invoice_data.vehicleColor,
            vehicleVin=invoice_data.vehicleVin,
            vehicleReg=invoice_data.vehicleReg,
            vehicleMileage=invoice_data.vehicleMileage,
            jobDescription=invoice_data.jobDescription,
            partsDescription=invoice_data.partsDescription,
            labourTotal=invoice_data.labourTotal or 0.0,
            partsTotal=invoice_data.partsTotal or 0.0,
            **totals,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow(),
        )

        invoice_items = []
        for item_data in invoice_data.items:
            if not item_data.description:
                raise HTTPException(status_code=400, detail="Item description is required")
            if item_data.quantity <= 0:
                raise HTTPException(status_code=400, detail="Item quantity must be greater than 0")
            if item_data.unitPrice < 0:
                raise HTTPException(status_code=400, detail="Item unit price cannot be negative")
            if is_commerce_plan and not item_data.productId:
                raise HTTPException(status_code=400, detail="Product is required for commerce invoices")

            product_description = item_data.description
            product_unit_price = item_data.unitPrice
            product_sku = ""
            item_unit = item_data.unit or "piece"

            if item_data.productId:
                try:
                    from .....config.inventory_models import Product

                    product = db.query(Product).filter(
                        Product.id == item_data.productId,
                        Product.tenant_id == tenant_id,
                    ).first()
                    if product:
                        product_description = product.name
                        product_unit_price = product.unitPrice
                        product_sku = product.sku
                        if not item_data.unit and product.unit:
                            item_unit = product.unit
                    else:
                        raise HTTPException(status_code=400, detail="Invalid product selected")
                except Exception as e:
                    if isinstance(e, HTTPException):
                        raise
                    raise HTTPException(status_code=400, detail="Invalid product selected")

            item_subtotal = item_data.quantity * product_unit_price
            item_discount = item_subtotal * (item_data.discount / 100) if item_data.discount > 0 else 0
            item_tax = (item_subtotal - item_discount) * (item_data.taxRate / 100) if item_data.taxRate > 0 else 0
            item_total = item_subtotal - item_discount + item_tax

            invoice_items.append({
                "id": str(uuid.uuid4()),
                "description": product_description,
                "quantity": float(item_data.quantity),
                "unitPrice": float(product_unit_price),
                "discount": float(item_data.discount or 0),
                "taxRate": float(item_data.taxRate or 0),
                "taxAmount": round(item_tax, 2),
                "total": round(item_total, 2),
                "unit": item_unit,
                "productId": item_data.productId,
                "productSku": product_sku,
                "projectId": item_data.projectId,
                "taskId": item_data.taskId,
            })

        db_invoice.items = invoice_items

        if invoice_data.customerId:
            try:
                customer = get_customer_by_id(db, invoice_data.customerId, tenant_id)
                if customer:
                    if not db_invoice.customerPhone:
                        db_invoice.customerPhone = resolve_invoice_customer_phone(
                            db, tenant_id, invoice_data, customer
                        )
                    if not db_invoice.billingAddress:
                        db_invoice.billingAddress = customer.address or ""
                    db_invoice.customerCity = customer.city or ""
                    db_invoice.customerState = customer.state or ""
                    db_invoice.customerPostalCode = customer.postalCode or ""
                    db_invoice.customerCountry = customer.country or ""
            except Exception as e:
                print(f"Warning: Could not fetch customer details: {e}")

        db.add(db_invoice)
        db.commit()
        db.refresh(db_invoice)

        if db_invoice.status != InvoiceStatus.DRAFT and db_invoice.balance > 0:
            try:
                from .....config.ledger_models import AccountReceivable, AccountReceivableStatus
                from datetime import datetime as dt

                existing_ar = db.query(AccountReceivable).filter(
                    and_(
                        AccountReceivable.tenant_id == tenant_id,
                        AccountReceivable.invoice_id == str(db_invoice.id),
                    )
                ).first()

                if not existing_ar:
                    days_overdue = 0
                    if db_invoice.dueDate < dt.utcnow():
                        days_overdue = (dt.utcnow() - db_invoice.dueDate).days

                    ar = AccountReceivable(
                        tenant_id=tenant_id,
                        invoice_id=str(db_invoice.id),
                        invoice_number=db_invoice.invoiceNumber,
                        customer_id=db_invoice.customerId or "",
                        customer_name=db_invoice.customerName,
                        customer_email=db_invoice.customerEmail or "",
                        customer_phone=db_invoice.customerPhone,
                        invoice_date=db_invoice.issueDate,
                        due_date=db_invoice.dueDate,
                        invoice_amount=db_invoice.total,
                        amount_paid=db_invoice.totalPaid or 0.0,
                        outstanding_balance=db_invoice.total,
                        currency=db_invoice.currency,
                        status=AccountReceivableStatus.PENDING if days_overdue == 0 else AccountReceivableStatus.OVERDUE,
                        payment_terms=db_invoice.paymentTerms,
                        notes=db_invoice.notes,
                        days_overdue=days_overdue,
                        created_by=current_user.id,
                    )
                    db.add(ar)
                    db.commit()
            except Exception as ar_error:
                print(f"Warning: Could not create Account Receivable: {str(ar_error)}")

        try:
            pydantic_invoice = transform_invoice_to_pydantic(db_invoice)
            return InvoiceResponse(invoice=pydantic_invoice)
        except Exception as validation_error:
            logger.error(f"Validation error in InvoiceResponse: {validation_error}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to create invoice response: {str(validation_error)}")

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating invoice: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create invoice: {str(e)}")


def get_invoices_endpoint(
    db: Session,
    current_user: User,
    tenant_context: dict,
    page: int,
    limit: int,
    status: Optional[str],
    customer_id: Optional[str],
    date_from: Optional[str],
    date_to: Optional[str],
    amount_from: Optional[float],
    amount_to: Optional[float],
    search: Optional[str],
):
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = tenant_context["tenant_id"]
        query = db.query(Invoice).filter(Invoice.tenant_id == tenant_id)

        if status:
            query = query.filter(Invoice.status == status)
        if customer_id:
            query = query.filter(Invoice.customerId == customer_id)
        if date_from:
            query = query.filter(Invoice.issueDate >= date_from)
        if date_to:
            query = query.filter(Invoice.issueDate <= date_to)
        if amount_from:
            query = query.filter(Invoice.total >= amount_from)
        if amount_to:
            query = query.filter(Invoice.total <= amount_to)
        if search:
            normalized_search = " ".join(search.split())
            search_filter = or_(
                Invoice.invoiceNumber.ilike(f"%{normalized_search}%"),
                func.regexp_replace(Invoice.customerName, r"\s+", " ", "g").ilike(f"%{normalized_search}%"),
                Invoice.customerEmail.ilike(f"%{normalized_search}%"),
                Invoice.vehicleReg.ilike(f"%{normalized_search}%"),
            )
            query = query.filter(search_filter)

        total = query.count()
        db_invoices = query.order_by(desc(Invoice.createdAt)).offset((page - 1) * limit).limit(limit).all()
        invoices = [transform_invoice_to_pydantic(inv) for inv in db_invoices]
        pages = (total + limit - 1) // limit

        return InvoicesResponse(
            invoices=invoices,
            pagination={"page": page, "limit": limit, "total": total, "pages": pages},
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch invoices: {str(e)}")


def get_invoice_endpoint(invoice_id: str, db: Session, current_user: User, tenant_context: dict):
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = tenant_context["tenant_id"]
        invoice = db.query(Invoice).filter(
            and_(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
        ).first()

        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

        try:
            pydantic_invoice = transform_invoice_to_pydantic(invoice)
            return InvoiceResponse(invoice=pydantic_invoice)
        except Exception as validation_error:
            logger.error(f"Validation error in InvoiceResponse: {validation_error}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to create invoice response: {str(validation_error)}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch invoice: {str(e)}")


def update_invoice_endpoint(
    invoice_id: str,
    invoice_data: InvoiceUpdate,
    db: Session,
    current_user: User,
    tenant_context: dict,
):
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = tenant_context["tenant_id"]
        is_commerce_plan = is_retail_plan(str(tenant_context.get("plan_type", "")))

        invoice = db.query(Invoice).filter(
            and_(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
        ).first()

        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

        if invoice.status != InvoiceStatus.DRAFT:
            raise HTTPException(status_code=400, detail="Only draft invoices can be updated")

        update_data = invoice_data.dict(exclude_unset=True)

        if "issueDate" in update_data:
            try:
                issue_date = datetime.fromisoformat(update_data["issueDate"])
                if "dueDate" in update_data:
                    due_date = datetime.fromisoformat(update_data["dueDate"])
                else:
                    due_date = invoice.dueDate
                if due_date < issue_date:
                    raise HTTPException(status_code=400, detail="Due date cannot be before issue date")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format")

        for field, value in update_data.items():
            if field == "items" and value:
                if len(value) == 0:
                    raise HTTPException(status_code=400, detail="At least one item is required")

                converted_items = []
                for item_data in value:
                    if isinstance(item_data, dict):
                        description = item_data.get("description", "")
                        quantity = item_data.get("quantity", 0)
                        unit_price = item_data.get("unitPrice", 0)
                        discount = item_data.get("discount", 0)
                        tax_rate = item_data.get("taxRate", 0)
                        unit = item_data.get("unit")
                        product_id = item_data.get("productId")
                        project_id = item_data.get("projectId")
                        task_id = item_data.get("taskId")
                    else:
                        description = item_data.description
                        quantity = item_data.quantity
                        unit_price = item_data.unitPrice
                        discount = item_data.discount
                        tax_rate = item_data.taxRate
                        unit = item_data.unit
                        product_id = item_data.productId
                        project_id = item_data.projectId
                        task_id = item_data.taskId

                    if not description:
                        raise HTTPException(status_code=400, detail="Item description is required")
                    if quantity <= 0:
                        raise HTTPException(status_code=400, detail="Item quantity must be greater than 0")
                    if unit_price < 0:
                        raise HTTPException(status_code=400, detail="Item unit price cannot be negative")
                    if is_commerce_plan and not product_id:
                        raise HTTPException(status_code=400, detail="Product is required for commerce invoices")

                    item_unit = unit or "piece"
                    if product_id:
                        from .....config.inventory_models import Product

                        product = db.query(Product).filter(
                            Product.id == product_id,
                            Product.tenant_id == tenant_id,
                        ).first()
                        if not product:
                            raise HTTPException(status_code=400, detail="Invalid product selected")
                        if not unit and product.unit:
                            item_unit = product.unit

                    item_subtotal = quantity * unit_price
                    item_discount = item_subtotal * (discount / 100) if discount > 0 else 0
                    item_tax = (item_subtotal - item_discount) * (tax_rate / 100) if tax_rate > 0 else 0
                    item_total = item_subtotal - item_discount + item_tax

                    converted_items.append({
                        "id": str(uuid.uuid4()),
                        "description": description,
                        "quantity": float(quantity),
                        "unitPrice": float(unit_price),
                        "discount": float(discount or 0),
                        "taxRate": float(tax_rate or 0),
                        "taxAmount": round(item_tax, 2),
                        "total": round(item_total, 2),
                        "unit": item_unit,
                        "productId": product_id,
                        "projectId": project_id,
                        "taskId": task_id,
                    })

                invoice.items = converted_items
                totals = calculate_invoice_totals(value, invoice.taxRate, invoice.discount)
                invoice.subtotal = totals["subtotal"]
                invoice.discountAmount = totals["discountAmount"]
                invoice.taxAmount = totals["taxAmount"]
                invoice.total = totals["total"]
            elif field == "orderTime" and value:
                setattr(invoice, field, datetime.fromisoformat(value))
            elif field in ["labourTotal", "partsTotal"] and value is not None:
                setattr(invoice, field, float(value))
            elif field in ["issueDate", "dueDate"] and value:
                setattr(invoice, field, datetime.fromisoformat(value))
            else:
                setattr(invoice, field, value)

        if update_data.get("customerId") and not update_data.get("customerPhone"):
            try:
                customer = get_customer_by_id(db, str(update_data["customerId"]), tenant_id)
                resolved = resolve_phone_from_customer(customer)
                if resolved:
                    invoice.customerPhone = resolved
            except Exception:
                pass

        invoice.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(invoice)

        try:
            pydantic_invoice = transform_invoice_to_pydantic(invoice)
            return InvoiceResponse(invoice=pydantic_invoice)
        except Exception as validation_error:
            logger.error(f"Validation error in InvoiceResponse: {validation_error}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to create invoice response: {str(validation_error)}")

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating invoice: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update invoice: {str(e)}")


def delete_invoice_endpoint(invoice_id: str, db: Session, current_user: User, tenant_context: dict):
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = tenant_context["tenant_id"]
        invoice = db.query(Invoice).filter(
            and_(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
        ).first()

        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

        delete_invoice_dependencies(db, invoice_id, tenant_id)
        db.delete(invoice)
        db.commit()

        return {"message": "Invoice deleted successfully"}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error("Error deleting invoice: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete invoice: {str(e)}")
