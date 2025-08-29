from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, text
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO

from ...config.database import get_db
from ...api.dependencies import get_current_user, get_tenant_context
from ...models.unified_models import (
    InvoiceCreate, InvoiceUpdate, InvoiceStatus,
    PaymentCreate, PaymentUpdate, PaymentStatus,
    InvoicesResponse, InvoiceResponse, PaymentsResponse, PaymentResponse,
    InvoiceDashboard, InvoiceMetrics, InvoiceFilters, PaymentFilters
)
from ...config.database import User, Invoice, Payment

router = APIRouter(prefix="/invoices", tags=["Invoices"])

def generate_invoice_number(tenant_id: str, db: Session) -> str:
    """Generate unique invoice number"""
    year = datetime.now().year
    month = datetime.now().month
    
    # Get count of invoices for this month
    count = db.query(Invoice).filter(
        and_(
            Invoice.tenant_id == tenant_id,
            func.extract('year', Invoice.createdAt) == year,
            func.extract('month', Invoice.createdAt) == month
        )
    ).count()
    
    return f"INV-{year}{month:02d}-{(count + 1):04d}"

def calculate_invoice_totals(items: List, tax_rate: float, discount: float) -> dict:
    """Calculate invoice totals"""
    subtotal = sum(item.quantity * item.unitPrice for item in items)
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

def generate_invoice_pdf(invoice) -> bytes:
    """Generate a beautiful PDF invoice"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.darkblue,
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.darkblue,
        spaceAfter=10
    )
    
    normal_style = styles['Normal']
    
    # Title
    story.append(Paragraph("INVOICE", title_style))
    story.append(Spacer(1, 20))
    
    # Invoice header table
    header_data = [
        ['Invoice Number:', invoice.invoiceNumber, 'Issue Date:', invoice.issueDate.strftime('%Y-%m-%d')],
        ['Order Number:', invoice.orderNumber or 'N/A', 'Due Date:', invoice.dueDate.strftime('%Y-%m-%d')],
        ['Status:', invoice.status, 'Currency:', invoice.currency or 'USD']
    ]
    
    header_table = Table(header_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('BACKGROUND', (2, 0), (2, -1), colors.lightgrey),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 20))
    
    # Customer information
    story.append(Paragraph("Customer Information", heading_style))
    customer_data = [
        ['Name:', invoice.customerName],
        ['Email:', invoice.customerEmail],
        ['Phone:', invoice.customerPhone or 'N/A'],
        ['Billing Address:', invoice.billingAddress or 'N/A']
    ]
    
    customer_table = Table(customer_data, colWidths=[1.5*inch, 5*inch])
    customer_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
    ]))
    story.append(customer_table)
    story.append(Spacer(1, 20))
    
    # Items table
    if invoice.items:
        story.append(Paragraph("Invoice Items", heading_style))
        
        # Table headers
        items_data = [['Description', 'Quantity', 'Unit Price', 'Total']]
        
        # Add items
        for item in invoice.items:
            items_data.append([
                item.get('description', 'N/A'),
                str(item.get('quantity', 0)),
                f"${item.get('unitPrice', 0):.2f}",
                f"${item.get('total', 0):.2f}"
            ])
        
        items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
        items_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 20))
    
    # Totals table
    story.append(Paragraph("Invoice Summary", heading_style))
    totals_data = [
        ['Subtotal:', f"${invoice.subtotal:.2f}"],
        ['Tax Rate:', f"{invoice.taxRate}%"],
        ['Tax Amount:', f"${invoice.taxAmount:.2f}"],
        ['Discount:', f"{invoice.discount}%"],
        ['Total:', f"${invoice.total:.2f}"]
    ]
    
    totals_table = Table(totals_data, colWidths=[2*inch, 1.5*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (-1, -1), (-1, -1), colors.lightgreen),
        ('FONTNAME', (-1, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (-1, -1), (-1, -1), 14),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 20))
    
    # Notes and terms
    if invoice.notes:
        story.append(Paragraph("Notes", heading_style))
        story.append(Paragraph(invoice.notes, normal_style))
        story.append(Spacer(1, 15))
    
    if invoice.terms:
        story.append(Paragraph("Terms & Conditions", heading_style))
        story.append(Paragraph(invoice.terms, normal_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

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
        
        # Generate invoice number
        invoice_number = generate_invoice_number(tenant_id, db)
        
        # Calculate totals
        totals = calculate_invoice_totals(invoice_data.items, invoice_data.taxRate, invoice_data.discount)
        
        # Create invoice
        db_invoice = Invoice(
            id=str(uuid.uuid4()),
            invoiceNumber=invoice_number,
            tenant_id=tenant_id,
            createdBy=str(current_user.id),
            customerId=invoice_data.customerId,
            customerName=invoice_data.customerName,
            customerEmail=invoice_data.customerEmail,
            customerPhone=invoice_data.customerPhone,  # New field
            billingAddress=invoice_data.billingAddress,
            shippingAddress=invoice_data.shippingAddress,
            issueDate=invoice_data.issueDate,
            dueDate=invoice_data.dueDate,
            orderNumber=invoice_data.orderNumber,  # New field
            orderTime=datetime.fromisoformat(invoice_data.orderTime) if invoice_data.orderTime else None,  # New field
            paymentTerms=invoice_data.paymentTerms,
            currency=invoice_data.currency,
            taxRate=invoice_data.taxRate,
            discount=invoice_data.discount,
            notes=invoice_data.notes,
            terms=invoice_data.terms,
            opportunityId=invoice_data.opportunityId,
            quoteId=invoice_data.quoteId,
            projectId=invoice_data.projectId,
            **totals,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow()
        )
        
        # Create invoice items as JSON data
        invoice_items = []
        for item_data in invoice_data.items:
            # Calculate item total
            item_subtotal = item_data.quantity * item_data.unitPrice
            item_discount = item_subtotal * (item_data.discount / 100) if item_data.discount > 0 else 0
            item_tax = (item_subtotal - item_discount) * (item_data.taxRate / 100) if item_data.taxRate > 0 else 0
            item_total = item_subtotal - item_discount + item_tax
            
            # Create item as dict with all required fields
            invoice_item = {
                "id": str(uuid.uuid4()),
                "description": item_data.description,
                "quantity": item_data.quantity,
                "unitPrice": item_data.unitPrice,
                "discount": item_data.discount,
                "taxRate": item_data.taxRate,
                "taxAmount": round(item_tax, 2),
                "total": round(item_total, 2),
                "productId": item_data.productId,
                "projectId": item_data.projectId,
                "taskId": item_data.taskId
            }
            invoice_items.append(invoice_item)
        
        # Set the items
        db_invoice.items = invoice_items
        
        db.add(db_invoice)
        db.commit()
        db.refresh(db_invoice)
        
        try:
            return InvoiceResponse(invoice=db_invoice)
        except Exception as validation_error:
            # Log the validation error for debugging
            print(f"Validation error in InvoiceResponse: {validation_error}")
            print(f"Invoice items: {db_invoice.items}")
            raise HTTPException(status_code=500, detail=f"Failed to create invoice response: {str(validation_error)}")
        
    except Exception as e:
        db.rollback()
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
    tenant_context: dict = Depends(get_tenant_context)
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
            search_filter = or_(
                Invoice.invoiceNumber.contains(search),
                Invoice.customerName.contains(search),
                Invoice.customerEmail.contains(search)
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
        
        # Update fields
        update_data = invoice_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "items" and value:
                # Convert InvoiceItemCreate objects to JSON data
                converted_items = []
                for item_data in value:
                    # Calculate item total
                    item_subtotal = item_data.quantity * item_data.unitPrice
                    item_discount = item_subtotal * (item_data.discount / 100) if item_data.discount > 0 else 0
                    item_tax = (item_subtotal - item_discount) * (item_data.taxRate / 100) if item_data.taxRate > 0 else 0
                    item_total = item_subtotal - item_discount + item_tax
                    
                    # Create item as dict with all required fields
                    converted_item = {
                        "id": str(uuid.uuid4()),
                        "description": item_data.description,
                        "quantity": item_data.quantity,
                        "unitPrice": item_data.unitPrice,
                        "discount": item_data.discount,
                        "taxRate": item_data.taxRate,
                        "taxAmount": round(item_tax, 2),
                        "total": round(item_total, 2),
                        "productId": item_data.productId,
                        "projectId": item_data.projectId,
                        "taskId": item_data.taskId
                    }
                    converted_items.append(converted_item)
                
                # Set the converted items
                invoice.items = converted_items
                
                # Recalculate invoice totals
                totals = calculate_invoice_totals(value, invoice.taxRate, invoice.discount)
                invoice.subtotal = totals["subtotal"]
                invoice.taxAmount = totals["taxAmount"]
                invoice.total = totals["total"]
            elif field == "orderTime" and value:
                # Convert orderTime string to datetime
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
        raise
    except Exception as e:
        db.rollback()
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
        
        if invoice.status != InvoiceStatus.DRAFT:
            raise HTTPException(status_code=400, detail="Only draft invoices can be deleted")
        
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
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete invoice: {str(e)}")

@router.post("/{invoice_id}/send")
def send_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Mark invoice as sent"""
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
        
        invoice.status = InvoiceStatus.SENT
        invoice.sentAt = datetime.utcnow()
        invoice.updatedAt = datetime.utcnow()
        
        db.commit()
        
        return {"message": "Invoice sent successfully"}
        
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
    """Mark invoice as paid"""
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
        
        invoice.status = InvoiceStatus.PAID
        invoice.paidAt = datetime.utcnow()
        invoice.updatedAt = datetime.utcnow()
        
        db.commit()
        
        return {"message": "Invoice marked as paid"}
        
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
        
        if invoice.balance <= 0:
            invoice.status = InvoiceStatus.PAID
            invoice.paidAt = datetime.utcnow()
        elif invoice.balance < invoice.total:
            invoice.status = InvoiceStatus.PARTIALLY_PAID
        
        invoice.updatedAt = datetime.utcnow()
        
        db.commit()
        db.refresh(db_payment)
        
        return PaymentResponse(payment=db_payment)
        
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
            raise HTTPException(status_code=400, detail="Tenant context required")
            
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
        
        # Generate beautiful PDF invoice
        pdf_content = generate_invoice_pdf(invoice)
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice-{invoice.invoiceNumber}.pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate invoice download: {str(e)}")
