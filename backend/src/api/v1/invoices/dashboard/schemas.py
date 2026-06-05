from pydantic import BaseModel
from typing import List, Dict, Any
from ..items.schemas import Invoice


class InvoiceMetrics(BaseModel):
    totalInvoices: int
    paidInvoices: int
    overdueInvoices: int
    draftInvoices: int
    totalRevenue: float
    outstandingAmount: float
    overdueAmount: float
    averagePaymentTime: float


class InvoiceDashboard(BaseModel):
    metrics: InvoiceMetrics
    recentInvoices: List[Invoice]
    overdueInvoices: List[Invoice]
    topCustomers: List[Dict[str, Any]]
    monthlyRevenue: List[Dict[str, Any]]
