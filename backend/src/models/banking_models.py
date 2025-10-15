"""
Banking Pydantic Models for API
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from enum import Enum
import uuid

# Enums
class BankAccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    BUSINESS = "business"
    CREDIT_LINE = "credit_line"
    MONEY_MARKET = "money_market"

class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    PAYMENT = "payment"
    REFUND = "refund"
    FEE = "fee"
    INTEREST = "interest"
    ADJUSTMENT = "adjustment"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REVERSED = "reversed"

class PaymentMethod(str, Enum):
    ONLINE_TRANSFER = "online_transfer"
    DIRECT_DEBIT = "direct_debit"
    WIRE_TRANSFER = "wire_transfer"
    ACH = "ach"
    CHECK = "check"
    CASH = "cash"
    CARD_PAYMENT = "card_payment"
    MOBILE_PAYMENT = "mobile_payment"
    CRYPTOCURRENCY = "cryptocurrency"

# Bank Account Models
class BankAccountBase(BaseModel):
    account_name: str = Field(alias="accountName")
    account_number: str = Field(alias="accountNumber")
    routing_number: Optional[str] = Field(alias="routingNumber", default=None)
    bank_name: str = Field(alias="bankName")
    bank_code: Optional[str] = Field(alias="bankCode", default=None)
    account_type: BankAccountType = Field(alias="accountType")
    currency: str = Field(default="USD")
    current_balance: float = Field(alias="currentBalance", default=0.0)
    available_balance: float = Field(alias="availableBalance", default=0.0)
    pending_balance: float = Field(alias="pendingBalance", default=0.0)
    is_active: bool = Field(alias="isActive", default=True)
    is_primary: bool = Field(alias="isPrimary", default=False)
    supports_online_banking: bool = Field(alias="supportsOnlineBanking", default=False)
    description: Optional[str] = Field(default=None)
    tags: List[str] = Field(default=[])

    class Config:
        populate_by_name = True

class BankAccountCreate(BankAccountBase):
    pass

class BankAccountUpdate(BaseModel):
    account_name: Optional[str] = Field(alias="accountName", default=None)
    routing_number: Optional[str] = Field(alias="routingNumber", default=None)
    bank_name: Optional[str] = Field(alias="bankName", default=None)
    bank_code: Optional[str] = Field(alias="bankCode", default=None)
    account_type: Optional[BankAccountType] = Field(alias="accountType", default=None)
    currency: Optional[str] = Field(default=None)
    is_active: Optional[bool] = Field(alias="isActive", default=None)
    is_primary: Optional[bool] = Field(alias="isPrimary", default=None)
    supports_online_banking: Optional[bool] = Field(alias="supportsOnlineBanking", default=None)
    description: Optional[str] = Field(default=None)
    tags: Optional[List[str]] = Field(default=None)

    class Config:
        populate_by_name = True

class BankAccount(BankAccountBase):
    id: str
    tenant_id: str = Field(alias="tenantId")
    created_by: str = Field(alias="createdBy")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @field_validator('id', 'tenant_id', 'created_by', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True
        populate_by_name = True

# Bank Transaction Models
class BankTransactionBase(BaseModel):
    bank_account_id: str = Field(alias="bankAccountId")
    transaction_date: datetime = Field(alias="transactionDate")
    value_date: Optional[datetime] = Field(alias="valueDate", default=None)
    transaction_type: TransactionType = Field(alias="transactionType")
    status: TransactionStatus = Field(alias="status", default=TransactionStatus.PENDING)
    amount: float = Field(alias="amount")
    currency: str = Field(alias="currency", default="USD")
    exchange_rate: float = Field(alias="exchangeRate", default=1.0)
    base_amount: float = Field(alias="baseAmount")
    payment_method: Optional[PaymentMethod] = Field(alias="paymentMethod", default=None)
    reference_number: Optional[str] = Field(alias="referenceNumber", default=None)
    external_reference: Optional[str] = Field(alias="externalReference", default=None)
    check_number: Optional[str] = Field(alias="checkNumber", default=None)
    description: str = Field(alias="description")
    memo: Optional[str] = Field(alias="memo", default=None)
    category: Optional[str] = Field(alias="category", default=None)
    counterparty_name: Optional[str] = Field(alias="counterpartyName", default=None)
    counterparty_account: Optional[str] = Field(alias="counterpartyAccount", default=None)
    counterparty_bank: Optional[str] = Field(alias="counterpartyBank", default=None)
    is_reconciled: bool = Field(alias="isReconciled", default=False)
    reconciled_date: Optional[datetime] = Field(alias="reconciledDate", default=None)
    related_invoice_id: Optional[str] = Field(alias="relatedInvoiceId", default=None)
    related_purchase_order_id: Optional[str] = Field(alias="relatedPurchaseOrderId", default=None)
    related_expense_id: Optional[str] = Field(alias="relatedExpenseId", default=None)
    tags: List[str] = Field(alias="tags", default=[])
    attachments: List[Dict[str, Any]] = Field(alias="attachments", default=[])
    notes: Optional[str] = Field(alias="notes", default=None)

    class Config:
        populate_by_name = True

class BankTransactionCreate(BankTransactionBase):
    pass

class BankTransactionUpdate(BaseModel):
    transaction_date: Optional[datetime] = Field(alias="transactionDate", default=None)
    value_date: Optional[datetime] = Field(alias="valueDate", default=None)
    transaction_type: Optional[TransactionType] = Field(alias="transactionType", default=None)
    status: Optional[TransactionStatus] = Field(alias="status", default=None)
    amount: Optional[float] = Field(alias="amount", default=None)
    currency: Optional[str] = Field(alias="currency", default=None)
    exchange_rate: Optional[float] = Field(alias="exchangeRate", default=None)
    base_amount: Optional[float] = Field(alias="baseAmount", default=None)
    payment_method: Optional[PaymentMethod] = Field(alias="paymentMethod", default=None)
    reference_number: Optional[str] = Field(alias="referenceNumber", default=None)
    external_reference: Optional[str] = Field(alias="externalReference", default=None)
    check_number: Optional[str] = Field(alias="checkNumber", default=None)
    description: Optional[str] = Field(alias="description", default=None)
    memo: Optional[str] = Field(alias="memo", default=None)
    category: Optional[str] = Field(alias="category", default=None)
    counterparty_name: Optional[str] = Field(alias="counterpartyName", default=None)
    counterparty_account: Optional[str] = Field(alias="counterpartyAccount", default=None)
    counterparty_bank: Optional[str] = Field(alias="counterpartyBank", default=None)
    is_reconciled: Optional[bool] = Field(alias="isReconciled", default=None)
    reconciled_date: Optional[datetime] = Field(alias="reconciledDate", default=None)
    related_invoice_id: Optional[str] = Field(alias="relatedInvoiceId", default=None)
    related_purchase_order_id: Optional[str] = Field(alias="relatedPurchaseOrderId", default=None)
    related_expense_id: Optional[str] = Field(alias="relatedExpenseId", default=None)
    tags: Optional[List[str]] = Field(alias="tags", default=None)
    attachments: Optional[List[Dict[str, Any]]] = Field(alias="attachments", default=None)
    notes: Optional[str] = Field(alias="notes", default=None)

    class Config:
        populate_by_name = True

class BankTransaction(BankTransactionBase):
    id: str = Field(alias="id")
    tenant_id: str = Field(alias="tenantId")
    transaction_number: str = Field(alias="transactionNumber")
    created_by: str = Field(alias="createdBy")
    approved_by: Optional[str] = Field(alias="approvedBy", default=None)
    reconciled_by: Optional[str] = Field(alias="reconciledBy", default=None)
    ledger_transaction_id: Optional[str] = Field(alias="ledgerTransactionId", default=None)
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @field_validator('id', 'tenant_id', 'bank_account_id', 'created_by', 'approved_by', 'reconciled_by', 'related_invoice_id', 'related_purchase_order_id', 'ledger_transaction_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True
        populate_by_name = True

# Cash Position Models
class CashPositionBase(BaseModel):
    position_date: datetime
    total_bank_balance: float = 0.0
    total_available_balance: float = 0.0
    total_pending_balance: float = 0.0
    total_transactions: int = 0
    pending_transactions_count: int = 0
    daily_inflow: float = 0.0
    daily_outflow: float = 0.0
    net_cash_flow: float = 0.0
    outstanding_receivables: float = 0.0
    outstanding_payables: float = 0.0

class CashPositionCreate(CashPositionBase):
    pass

class CashPositionUpdate(BaseModel):
    position_date: Optional[datetime] = None
    total_bank_balance: Optional[float] = None
    total_available_balance: Optional[float] = None
    total_pending_balance: Optional[float] = None
    total_transactions: Optional[int] = None
    pending_transactions_count: Optional[int] = None
    daily_inflow: Optional[float] = None
    daily_outflow: Optional[float] = None
    net_cash_flow: Optional[float] = None
    outstanding_receivables: Optional[float] = None
    outstanding_payables: Optional[float] = None

class CashPosition(CashPositionBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime

    @field_validator('id', 'tenant_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

# Response Models
class BankAccountResponse(BaseModel):
    bank_account: BankAccount = Field(alias="bankAccount")

    class Config:
        populate_by_name = True

class BankAccountsResponse(BaseModel):
    bank_accounts: List[BankAccount] = Field(alias="bankAccounts")
    total: int

    class Config:
        populate_by_name = True

class BankTransactionResponse(BaseModel):
    bank_transaction: BankTransaction = Field(alias="bankTransaction")

    class Config:
        populate_by_name = True

class BankTransactionsResponse(BaseModel):
    bank_transactions: List[BankTransaction] = Field(alias="bankTransactions")
    total: int = Field(alias="total")

    class Config:
        populate_by_name = True

class CashPositionResponse(BaseModel):
    cash_position: CashPosition = Field(alias="cashPosition")

    class Config:
        populate_by_name = True

class CashPositionsResponse(BaseModel):
    cash_positions: List[CashPosition] = Field(alias="cashPositions")
    total: int = Field(alias="total")

    class Config:
        populate_by_name = True

# Dashboard Models
class BankingDashboard(BaseModel):
    total_bank_balance: float = Field(alias="totalBankBalance")
    total_available_balance: float = Field(alias="totalAvailableBalance")
    total_pending_balance: float = Field(alias="totalPendingBalance")
    pending_transactions_count: int = Field(alias="pendingTransactionsCount")
    daily_inflow: float = Field(alias="dailyInflow")
    daily_outflow: float = Field(alias="dailyOutflow")
    net_cash_flow: float = Field(alias="netCashFlow")
    outstanding_receivables: float = Field(alias="outstandingReceivables")
    outstanding_payables: float = Field(alias="outstandingPayables")
    recent_transactions: List[BankTransaction] = Field(alias="recentTransactions")
    bank_accounts_summary: List[Dict[str, Any]] = Field(alias="bankAccountsSummary")

    class Config:
        populate_by_name = True

# Reconciliation Models
class ReconciliationSummary(BaseModel):
    total_transactions: int
    reconciled_transactions: int
    unreconciled_transactions: int
    reconciliation_percentage: float
    last_reconciliation_date: Optional[datetime]

class TransactionReconciliation(BaseModel):
    bank_transaction_id: Optional[str] = None
    is_reconciled: bool
    reconciled_date: Optional[datetime] = None
    reconciled_by: Optional[str] = None
    notes: Optional[str] = None
