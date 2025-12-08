from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from .common import Pagination

class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    VOID = "void"

class PaymentMethod(str, Enum):
    CREDIT_CARD = "credit_card"
    BANK_TRANSFER = "bank_transfer"
    CASH = "cash"
    CHECK = "check"
    PAYPAL = "paypal"
    STRIPE = "stripe"
    OTHER = "other"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"

class InvoiceItem(BaseModel):
    id: str
    description: str
    quantity: float
    unitPrice: float
    discount: float = 0.0
    taxRate: float = 0.0
    taxAmount: float = 0.0
    total: float
    productId: Optional[str] = None
    projectId: Optional[str] = None
    taskId: Optional[str] = None

class InvoiceItemCreate(BaseModel):
    description: str
    quantity: float
    unitPrice: float
    discount: float = 0.0
    taxRate: float = 0.0
    productId: Optional[str] = None
    projectId: Optional[str] = None
    taskId: Optional[str] = None

class InvoiceItemUpdate(BaseModel):
    description: Optional[str] = None
    quantity: Optional[float] = None
    unitPrice: Optional[float] = None
    discount: Optional[float] = None
    taxRate: Optional[float] = None
    productId: Optional[str] = None
    projectId: Optional[str] = None
    taskId: Optional[str] = None

class InvoiceBase(BaseModel):
    invoiceNumber: str
    customerId: str
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
    jobDescription: Optional[str] = None
    partsDescription: Optional[str] = None
    labourTotal: Optional[float] = 0.0
    partsTotal: Optional[float] = 0.0

class InvoiceCreate(BaseModel):
    customerId: str
    customerName: str
    customerEmail: str
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
    jobDescription: Optional[str] = None
    partsDescription: Optional[str] = None
    labourTotal: Optional[float] = 0.0
    partsTotal: Optional[float] = 0.0

class InvoiceUpdate(BaseModel):
    customerName: Optional[str] = None
    customerEmail: Optional[str] = None
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
    jobDescription: Optional[str] = None
    partsDescription: Optional[str] = None
    labourTotal: Optional[float] = None
    partsTotal: Optional[float] = None

class Invoice(InvoiceBase):
    id: str
    tenant_id: str
    createdBy: str
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

class InvoiceCustomizationBase(BaseModel):
    company_name: str
    company_logo_url: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_website: Optional[str] = None
    bank_sort_code: Optional[str] = None
    bank_account_number: Optional[str] = None
    payment_instructions: Optional[str] = None
    primary_color: str = "#1e40af"
    secondary_color: str = "#6b7280"
    accent_color: str = "#f3f4f6"
    show_vehicle_info: bool = True
    show_parts_section: bool = True
    show_labour_section: bool = True
    show_comments_section: bool = True
    footer_text: Optional[str] = None
    show_contact_info_in_footer: bool = True
    footer_background_color: str = "#1e3a8a"
    grid_color: str = "#cccccc"
    thank_you_message: str = "Thank you for your business!"
    enquiry_message: str = "Should you have any enquiries concerning this invoice,"
    contact_message: str = "please contact us at your convenience."
    default_payment_instructions: str = "Make all payments to your company name"
    default_currency: str = "USD"
    custom_fields: Optional[Dict[str, Any]] = {}

class InvoiceCustomizationCreate(InvoiceCustomizationBase):
    pass

class InvoiceCustomizationUpdate(BaseModel):
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_website: Optional[str] = None
    bank_sort_code: Optional[str] = None
    bank_account_number: Optional[str] = None
    payment_instructions: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    show_vehicle_info: Optional[bool] = None
    show_parts_section: Optional[bool] = None
    show_labour_section: Optional[bool] = None
    show_comments_section: Optional[bool] = None
    footer_text: Optional[str] = None
    show_contact_info_in_footer: Optional[bool] = None
    footer_background_color: Optional[str] = None
    grid_color: Optional[str] = None
    thank_you_message: Optional[str] = None
    enquiry_message: Optional[str] = None
    contact_message: Optional[str] = None
    default_payment_instructions: Optional[str] = None
    default_currency: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class InvoiceCustomization(InvoiceCustomizationBase):
    id: str
    tenant_id: str
    created_by: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class InvoiceCustomizationResponse(BaseModel):
    customization: InvoiceCustomization

    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    invoiceId: str
    amount: float
    paymentMethod: PaymentMethod
    paymentDate: str
    reference: Optional[str] = None
    notes: Optional[str] = None
    status: PaymentStatus = PaymentStatus.PENDING

class PaymentCreate(BaseModel):
    invoiceId: str
    amount: float
    paymentMethod: PaymentMethod
    paymentDate: str
    reference: Optional[str] = None
    notes: Optional[str] = None

class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    paymentMethod: Optional[PaymentMethod] = None
    paymentDate: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[PaymentStatus] = None

class Payment(PaymentBase):
    id: str
    tenant_id: str
    createdBy: str
    processedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class InvoicesResponse(BaseModel):
    invoices: List[Invoice]
    pagination: Pagination

class InvoiceResponse(BaseModel):
    invoice: Invoice

class PaymentsResponse(BaseModel):
    payments: List[Payment]
    pagination: Pagination

class PaymentResponse(BaseModel):
    payment: Payment

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

class InvoiceFilters(BaseModel):
    status: Optional[str] = None
    customerId: Optional[str] = None
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    amountFrom: Optional[float] = None
    amountTo: Optional[float] = None
    search: Optional[str] = None

class PaymentFilters(BaseModel):
    invoiceId: Optional[str] = None
    paymentMethod: Optional[str] = None
    status: Optional[str] = None
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    search: Optional[str] = None

