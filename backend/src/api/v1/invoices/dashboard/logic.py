from datetime import datetime, timedelta
from typing import Any, Dict

from fastapi import HTTPException
from sqlalchemy import and_, func, desc, case
from sqlalchemy.orm import Session

from .....config.database import User
from .....core.cache import cached_sync
from .....models.invoices import Invoice
from ..items.schemas import InvoiceStatus
from .schemas import InvoiceDashboard, InvoiceMetrics


@cached_sync(ttl=60, key_prefix="invoice_dashboard_")
def get_invoice_dashboard_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    result = db.query(
        func.count(Invoice.id).label("total"),
        func.sum(case([(Invoice.status == "draft", 1)], else_=0)).label("draft"),
        func.sum(case([(Invoice.status == "sent", 1)], else_=0)).label("sent"),
        func.sum(case([(Invoice.status == "paid", 1)], else_=0)).label("paid"),
        func.sum(case([
            (and_(Invoice.status.in_(["sent", "draft"]), Invoice.dueDate < datetime.utcnow()), 1)
        ], else_=0)).label("overdue"),
        func.sum(case([
            (Invoice.status.in_(["sent", "paid"]), Invoice.total)
        ], else_=0)).label("total_amount"),
        func.sum(case([
            (Invoice.status == "paid", Invoice.total)
        ], else_=0)).label("paid_amount"),
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
            "overdue": result.overdue or 0,
        },
        "amounts": {
            "total": round(total_amount, 2),
            "paid": round(paid_amount, 2),
            "outstanding": round(outstanding_amount, 2),
        },
    }


def get_invoice_dashboard_endpoint(db: Session, current_user: User, tenant_context: dict):
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = tenant_context["tenant_id"]

        total_invoices = db.query(Invoice).filter(Invoice.tenant_id == tenant_id).count()
        paid_invoices = db.query(Invoice).filter(
            and_(Invoice.tenant_id == tenant_id, Invoice.status == InvoiceStatus.PAID)
        ).count()
        overdue_invoices = db.query(Invoice).filter(
            and_(Invoice.tenant_id == tenant_id, Invoice.status == InvoiceStatus.OVERDUE)
        ).count()
        draft_invoices = db.query(Invoice).filter(
            and_(Invoice.tenant_id == tenant_id, Invoice.status == InvoiceStatus.DRAFT)
        ).count()

        total_revenue = db.query(func.sum(Invoice.total)).filter(
            and_(Invoice.tenant_id == tenant_id, Invoice.status == InvoiceStatus.PAID)
        ).scalar() or 0

        outstanding_amount = db.query(func.sum(Invoice.total)).filter(
            and_(
                Invoice.tenant_id == tenant_id,
                Invoice.status.in_([InvoiceStatus.SENT, InvoiceStatus.VIEWED, InvoiceStatus.OVERDUE]),
            )
        ).scalar() or 0

        overdue_amount = db.query(func.sum(Invoice.total)).filter(
            and_(Invoice.tenant_id == tenant_id, Invoice.status == InvoiceStatus.OVERDUE)
        ).scalar() or 0

        recent_invoices = db.query(Invoice).filter(
            Invoice.tenant_id == tenant_id
        ).order_by(desc(Invoice.createdAt)).limit(5).all()

        overdue_invoices_list = db.query(Invoice).filter(
            and_(Invoice.tenant_id == tenant_id, Invoice.status == InvoiceStatus.OVERDUE)
        ).order_by(Invoice.dueDate).limit(5).all()

        top_customers = db.query(
            Invoice.customerName,
            func.sum(Invoice.total).label("total_amount"),
            func.count(Invoice.id).label("invoice_count"),
        ).filter(
            Invoice.tenant_id == tenant_id
        ).group_by(Invoice.customerName).order_by(desc(func.sum(Invoice.total))).limit(5).all()

        monthly_revenue = []
        for i in range(6):
            date = datetime.now() - timedelta(days=30 * i)
            month_start = date.replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

            revenue = db.query(func.sum(Invoice.total)).filter(
                and_(
                    Invoice.tenant_id == tenant_id,
                    Invoice.status == InvoiceStatus.PAID,
                    Invoice.paidAt >= month_start,
                    Invoice.paidAt <= month_end,
                )
            ).scalar() or 0

            monthly_revenue.append({
                "month": month_start.strftime("%Y-%m"),
                "revenue": float(revenue),
            })

        metrics = InvoiceMetrics(
            totalInvoices=total_invoices,
            paidInvoices=paid_invoices,
            overdueInvoices=overdue_invoices,
            draftInvoices=draft_invoices,
            totalRevenue=float(total_revenue),
            outstandingAmount=float(outstanding_amount),
            overdueAmount=float(overdue_amount),
            averagePaymentTime=30.0,
        )

        return InvoiceDashboard(
            metrics=metrics,
            recentInvoices=recent_invoices,
            overdueInvoices=overdue_invoices_list,
            topCustomers=[
                {"name": c.customerName, "amount": float(c.total_amount), "count": c.invoice_count}
                for c in top_customers
            ],
            monthlyRevenue=monthly_revenue,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard: {str(e)}")
