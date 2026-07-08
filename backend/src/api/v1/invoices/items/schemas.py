from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from .....models.common import Pagination


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    VOID = "void"


class InvoiceItem(BaseModel):
    id: Any
    description: str
    quantity: float
    unitPrice: float
    discount: float = 0.0
    taxRate: float = 0.0
    taxAmount: float = 0.0
    total: float
    unit: Optional[str] = None
    productId: Optional[Any] = None
    projectId: Optional[str] = None
    taskId: Optional[str] = None


class InvoiceItemCreate(BaseModel):
    description: str
    quantity: float
    unitPrice: float
    discount: float = 0.0
    taxRate: float = 0.0
    unit: Optional[str] = None
    productId: Optional[str] = None
    projectId: Optional[str] = None
    taskId: Optional[str] = None


class InvoiceItemUpdate(BaseModel):
    description: Optional[str] = None
    quantity: Optional[float] = None
    unitPrice: Optional[float] = None
    discount: Optional[float] = None
    taxRate: Optional[float] = None
    unit: Optional[str] = None
    productId: Optional[str] = None
    projectId: Optional[str] = None
    taskId: Optional[str] = None


class InvoiceBase(BaseModel):
    invoiceNumber: str
    customerId: Any
    customerName: str
    customerEmail: str
    customerPhone: Optional[str] = None
    billingAddress: str
    shippingAddress: Optional[str] = None
    issueDate: datetime
    dueDate: datetime
    orderNumber: Optional[str] = None
    orderTime: Optional[datetime] = None
    paymentTerms: str = "Net 30"
    currency: str = "USD"
    subtotal: float = 0.0
    taxRate: float = 0.0
    taxAmount: float = 0.0
    discount: float = 0.0
    total: float = 0.0
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: InvoiceStatus = InvoiceStatus.DRAFT
    items: List[InvoiceItem] = []
    vehicleMake: Optional[str] = None
    vehicleModel: Optional[str] = None
    vehicleYear: Optional[str] = None
    vehicleColor: Optional[str] = None
    vehicleVin: Optional[str] = None
    vehicleReg: Optional[str] = None
    vehicleMileage: Optional[str] = None
    documentNo: Optional[str] = None
    purchaseOrderId: Optional[str] = None
    jobCardId: Optional[str] = None
    jobDescription: Optional[str] = None
    partsDescription: Optional[str] = None
    labourTotal: Optional[float] = 0.0
    partsTotal: Optional[float] = 0.0


class InvoiceCreate(BaseModel):
    customerId: str
    customerName: str
    customerEmail: Optional[str] = None
    customerPhone: Optional[str] = None
    billingAddress: Optional[str] = None
    shippingAddress: Optional[str] = None
    issueDate: str
    dueDate: str
    orderNumber: Optional[str] = None
    orderTime: Optional[str] = None
    paymentTerms: str = "Net 30"
    currency: str = "USD"
    taxRate: float = 0.0
    discount: float = 0.0
    notes: Optional[str] = None
    terms: Optional[str] = None
    items: List[InvoiceItemCreate] = []
    opportunityId: Optional[str] = None
    quoteId: Optional[str] = None
    projectId: Optional[str] = None
    vehicleMake: Optional[str] = None
    vehicleModel: Optional[str] = None
    vehicleYear: Optional[str] = None
    vehicleColor: Optional[str] = None
    vehicleVin: Optional[str] = None
    vehicleReg: Optional[str] = None
    vehicleMileage: Optional[str] = None
    documentNo: Optional[str] = None
    purchaseOrderId: Optional[str] = None
    jobCardId: Optional[str] = None
    jobDescription: Optional[str] = None
    partsDescription: Optional[str] = None
    labourTotal: Optional[float] = 0.0
    partsTotal: Optional[float] = 0.0


class InvoiceUpdate(BaseModel):
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    customerEmail: Optional[str] = None
    customerPhone: Optional[str] = None
    shippingAddress: Optional[str] = None
    issueDate: Optional[str] = None
    dueDate: Optional[str] = None
    orderNumber: Optional[str] = None
    orderTime: Optional[str] = None
    paymentTerms: Optional[str] = None
    currency: Optional[str] = None
    taxRate: Optional[float] = None
    discount: Optional[float] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: Optional[InvoiceStatus] = None
    items: Optional[List[InvoiceItemCreate]] = None
    vehicleMake: Optional[str] = None
    vehicleModel: Optional[str] = None
    vehicleYear: Optional[str] = None
    vehicleColor: Optional[str] = None
    vehicleVin: Optional[str] = None
    vehicleReg: Optional[str] = None
    vehicleMileage: Optional[str] = None
    documentNo: Optional[str] = None
    purchaseOrderId: Optional[str] = None
    jobCardId: Optional[str] = None
    jobDescription: Optional[str] = None
    partsDescription: Optional[str] = None
    labourTotal: Optional[float] = None
    partsTotal: Optional[float] = None


class Invoice(InvoiceBase):
    id: Any
    tenant_id: Any
    createdBy: Any
    opportunityId: Optional[str] = None
    quoteId: Optional[str] = None
    projectId: Optional[str] = None
    sentAt: Optional[datetime] = None
    viewedAt: Optional[datetime] = None
    paidAt: Optional[datetime] = None
    overdueAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime
    payments: List[Dict[str, Any]] = []
    totalPaid: float = 0.0
    balance: float = 0.0
    daysOverdue: int = 0

    class Config:
        from_attributes = True


class InvoicesResponse(BaseModel):
    invoices: List[Invoice]
    pagination: Pagination


class InvoiceResponse(BaseModel):
    invoice: Invoice


class InvoiceFilters(BaseModel):
    status: Optional[str] = None
    customerId: Optional[str] = None
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    amountFrom: Optional[float] = None
    amountTo: Optional[float] = None
    search: Optional[str] = None
    orderPrefix: Optional[str] = None
