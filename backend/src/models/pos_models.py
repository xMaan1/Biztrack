from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from .common import Pagination
from .inventory_models import Product

class POSPaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    MOBILE = "mobile"
    BANK_TRANSFER = "bank_transfer"

class POSTransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    VOID = "void"

class POSShiftStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"

class POSTransactionItem(BaseModel):
    productId: str
    productName: str
    sku: str
    quantity: int
    unitPrice: float
    discount: float = 0.0
    taxRate: float = 0.0
    total: float

class POSTransactionBase(BaseModel):
    transactionNumber: str
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    items: List[POSTransactionItem]
    subtotal: float
    discount: float = 0.0
    taxAmount: float = 0.0
    total: float
    paymentMethod: POSPaymentMethod
    cashAmount: float = 0.0
    changeAmount: float = 0.0
    notes: Optional[str] = None
    status: POSTransactionStatus = POSTransactionStatus.PENDING

class POSTransactionCreate(BaseModel):
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    items: List[POSTransactionItem]
    discount: float = 0.0
    taxRate: float = 0.0
    paymentMethod: POSPaymentMethod
    cashAmount: float = 0.0
    notes: Optional[str] = None

class POSTransactionUpdate(BaseModel):
    status: Optional[POSTransactionStatus] = None
    notes: Optional[str] = None

class POSTransaction(POSTransactionBase):
    id: str
    tenant_id: str
    shiftId: str
    cashierId: str
    cashierName: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class POSShiftBase(BaseModel):
    shiftNumber: str
    openingBalance: float
    closingBalance: Optional[float] = None
    totalSales: float = 0.0
    totalTransactions: int = 0
    status: POSShiftStatus = POSShiftStatus.OPEN
    notes: Optional[str] = None

class POSShiftCreate(BaseModel):
    openingBalance: float
    notes: Optional[str] = None

class POSShiftUpdate(BaseModel):
    closingBalance: Optional[float] = None
    status: Optional[POSShiftStatus] = None
    notes: Optional[str] = None

class POSShift(POSShiftBase):
    id: str
    tenant_id: str
    cashierId: str
    cashierName: str
    openedAt: datetime
    closedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class POSTransactionsResponse(BaseModel):
    transactions: List[POSTransaction]
    pagination: Pagination

class POSTransactionResponse(BaseModel):
    transaction: POSTransaction

class POSShiftsResponse(BaseModel):
    shifts: List[POSShift]
    pagination: Pagination

class POSShiftResponse(BaseModel):
    shift: POSShift

class POSMetrics(BaseModel):
    totalSales: float
    totalTransactions: int
    averageTransactionValue: float
    topProducts: List[Dict[str, Any]]
    dailySales: List[Dict[str, Any]]
    openShift: Optional[POSShift] = None

class POSDashboard(BaseModel):
    metrics: POSMetrics
    recentTransactions: List[POSTransaction]
    lowStockProducts: List[Product]

class ProductFilters(BaseModel):
    category: Optional[str] = None
    search: Optional[str] = None
    lowStock: Optional[bool] = None
    isActive: Optional[bool] = None

class POSTransactionFilters(BaseModel):
    status: Optional[str] = None
    paymentMethod: Optional[str] = None
    shiftId: Optional[str] = None
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    search: Optional[str] = None

class POSShiftFilters(BaseModel):
    status: Optional[str] = None
    cashierId: Optional[str] = None
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None

