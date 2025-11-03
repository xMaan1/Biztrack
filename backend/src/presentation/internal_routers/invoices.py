from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, text
from pydantic import BaseModel

from ...config.database import get_db
from ...presentation.dependencies.auth import get_current_user, get_tenant_context, require_permission
from ...models.unified_models import ModulePermission
from ...models.unified_models import (
    InvoiceCreate, InvoiceUpdate, InvoiceStatus,
    PaymentCreate, PaymentUpdate, PaymentStatus,
    InvoicesResponse, InvoiceResponse, PaymentsResponse, PaymentResponse,
    InvoiceDashboard, InvoiceMetrics, InvoiceFilters, PaymentFilters
)
from ...models.crm import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerStatsResponse
)
from ...config.database import User
from ...config.invoice_models import Invoice, Payment
from ...config.crm_crud import (
    create_customer, get_customer_by_id, get_customers, update_customer, delete_customer,
    get_customer_stats, search_customers
)
from ...services.inventory_sync_service import InventorySyncService
from ...services.email_service import EmailService

router = APIRouter(prefix="/invoices", tags=["Invoices"])

# Bulk operation models
class BulkOperationRequest(BaseModel):
    invoiceIds: List[str]

class BulkOperationResponse(BaseModel):
    message: str
    processed_count: int
    failed_count: int
    errors: List[str] = []

def generate_invoice_number(tenant_id: str, db: Session) -> str:
    """Generate unique invoice number with proper race condition handling"""
    year = datetime.now().year
    month = datetime.now().month
    
    # Use a retry mechanism to handle race conditions
    max_retries = 10
    for attempt in range(max_retries):
        # Get the highest invoice number for this month
        highest_invoice = db.query(Invoice).filter(
            and_(
                Invoice.tenant_id == tenant_id,
                func.extract('year', Invoice.createdAt) == year,
                func.extract('month', Invoice.createdAt) == month
            )
        ).order_by(desc(Invoice.invoiceNumber)).first()
        
        if highest_invoice:
            # Extract the number from the highest invoice
            try:
                # Parse the existing invoice number format: INV-YYYYMM-XXXX
                parts = highest_invoice.invoiceNumber.split('-')
                if len(parts) == 3:
                    last_number = int(parts[2])
                    new_number = last_number + 1
                else:
                    # Fallback: count all invoices for this month
                    count = db.query(Invoice).filter(
                        and_(
                            Invoice.tenant_id == tenant_id,
                            func.extract('year', Invoice.createdAt) == year,
                            func.extract('month', Invoice.createdAt) == month
                        )
                    ).count()
                    new_number = count + 1
            except (ValueError, IndexError):
                # Fallback: count all invoices for this month
                count = db.query(Invoice).filter(
                    and_(
                        Invoice.tenant_id == tenant_id,
                        func.extract('year', Invoice.createdAt) == year,
                        func.extract('month', Invoice.createdAt) == month
                    )
                ).count()
                new_number = count + 1
        else:
            # No invoices for this month yet
            new_number = 1
        
        # Generate the new invoice number
        new_invoice_number = f"INV-{year}{month:02d}-{new_number:04d}"
        
        # Check if this number already exists (double-check for race conditions)
        existing_invoice = db.query(Invoice).filter(
            Invoice.invoiceNumber == new_invoice_number
        ).first()
        
        if not existing_invoice:
            return new_invoice_number
        
        # If we get here, there's a race condition, retry
        if attempt < max_retries - 1:
            continue
        else:
            # If we've exhausted retries, use timestamp-based fallback
            import time
            timestamp = int(time.time() * 1000) % 10000  # Last 4 digits of timestamp
            return f"INV-{year}{month:02d}-{timestamp:04d}"
    
    # This should never be reached, but just in case
    import time
    timestamp = int(time.time() * 1000) % 10000
    return f"INV-{year}{month:02d}-{timestamp:04d}"

def calculate_invoice_totals(items: List, tax_rate: float, discount: float) -> dict:
    """Calculate invoice totals"""
    subtotal = 0
    for item in items:
        if isinstance(item, dict):
            subtotal += item.get('quantity', 0) * item.get('unitPrice', 0)
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
        "total": round(total, 2)
    }



# Bulk operation endpoints (must be before individual invoice endpoints to avoid routing conflicts)
@router.post("/bulk/send", response_model=BulkOperationResponse)
def bulk_send_invoices(
    request: BulkOperationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Send multiple invoices at once via email"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        processed_count = 0
        failed_count = 0
        errors = []
        
        # Initialize email service
        email_service = EmailService()
        
        # Prepare invoices for email sending
        invoices_to_send = []
        
        for invoice_id in request.invoiceIds:
            try:
                invoice = db.query(Invoice).filter(
                    and_(
                        Invoice.id == invoice_id,
                        Invoice.tenant_id == tenant_id
                    )
                ).first()
                
                if not invoice:
                    failed_count += 1
                    errors.append(f"Invoice {invoice_id} not found")
                    continue
                
                if invoice.status != InvoiceStatus.DRAFT:
                    failed_count += 1
                    errors.append(f"Invoice {invoice.invoiceNumber} is not in draft status")
                    continue
                
                # Prepare invoice data for email
                invoice_data = {
                    'customer_email': invoice.customerEmail,
                    'customer_name': invoice.customerName,
                    'invoice_number': invoice.invoiceNumber,
                    'total': invoice.total,
                    'currency': invoice.currency,
                    'due_date': invoice.dueDate.strftime('%Y-%m-%d') if invoice.dueDate else None,
                    'pdf_path': None  # Could be generated if needed
                }
                invoices_to_send.append(invoice_data)
                
            except Exception as e:
                failed_count += 1
                errors.append(f"Failed to prepare invoice {invoice_id}: {str(e)}")
        
        # Send emails
        if invoices_to_send:
            email_results = email_service.send_bulk_invoice_emails(invoices_to_send)
            
            # Update invoice statuses based on email results
            for i, invoice_id in enumerate(request.invoiceIds):
                try:
                    invoice = db.query(Invoice).filter(
                        and_(
                            Invoice.id == invoice_id,
                            Invoice.tenant_id == tenant_id
                        )
                    ).first()
                    
                    if invoice and invoice.status == InvoiceStatus.DRAFT:
                        invoice.status = InvoiceStatus.SENT
                        invoice.sentAt = datetime.utcnow()
                        invoice.updatedAt = datetime.utcnow()
                        processed_count += 1
                        
                except Exception as e:
                    failed_count += 1
                    errors.append(f"Failed to update invoice {invoice_id}: {str(e)}")
            
            # Add email errors to the error list
            errors.extend(email_results['errors'])
            
            # Update counts based on email results
            processed_count = email_results['sent']
            failed_count += email_results['failed']
        
        db.commit()
        
        return BulkOperationResponse(
            message=f"Bulk send completed. {processed_count} invoices sent successfully via email.",
            processed_count=processed_count,
            failed_count=failed_count,
            errors=errors
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to bulk send invoices: {str(e)}")

@router.post("/bulk/mark-as-paid", response_model=BulkOperationResponse)
def bulk_mark_invoices_as_paid(
    request: BulkOperationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Mark multiple invoices as paid at once"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        processed_count = 0
        failed_count = 0
        errors = []
        
        for invoice_id in request.invoiceIds:
            try:
                invoice = db.query(Invoice).filter(
                    and_(
                        Invoice.id == invoice_id,
                        Invoice.tenant_id == tenant_id
                    )
                ).first()
                
                if not invoice:
                    failed_count += 1
                    errors.append(f"Invoice {invoice_id} not found")
                    continue
                
                # Mark invoice as paid
                invoice.status = InvoiceStatus.PAID
                invoice.paidAt = datetime.utcnow()
                invoice.updatedAt = datetime.utcnow()
                processed_count += 1
                
                # Sync with inventory management
                try:
                    sync_service = InventorySyncService(db)
                    sync_result = sync_service.sync_invoice_with_inventory(
                        invoice_id=invoice_id,
                        tenant_id=tenant_id,
                        user_id=str(current_user.id)
                    )
                    
                    if not sync_result["success"]:
                        errors.append(f"Inventory sync failed for invoice {invoice.invoiceNumber}: {sync_result.get('error', 'Unknown error')}")
                        
                except Exception as sync_error:
                    errors.append(f"Inventory sync error for invoice {invoice.invoiceNumber}: {str(sync_error)}")
                
            except Exception as e:
                failed_count += 1
                errors.append(f"Failed to mark invoice {invoice_id} as paid: {str(e)}")
        
        db.commit()
        
        return BulkOperationResponse(
            message=f"Bulk mark as paid completed. {processed_count} invoices marked as paid.",
            processed_count=processed_count,
            failed_count=failed_count,
            errors=errors
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to bulk mark invoices as paid: {str(e)}")

@router.post("/bulk/mark-as-unpaid", response_model=BulkOperationResponse)
def bulk_mark_invoices_as_unpaid(
    request: BulkOperationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Mark multiple invoices as unpaid at once"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        processed_count = 0
        failed_count = 0
        errors = []
        
        for invoice_id in request.invoiceIds:
            try:
                invoice = db.query(Invoice).filter(
                    and_(
                        Invoice.id == invoice_id,
                        Invoice.tenant_id == tenant_id
                    )
                ).first()
                
                if not invoice:
                    failed_count += 1
                    errors.append(f"Invoice {invoice_id} not found")
                    continue
                
                # Mark invoice as unpaid (revert to sent status)
                invoice.status = InvoiceStatus.SENT
                invoice.paidAt = None
                invoice.updatedAt = datetime.utcnow()
                processed_count += 1
                
            except Exception as e:
                failed_count += 1
                errors.append(f"Failed to mark invoice {invoice_id} as unpaid: {str(e)}")
        
        db.commit()
        
        return BulkOperationResponse(
            message=f"Bulk mark as unpaid completed. {processed_count} invoices marked as unpaid.",
            processed_count=processed_count,
            failed_count=failed_count,
            errors=errors
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to bulk mark invoices as unpaid: {str(e)}")

@router.post("/bulk/delete", response_model=BulkOperationResponse)
def bulk_delete_invoices(
    request: BulkOperationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete multiple invoices at once"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        processed_count = 0
        failed_count = 0
        errors = []
        
        for invoice_id in request.invoiceIds:
            try:
                invoice = db.query(Invoice).filter(
                    and_(
                        Invoice.id == invoice_id,
                        Invoice.tenant_id == tenant_id
                    )
                ).first()
                
                if not invoice:
                    failed_count += 1
                    errors.append(f"Invoice {invoice_id} not found")
                    continue
                
                # Handle foreign key constraint by deleting related invoice_items first
                try:
                    check_items_query = text("""
                        SELECT COUNT(*) FROM information_schema.tables 
                        WHERE table_name = 'invoice_items'
                    """)
                    result = db.execute(check_items_query)
                    items_table_exists = result.fetchone()[0] > 0
                    
                    if items_table_exists:
                        delete_items_query = text("""
                            DELETE FROM invoice_items 
                            WHERE "invoiceId" = :invoice_id
                        """)
                        db.execute(delete_items_query, {"invoice_id": invoice_id})
                
                except Exception as items_error:
                    errors.append(f"Could not delete invoice items for {invoice.invoiceNumber}: {str(items_error)}")
                
                # Delete the invoice
                db.delete(invoice)
                processed_count += 1
                
            except Exception as e:
                failed_count += 1
                errors.append(f"Failed to delete invoice {invoice_id}: {str(e)}")
        
        db.commit()
        
        return BulkOperationResponse(
            message=f"Bulk delete completed. {processed_count} invoices deleted successfully.",
            processed_count=processed_count,
            failed_count=failed_count,
            errors=errors
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to bulk delete invoices: {str(e)}")

@router.post("/test-email")
def test_email_configuration(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Test email configuration"""
    try:
        email_service = EmailService()
        is_configured = email_service.test_email_connection()
        
        if is_configured:
            return {
                "message": "Email configuration is working correctly",
                "status": "success",
                "smtp_server": email_service.smtp_server,
                "smtp_port": email_service.smtp_port,
                "from_email": email_service.from_email
            }
        else:
            return {
                "message": "Email configuration is not working. Please check your SMTP settings.",
                "status": "error",
                "smtp_server": email_service.smtp_server,
                "smtp_port": email_service.smtp_port,
                "from_email": email_service.from_email,
                "note": "Set SMTP_USERNAME, SMTP_PASSWORD, and FROM_EMAIL environment variables"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to test email configuration: {str(e)}")

@router.post("/", response_model=InvoiceResponse)
def create_invoice(
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new invoice"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        # Validate required fields
        if not invoice_data.customerName:
            raise HTTPException(status_code=400, detail="Customer name is required")
        
        if not invoice_data.customerEmail:
            raise HTTPException(status_code=400, detail="Customer email is required")
        
        if not invoice_data.items or len(invoice_data.items) == 0:
            raise HTTPException(status_code=400, detail="At least one item is required")
        
        # Validate dates
        try:
            issue_date = datetime.fromisoformat(invoice_data.issueDate)
            due_date = datetime.fromisoformat(invoice_data.dueDate)
            if due_date < issue_date:
                raise HTTPException(status_code=400, detail="Due date cannot be before issue date")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
        
        # Generate invoice number with retry mechanism
        invoice_number = generate_invoice_number(tenant_id, db)
        
        # Calculate totals
        totals = calculate_invoice_totals(invoice_data.items, invoice_data.taxRate, invoice_data.discount)
        
        # Create invoice
        db_invoice = Invoice(
            id=str(uuid.uuid4()),
            invoiceNumber=invoice_number,
            tenant_id=tenant_id,
            createdBy=str(current_user.id),
            customerId=invoice_data.customerId or "",
            customerName=invoice_data.customerName,
            customerEmail=invoice_data.customerEmail,
            customerPhone="",  # Will be populated from customer record
            billingAddress=invoice_data.billingAddress or "",  # Use provided billing address or populate from customer record
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
            # Vehicle details for workshop invoices
            vehicleMake=invoice_data.vehicleMake,
            vehicleModel=invoice_data.vehicleModel,
            vehicleYear=invoice_data.vehicleYear,
            vehicleColor=invoice_data.vehicleColor,
            vehicleVin=invoice_data.vehicleVin,
            vehicleReg=invoice_data.vehicleReg,
            vehicleMileage=invoice_data.vehicleMileage,
            # Workshop specific fields
            jobDescription=invoice_data.jobDescription,
            partsDescription=invoice_data.partsDescription,
            labourTotal=invoice_data.labourTotal or 0.0,
            partsTotal=invoice_data.partsTotal or 0.0,
            **totals,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow()
        )
        
        # Create invoice items as JSON data
        invoice_items = []
        for item_data in invoice_data.items:
            # Validate item data
            if not item_data.description:
                raise HTTPException(status_code=400, detail="Item description is required")
            
            if item_data.quantity <= 0:
                raise HTTPException(status_code=400, detail="Item quantity must be greater than 0")
            
            if item_data.unitPrice < 0:
                raise HTTPException(status_code=400, detail="Item unit price cannot be negative")
            
            product_description = item_data.description
            product_unit_price = item_data.unitPrice
            product_sku = ""
            
            if item_data.productId:
                try:
                    from ...config.inventory_models import Product
                    product = db.query(Product).filter(
                        Product.id == item_data.productId,
                        Product.tenant_id == tenant_id
                    ).first()
                    
                    if product:
                        product_description = product.name
                        product_unit_price = product.unitPrice
                        product_sku = product.sku
                except Exception as e:
                    print(f"Warning: Could not fetch product details: {e}")
            
            # Calculate item total
            item_subtotal = item_data.quantity * product_unit_price
            item_discount = item_subtotal * (item_data.discount / 100) if item_data.discount > 0 else 0
            item_tax = (item_subtotal - item_discount) * (item_data.taxRate / 100) if item_data.taxRate > 0 else 0
            item_total = item_subtotal - item_discount + item_tax
            
            # Create item as dict with all required fields
            invoice_item = {
                "id": str(uuid.uuid4()),
                "description": product_description,
                "quantity": float(item_data.quantity),
                "unitPrice": float(product_unit_price),
                "discount": float(item_data.discount or 0),
                "taxRate": float(item_data.taxRate or 0),
                "taxAmount": round(item_tax, 2),
                "total": round(item_total, 2),
                "productId": item_data.productId,
                "productSku": product_sku,
                "projectId": item_data.projectId,
                "taskId": item_data.taskId
            }
            invoice_items.append(invoice_item)
        
        # Set the items
        db_invoice.items = invoice_items
        
        # Add to database
        # Populate customer details from customer record if customerId exists
        if invoice_data.customerId:
            try:
                from ...config.crm_crud import get_customer_by_id
                customer = get_customer_by_id(db, invoice_data.customerId, tenant_id)
                if customer:
                    db_invoice.customerPhone = customer.phone or ""
                    if not db_invoice.billingAddress:
                        db_invoice.billingAddress = customer.address or ""
                    # Add customer address fields for PDF generation
                    db_invoice.customerCity = customer.city or ""
                    db_invoice.customerState = customer.state or ""
                    db_invoice.customerPostalCode = customer.postalCode or ""
                    db_invoice.customerCountry = customer.country or ""
            except Exception as e:
                # If customer fetch fails, continue with empty values
                print(f"Warning: Could not fetch customer details: {e}")
        
        db.add(db_invoice)
        db.commit()
        db.refresh(db_invoice)
        
        # Create Account Receivable if invoice has unpaid balance
        if db_invoice.status != InvoiceStatus.DRAFT and db_invoice.balance > 0:
            try:
                from ...config.ledger_models import AccountReceivable, AccountReceivableStatus
                from datetime import datetime as dt
                
                # Check if Account Receivable already exists for this invoice
                existing_ar = db.query(AccountReceivable).filter(
                    and_(
                        AccountReceivable.tenant_id == tenant_id,
                        AccountReceivable.invoice_id == db_invoice.id
                    )
                ).first()
                
                if not existing_ar:
                    # Calculate days overdue
                    days_overdue = 0
                    if db_invoice.dueDate < dt.utcnow():
                        days_overdue = (dt.utcnow() - db_invoice.dueDate).days
                    
                    ar = AccountReceivable(
                        tenant_id=tenant_id,
                        invoice_id=db_invoice.id,
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
                        created_by=current_user.id
                    )
                    db.add(ar)
                    db.commit()
            except Exception as ar_error:
                # Don't fail invoice creation if AR creation fails
                print(f"Warning: Could not create Account Receivable: {str(ar_error)}")
        
        try:
            return InvoiceResponse(invoice=db_invoice)
        except Exception as validation_error:
            # Log the validation error for debugging
            print(f"Validation error in InvoiceResponse: {validation_error}")
            print(f"Invoice items: {db_invoice.items}")
            raise HTTPException(status_code=500, detail=f"Failed to create invoice response: {str(validation_error)}")
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating invoice: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create invoice: {str(e)}")

@router.get("/", response_model=InvoicesResponse)
def get_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    amount_from: Optional[float] = None,
    amount_to: Optional[float] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.SALES_VIEW.value))
):
    """Get invoices with filtering and pagination"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        query = db.query(Invoice).filter(Invoice.tenant_id == tenant_id)
        
        # Apply filters
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
            # Normalize search term by replacing multiple spaces with single space
            normalized_search = ' '.join(search.split())
            
            search_filter = or_(
                Invoice.invoiceNumber.ilike(f"%{normalized_search}%"),
                func.regexp_replace(Invoice.customerName, r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
                Invoice.customerEmail.ilike(f"%{normalized_search}%")
            )
            query = query.filter(search_filter)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        invoices = query.order_by(desc(Invoice.createdAt)).offset((page - 1) * limit).limit(limit).all()
        
        # Calculate pagination info
        pages = (total + limit - 1) // limit
        
        return InvoicesResponse(
            invoices=invoices,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch invoices: {str(e)}")

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific invoice by ID"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        invoice = db.query(Invoice).filter(
            and_(
                Invoice.id == invoice_id,
                Invoice.tenant_id == tenant_id
            )
        ).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        try:
            return InvoiceResponse(invoice=invoice)
        except Exception as validation_error:
            # Log the validation error for debugging
            print(f"Validation error in InvoiceResponse: {validation_error}")
            print(f"Invoice items: {invoice.items}")
            raise HTTPException(status_code=500, detail=f"Failed to create invoice response: {str(validation_error)}")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch invoice: {str(e)}")

@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: str,
    invoice_data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update an existing invoice"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        invoice = db.query(Invoice).filter(
            and_(
                Invoice.id == invoice_id,
                Invoice.tenant_id == tenant_id
            )
        ).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Check if invoice can be updated (only draft invoices can be updated)
        if invoice.status != InvoiceStatus.DRAFT:
            raise HTTPException(status_code=400, detail="Only draft invoices can be updated")
        
        # Update fields
        update_data = invoice_data.dict(exclude_unset=True)
        
        # Validate dates if provided
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
                # Validate items
                if len(value) == 0:
                    raise HTTPException(status_code=400, detail="At least one item is required")
                
                # Convert InvoiceItemCreate objects to JSON data
                converted_items = []
                for item_data in value:
                    # Handle both Pydantic objects and dictionaries
                    if isinstance(item_data, dict):
                        description = item_data.get('description', '')
                        quantity = item_data.get('quantity', 0)
                        unit_price = item_data.get('unitPrice', 0)
                        discount = item_data.get('discount', 0)
                        tax_rate = item_data.get('taxRate', 0)
                        product_id = item_data.get('productId')
                        project_id = item_data.get('projectId')
                        task_id = item_data.get('taskId')
                    else:
                        description = item_data.description
                        quantity = item_data.quantity
                        unit_price = item_data.unitPrice
                        discount = item_data.discount
                        tax_rate = item_data.taxRate
                        product_id = item_data.productId
                        project_id = item_data.projectId
                        task_id = item_data.taskId
                    
                    # Validate item data
                    if not description:
                        raise HTTPException(status_code=400, detail="Item description is required")
                    
                    if quantity <= 0:
                        raise HTTPException(status_code=400, detail="Item quantity must be greater than 0")
                    
                    if unit_price < 0:
                        raise HTTPException(status_code=400, detail="Item unit price cannot be negative")
                    
                    # Calculate item total
                    item_subtotal = quantity * unit_price
                    item_discount = item_subtotal * (discount / 100) if discount > 0 else 0
                    item_tax = (item_subtotal - item_discount) * (tax_rate / 100) if tax_rate > 0 else 0
                    item_total = item_subtotal - item_discount + item_tax
                    
                    # Create item as dict with all required fields
                    converted_item = {
                        "id": str(uuid.uuid4()),
                        "description": description,
                        "quantity": float(quantity),
                        "unitPrice": float(unit_price),
                        "discount": float(discount or 0),
                        "taxRate": float(tax_rate or 0),
                        "taxAmount": round(item_tax, 2),
                        "total": round(item_total, 2),
                        "productId": product_id,
                        "projectId": project_id,
                        "taskId": task_id
                    }
                    converted_items.append(converted_item)
                
                # Set the converted items
                invoice.items = converted_items
                
                # Recalculate invoice totals
                totals = calculate_invoice_totals(value, invoice.taxRate, invoice.discount)
                invoice.subtotal = totals["subtotal"]
                invoice.discountAmount = totals["discountAmount"]
                invoice.taxAmount = totals["taxAmount"]
                invoice.total = totals["total"]
            elif field == "orderTime" and value:
                # Convert orderTime string to datetime
                setattr(invoice, field, datetime.fromisoformat(value))
            elif field in ["labourTotal", "partsTotal"] and value is not None:
                # Handle workshop specific totals
                setattr(invoice, field, float(value))
            elif field in ["issueDate", "dueDate"] and value:
                # Convert date strings to datetime
                setattr(invoice, field, datetime.fromisoformat(value))
            else:
                setattr(invoice, field, value)
        
        invoice.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(invoice)
        
        try:
            return InvoiceResponse(invoice=invoice)
        except Exception as validation_error:
            # Log the validation error for debugging
            print(f"Validation error in InvoiceResponse: {validation_error}")
            print(f"Invoice items: {invoice.items}")
            raise HTTPException(status_code=500, detail=f"Failed to create invoice response: {str(validation_error)}")
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating invoice: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update invoice: {str(e)}")

@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete an invoice"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        invoice = db.query(Invoice).filter(
            and_(
                Invoice.id == invoice_id,
                Invoice.tenant_id == tenant_id
            )
        ).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Invoice can be deleted regardless of status or payments
        
        # Handle foreign key constraint by deleting related invoice_items first
        try:
            # Check if invoice_items table exists and has references
            check_items_query = text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name = 'invoice_items'
            """)
            result = db.execute(check_items_query)
            items_table_exists = result.fetchone()[0] > 0
            
            if items_table_exists:
                # Delete related invoice items first
                delete_items_query = text("""
                    DELETE FROM invoice_items 
                    WHERE "invoiceId" = :invoice_id
                """)
                db.execute(delete_items_query, {"invoice_id": invoice_id})
                print(f"🗑️  Deleted related invoice items for invoice {invoice_id}")
        
        except Exception as items_error:
            print(f"⚠️  Could not delete invoice items: {str(items_error)}")
            # Continue with invoice deletion - the constraint might not exist
        
        # Now delete the invoice
        db.delete(invoice)
        db.commit()
        
        return {"message": "Invoice deleted successfully"}
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting invoice: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete invoice: {str(e)}")

@router.post("/{invoice_id}/send")
def send_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Send invoice via email"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        invoice = db.query(Invoice).filter(
            and_(
                Invoice.id == invoice_id,
                Invoice.tenant_id == tenant_id
            )
        ).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        if invoice.status != InvoiceStatus.DRAFT:
            raise HTTPException(status_code=400, detail="Only draft invoices can be sent")
        
        # Send email
        email_service = EmailService()
        email_sent = email_service.send_invoice_email(
            to_email=invoice.customerEmail,
            customer_name=invoice.customerName,
            invoice_number=invoice.invoiceNumber,
            invoice_total=invoice.total,
            currency=invoice.currency,
            due_date=invoice.dueDate.strftime('%Y-%m-%d') if invoice.dueDate else None
        )
        
        if email_sent:
            invoice.status = InvoiceStatus.SENT
            invoice.sentAt = datetime.utcnow()
            invoice.updatedAt = datetime.utcnow()
            
            # Create Account Receivable when invoice is sent
            try:
                from ...config.ledger_models import AccountReceivable, AccountReceivableStatus
                from datetime import datetime as dt
                
                # Check if Account Receivable already exists for this invoice
                existing_ar = db.query(AccountReceivable).filter(
                    and_(
                        AccountReceivable.tenant_id == tenant_id,
                        AccountReceivable.invoice_id == invoice.id
                    )
                ).first()
                
                if not existing_ar:
                    # Calculate days overdue
                    days_overdue = 0
                    if invoice.dueDate < dt.utcnow():
                        days_overdue = (dt.utcnow() - invoice.dueDate).days
                    
                    ar = AccountReceivable(
                        tenant_id=tenant_id,
                        invoice_id=invoice.id,
                        invoice_number=invoice.invoiceNumber,
                        customer_id=invoice.customerId or "",
                        customer_name=invoice.customerName,
                        customer_email=invoice.customerEmail or "",
                        customer_phone=invoice.customerPhone,
                        invoice_date=invoice.issueDate,
                        due_date=invoice.dueDate,
                        invoice_amount=invoice.total,
                        amount_paid=0.0,
                        outstanding_balance=invoice.total,
                        currency=invoice.currency,
                        status=AccountReceivableStatus.PENDING if days_overdue == 0 else AccountReceivableStatus.OVERDUE,
                        payment_terms=invoice.paymentTerms,
                        notes=invoice.notes,
                        days_overdue=days_overdue,
                        created_by=current_user.id
                    )
                    db.add(ar)
            except Exception as ar_error:
                # Don't fail invoice sending if AR creation fails
                print(f"Warning: Could not create Account Receivable: {str(ar_error)}")
            
            db.commit()
            return {"message": "Invoice sent successfully via email"}
        else:
            return {"message": "Invoice prepared but email could not be sent. Please check email configuration."}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to send invoice: {str(e)}")

@router.post("/{invoice_id}/mark-as-paid")
def mark_invoice_as_paid(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Mark invoice as paid and sync with inventory"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        invoice = db.query(Invoice).filter(
            and_(
                Invoice.id == invoice_id,
                Invoice.tenant_id == tenant_id
            )
        ).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Mark invoice as paid
        invoice.status = InvoiceStatus.PAID
        invoice.paidAt = datetime.utcnow()
        invoice.updatedAt = datetime.utcnow()
        
        # Update Account Receivable if exists
        try:
            from ...config.ledger_models import AccountReceivable, AccountReceivableStatus
            existing_ar = db.query(AccountReceivable).filter(
                and_(
                    AccountReceivable.tenant_id == tenant_id,
                    AccountReceivable.invoice_id == invoice.id
                )
            ).first()
            
            if existing_ar:
                existing_ar.amount_paid = invoice.total
                existing_ar.outstanding_balance = 0
                existing_ar.status = AccountReceivableStatus.PAID
                existing_ar.days_overdue = 0
                existing_ar.updated_at = datetime.utcnow()
        except Exception as ar_error:
            # Don't fail invoice payment if AR update fails
            print(f"Warning: Could not update Account Receivable: {str(ar_error)}")
        
        db.commit()
        
        # Sync with inventory management
        try:
            sync_service = InventorySyncService(db)
            sync_result = sync_service.sync_invoice_with_inventory(
                invoice_id=invoice_id,
                tenant_id=tenant_id,
                user_id=str(current_user.id)
            )
            
            if sync_result["success"]:
                return {
                    "message": "Invoice marked as paid and inventory synced successfully",
                    "inventory_sync": {
                        "success": True,
                        "total_items_deducted": sync_result["total_items_deducted"],
                        "items_processed": sync_result["items_processed"]
                    }
                }
            else:
                # Log the error but don't fail the invoice payment
                print(f"Warning: Inventory sync failed for invoice {invoice_id}: {sync_result.get('error', 'Unknown error')}")
                return {
                    "message": "Invoice marked as paid, but inventory sync failed",
                    "inventory_sync": {
                        "success": False,
                        "error": sync_result.get("error", "Unknown error"),
                        "errors": sync_result.get("errors", [])
                    }
                }
                
        except Exception as sync_error:
            # Log the error but don't fail the invoice payment
            print(f"Warning: Inventory sync error for invoice {invoice_id}: {str(sync_error)}")
            return {
                "message": "Invoice marked as paid, but inventory sync encountered an error",
                "inventory_sync": {
                    "success": False,
                    "error": str(sync_error)
                }
            }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to mark invoice as paid: {str(e)}")

@router.get("/dashboard/overview", response_model=InvoiceDashboard)
def get_invoice_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get invoice dashboard overview"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        # Get basic metrics
        total_invoices = db.query(Invoice).filter(Invoice.tenant_id == tenant_id).count()
        paid_invoices = db.query(Invoice).filter(
            and_(
                Invoice.tenant_id == tenant_id,
                Invoice.status == InvoiceStatus.PAID
            )
        ).count()
        overdue_invoices = db.query(Invoice).filter(
            and_(
                Invoice.tenant_id == tenant_id,
                Invoice.status == InvoiceStatus.OVERDUE
            )
        ).count()
        draft_invoices = db.query(Invoice).filter(
            and_(
                Invoice.tenant_id == tenant_id,
                Invoice.status == InvoiceStatus.DRAFT
            )
        ).count()
        
        # Get financial metrics
        total_revenue = db.query(func.sum(Invoice.total)).filter(
            and_(
                Invoice.tenant_id == tenant_id,
                Invoice.status == InvoiceStatus.PAID
            )
        ).scalar() or 0
        
        outstanding_amount = db.query(func.sum(Invoice.total)).filter(
            and_(
                Invoice.tenant_id == tenant_id,
                Invoice.status.in_([InvoiceStatus.SENT, InvoiceStatus.VIEWED, InvoiceStatus.OVERDUE])
            )
        ).scalar() or 0
        
        overdue_amount = db.query(func.sum(Invoice.total)).filter(
            and_(
                Invoice.tenant_id == tenant_id,
                Invoice.status == InvoiceStatus.OVERDUE
            )
        ).scalar() or 0
        
        # Get recent invoices
        recent_invoices = db.query(Invoice).filter(
            Invoice.tenant_id == tenant_id
        ).order_by(desc(Invoice.createdAt)).limit(5).all()
        
        # Get overdue invoices
        overdue_invoices_list = db.query(Invoice).filter(
            and_(
                Invoice.tenant_id == tenant_id,
                Invoice.status == InvoiceStatus.OVERDUE
            )
        ).order_by(Invoice.dueDate).limit(5).all()
        
        # Get top customers
        top_customers = db.query(
            Invoice.customerName,
            func.sum(Invoice.total).label('total_amount'),
            func.count(Invoice.id).label('invoice_count')
        ).filter(
            Invoice.tenant_id == tenant_id
        ).group_by(Invoice.customerName).order_by(desc(func.sum(Invoice.total))).limit(5).all()
        
        # Get monthly revenue (last 6 months)
        monthly_revenue = []
        for i in range(6):
            date = datetime.now() - timedelta(days=30*i)
            month_start = date.replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            revenue = db.query(func.sum(Invoice.total)).filter(
                and_(
                    Invoice.tenant_id == tenant_id,
                    Invoice.status == InvoiceStatus.PAID,
                    Invoice.paidAt >= month_start,
                    Invoice.paidAt <= month_end
                )
            ).scalar() or 0
            
            monthly_revenue.append({
                "month": month_start.strftime("%Y-%m"),
                "revenue": float(revenue)
            })
        
        metrics = InvoiceMetrics(
            totalInvoices=total_invoices,
            paidInvoices=paid_invoices,
            overdueInvoices=overdue_invoices,
            draftInvoices=draft_invoices,
            totalRevenue=float(total_revenue),
            outstandingAmount=float(outstanding_amount),
            overdueAmount=float(overdue_amount),
            averagePaymentTime=30.0  # Placeholder
        )
        
        return InvoiceDashboard(
            metrics=metrics,
            recentInvoices=recent_invoices,
            overdueInvoices=overdue_invoices_list,
            topCustomers=[{"name": c.customerName, "amount": float(c.total_amount), "count": c.invoice_count} for c in top_customers],
            monthlyRevenue=monthly_revenue
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard: {str(e)}")

# Payment endpoints
@router.post("/{invoice_id}/payments", response_model=PaymentResponse)
def create_payment(
    invoice_id: str,
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a payment for an invoice"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        # Verify invoice exists and belongs to tenant
        invoice = db.query(Invoice).filter(
            and_(
                Invoice.id == invoice_id,
                Invoice.tenant_id == tenant_id
            )
        ).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Create payment
        db_payment = Payment(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            createdBy=str(current_user.id),
            invoiceId=invoice_id,
            amount=payment_data.amount,
            paymentMethod=payment_data.paymentMethod,
            paymentDate=payment_data.paymentDate,
            reference=payment_data.reference,
            notes=payment_data.notes,
            status=PaymentStatus.COMPLETED,
            processedAt=datetime.utcnow(),
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow()
        )
        
        db.add(db_payment)
        
        # Update invoice status and amounts
        invoice.totalPaid += payment_data.amount
        invoice.balance = invoice.total - invoice.totalPaid
        
        invoice_was_paid = False
        if invoice.balance <= 0:
            invoice.status = InvoiceStatus.PAID
            invoice.paidAt = datetime.utcnow()
            invoice_was_paid = True
        elif invoice.balance < invoice.total:
            invoice.status = InvoiceStatus.PARTIALLY_PAID
        
        invoice.updatedAt = datetime.utcnow()
        
        db.commit()
        db.refresh(db_payment)
        
        # Sync with inventory if invoice is now fully paid
        inventory_sync_result = None
        if invoice_was_paid:
            try:
                sync_service = InventorySyncService(db)
                sync_result = sync_service.sync_invoice_with_inventory(
                    invoice_id=invoice_id,
                    tenant_id=tenant_id,
                    user_id=str(current_user.id)
                )
                inventory_sync_result = sync_result
                
                if not sync_result["success"]:
                    print(f"Warning: Inventory sync failed for invoice {invoice_id}: {sync_result.get('error', 'Unknown error')}")
                    
            except Exception as sync_error:
                print(f"Warning: Inventory sync error for invoice {invoice_id}: {str(sync_error)}")
                inventory_sync_result = {"success": False, "error": str(sync_error)}
        
        response_data = {"payment": db_payment}
        if inventory_sync_result:
            response_data["inventory_sync"] = inventory_sync_result
        
        return PaymentResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create payment: {str(e)}")

@router.get("/{invoice_id}/payments", response_model=PaymentsResponse)
def get_invoice_payments(
    invoice_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get payments for a specific invoice"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        # Verify invoice exists and belongs to tenant
        invoice = db.query(Invoice).filter(
            and_(
                Invoice.id == invoice_id,
                Invoice.tenant_id == tenant_id
            )
        ).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Get payments
        query = db.query(Payment).filter(
            and_(
                Payment.invoiceId == invoice_id,
                Payment.tenant_id == tenant_id
            )
        )
        
        total = query.count()
        payments = query.order_by(desc(Payment.createdAt)).offset((page - 1) * limit).limit(limit).all()
        
        pages = (total + limit - 1) // limit
        
        return PaymentsResponse(
            payments=payments,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payments: {str(e)}")

@router.get("/payments/", response_model=PaymentsResponse)
def get_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    invoice_id: Optional[str] = None,
    payment_method: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all payments with filtering and pagination"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
            
        tenant_id = tenant_context["tenant_id"]
        
        query = db.query(Payment).filter(Payment.tenant_id == tenant_id)
        
        # Apply filters
        if invoice_id:
            query = query.filter(Payment.invoiceId == invoice_id)
        if payment_method:
            query = query.filter(Payment.paymentMethod == payment_method)
        if status:
            query = query.filter(Payment.status == status)
        if date_from:
            query = query.filter(Payment.paymentDate >= date_from)
        if date_to:
            query = query.filter(Payment.paymentDate <= date_to)
        if search:
            search_filter = or_(
                Payment.reference.contains(search),
                Payment.notes.contains(search)
            )
            query = query.filter(search_filter)
        
        total = query.count()
        payments = query.order_by(desc(Payment.createdAt)).offset((page - 1) * limit).limit(limit).all()
        
        pages = (total + limit - 1) // limit
        
        return PaymentsResponse(
            payments=payments,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payments: {str(e)}")

@router.get("/{invoice_id}/download")
def download_invoice_pdf(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Download invoice as PDF"""
    try:
        if not tenant_context:
            raise HTTPException(
                status_code=400, 
                detail="Tenant context required. Please include X-Tenant-ID header."
            )
            
        tenant_id = tenant_context["tenant_id"]
        
        # Get the invoice
        invoice = db.query(Invoice).filter(
            and_(
                Invoice.id == invoice_id,
                Invoice.tenant_id == tenant_id
            )
        ).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Generate beautiful modern PDF invoice
        from .pdf_generator_modern import generate_modern_invoice_pdf
        pdf_content = generate_modern_invoice_pdf(invoice, db)
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice-{invoice.invoiceNumber}.pdf"
            }
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        # Handle customization validation errors
        if "customization is required" in str(e):
            raise HTTPException(
                status_code=400, 
                detail="Invoice customization is required. Please customize your invoice template first using the 'Customize Invoice' button."
            )
        else:
            raise HTTPException(status_code=500, detail=f"Failed to generate invoice download: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate invoice download: {str(e)}")

# Customer endpoints - Delegating to CRM module for consistency
@router.post("/customers", response_model=CustomerResponse)
async def create_customer_endpoint(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new customer - delegates to CRM module"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
        customer = create_customer(db, customer_data.dict(), tenant_context["tenant_id"])
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
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get customers with optional filtering and search - delegates to CRM module"""
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
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get customer statistics - delegates to CRM module"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    stats = get_customer_stats(db, tenant_context["tenant_id"])
    return CustomerStatsResponse(**stats)

@router.get("/customers/search", response_model=List[CustomerResponse])
async def search_customers_endpoint(
    q: str = Query(..., min_length=1, description="Search term"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Search customers by name, ID, CNIC, phone, or email - delegates to CRM module"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    customers = search_customers(db, tenant_context["tenant_id"], q, limit)
    return [CustomerResponse.from_orm(customer) for customer in customers]

@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer_endpoint(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get customer by ID - delegates to CRM module"""
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
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update customer - delegates to CRM module"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    customer = update_customer(db, customer_id, customer_data.dict(exclude_unset=True), tenant_context["tenant_id"])
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerResponse.from_orm(customer)

@router.delete("/customers/{customer_id}")
async def delete_customer_endpoint(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete customer - delegates to CRM module"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    success = delete_customer(db, customer_id, tenant_context["tenant_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}
