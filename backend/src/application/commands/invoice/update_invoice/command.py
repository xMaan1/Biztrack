from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateInvoiceCommand(ICommand):
    tenant_id: str
    invoice_id: str
    balance: Optional[float] = None
    billingAddress: Optional[str] = None
    createdBy: Optional[str] = None
    currency: Optional[str] = None
    customerCity: Optional[str] = None
    customerCountry: Optional[str] = None
    customerEmail: Optional[str] = None
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    customerPhone: Optional[str] = None
    customerPostalCode: Optional[str] = None
    customerState: Optional[str] = None
    discount: Optional[float] = None
    discountAmount: Optional[float] = None
    dueDate: Optional[datetime] = None
    invoiceNumber: Optional[str] = None
    issueDate: Optional[datetime] = None
    items: Optional[List[str]] = None
    jobDescription: Optional[str] = None
    labourTotal: Optional[float] = None
    notes: Optional[str] = None
    opportunityId: Optional[str] = None
    orderNumber: Optional[str] = None
    orderTime: Optional[datetime] = None
    paidAt: Optional[datetime] = None
    partsDescription: Optional[str] = None
    partsTotal: Optional[float] = None
    paymentTerms: Optional[str] = None
    projectId: Optional[str] = None
    quoteId: Optional[str] = None
    sentAt: Optional[datetime] = None
    shippingAddress: Optional[str] = None
    status: Optional[str] = None
    subtotal: Optional[float] = None
    taxAmount: Optional[float] = None
    taxRate: Optional[float] = None
    terms: Optional[str] = None
    total: Optional[float] = None
    totalPaid: Optional[float] = None
    vehicleColor: Optional[str] = None
    vehicleMake: Optional[str] = None
    vehicleMileage: Optional[str] = None
    vehicleModel: Optional[str] = None
    vehicleReg: Optional[str] = None
    vehicleVin: Optional[str] = None
    vehicleYear: Optional[str] = None
