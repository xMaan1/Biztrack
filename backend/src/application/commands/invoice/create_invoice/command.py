from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateInvoiceCommand(ICommand):
    tenant_id: str
    balance: Optional[float] = 0.0
    billingAddress: Optional[str] = None
    createdBy: str
    currency: Optional[str] = None
    customerCity: Optional[str] = None
    customerCountry: Optional[str] = None
    customerEmail: Optional[str] = None
    customerId: Optional[str] = None
    customerName: str
    customerPhone: Optional[str] = None
    customerPostalCode: Optional[str] = None
    customerState: Optional[str] = None
    discount: Optional[float] = 0.0
    discountAmount: Optional[float] = 0.0
    dueDate: datetime
    invoiceNumber: str
    issueDate: datetime
    items: Optional[List[str]] = None
    jobDescription: Optional[str] = None
    labourTotal: Optional[float] = 0.0
    notes: Optional[str] = None
    opportunityId: Optional[str] = None
    orderNumber: Optional[str] = None
    orderTime: Optional[datetime] = None
    paidAt: Optional[datetime] = None
    partsDescription: Optional[str] = None
    partsTotal: Optional[float] = 0.0
    paymentTerms: Optional[str] = None
    projectId: Optional[str] = None
    quoteId: Optional[str] = None
    sentAt: Optional[datetime] = None
    shippingAddress: Optional[str] = None
    status: Optional[str] = None
    subtotal: Optional[float] = 0.0
    taxAmount: Optional[float] = 0.0
    taxRate: Optional[float] = 0.0
    terms: Optional[str] = None
    total: Optional[float] = 0.0
    totalPaid: Optional[float] = 0.0
    vehicleColor: Optional[str] = None
    vehicleMake: Optional[str] = None
    vehicleMileage: Optional[str] = None
    vehicleModel: Optional[str] = None
    vehicleReg: Optional[str] = None
    vehicleVin: Optional[str] = None
    vehicleYear: Optional[str] = None
    created_by: Optional[str] = None
