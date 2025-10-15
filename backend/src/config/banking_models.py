"""
Bank Transaction Models for ERP System
Handles bank payments, online transactions, and cash position tracking
"""

import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Float, DateTime, Text, Boolean, ForeignKey, Index, JSON, Enum as SQLEnum, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

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

class BankAccount(Base):
    __tablename__ = "bank_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Account Information
    account_name = Column(String, nullable=False)
    account_number = Column(String, nullable=False)
    routing_number = Column(String, nullable=True)
    bank_name = Column(String, nullable=False)
    bank_code = Column(String, nullable=True)  # SWIFT, BIC, etc.
    account_type = Column(SQLEnum(BankAccountType), nullable=False)
    currency = Column(String, default="USD")
    
    # Balance Information
    current_balance = Column(Float, default=0.0)
    available_balance = Column(Float, default=0.0)  # Available after pending transactions
    pending_balance = Column(Float, default=0.0)    # Pending transactions
    
    # Account Status
    is_active = Column(Boolean, default=True)
    is_primary = Column(Boolean, default=False)  # Primary account for the tenant
    
    # Online Banking Integration
    supports_online_banking = Column(Boolean, default=False)
    api_credentials = Column(JSON, nullable=True)  # Encrypted API credentials
    last_sync_date = Column(DateTime, nullable=True)
    
    # Metadata
    description = Column(Text, nullable=True)
    tags = Column(JSON, default=[])
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="bank_accounts")
    transactions = relationship("BankTransaction", back_populates="bank_account")
    created_by_user = relationship("User", foreign_keys=[created_by])
    
    __table_args__ = (
        Index("idx_bank_accounts_tenant", "tenant_id"),
        Index("idx_bank_accounts_active", "is_active"),
        Index("idx_bank_accounts_primary", "is_primary"),
    )

class BankTransaction(Base):
    __tablename__ = "bank_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id"), nullable=False)
    
    # Transaction Details
    transaction_number = Column(String, unique=True, index=True)  # Auto-generated
    transaction_date = Column(DateTime, nullable=False, index=True)
    value_date = Column(DateTime, nullable=True)  # When funds are actually available
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.PENDING)
    
    # Amount Information
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    exchange_rate = Column(Float, default=1.0)  # For multi-currency support
    base_amount = Column(Float, nullable=False)  # Amount in base currency
    
    # Payment Method and Reference
    payment_method = Column(SQLEnum(PaymentMethod), nullable=True)
    reference_number = Column(String, nullable=True)
    external_reference = Column(String, nullable=True)  # Bank's reference
    check_number = Column(String, nullable=True)
    
    # Transaction Details
    description = Column(Text, nullable=False)
    memo = Column(Text, nullable=True)
    category = Column(String, nullable=True)  # Expense category
    
    # Counterparty Information
    counterparty_name = Column(String, nullable=True)
    counterparty_account = Column(String, nullable=True)
    counterparty_bank = Column(String, nullable=True)
    
    # Online Transaction Specific
    is_online_transaction = Column(Boolean, default=False)
    online_transaction_id = Column(String, nullable=True)
    processing_fee = Column(Float, default=0.0)
    
    # Reconciliation
    is_reconciled = Column(Boolean, default=False)
    reconciled_date = Column(DateTime, nullable=True)
    reconciled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Related Documents
    related_invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    related_purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=True)
    related_expense_id = Column(UUID(as_uuid=True), nullable=True)  # For expense tracking
    
    # Ledger Integration
    ledger_transaction_id = Column(UUID(as_uuid=True), ForeignKey("ledger_transactions.id"), nullable=True)
    
    # Metadata
    tags = Column(JSON, default=[])
    attachments = Column(JSON, default=[])
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="bank_transactions")
    bank_account = relationship("BankAccount", back_populates="transactions")
    created_by_user = relationship("User", foreign_keys=[created_by])
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    reconciled_by_user = relationship("User", foreign_keys=[reconciled_by])
    related_invoice = relationship("Invoice")
    related_purchase_order = relationship("PurchaseOrder")
    ledger_transaction = relationship("LedgerTransaction")
    
    __table_args__ = (
        Index("idx_bank_transactions_tenant", "tenant_id"),
        Index("idx_bank_transactions_account", "bank_account_id"),
        Index("idx_bank_transactions_date", "transaction_date"),
        Index("idx_bank_transactions_type", "transaction_type"),
        Index("idx_bank_transactions_status", "status"),
        Index("idx_bank_transactions_online", "is_online_transaction"),
        Index("idx_bank_transactions_reconciled", "is_reconciled"),
    )

class OnlineTransaction(Base):
    __tablename__ = "online_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id"), nullable=False)
    bank_transaction_id = Column(UUID(as_uuid=True), ForeignKey("bank_transactions.id"), nullable=True)
    
    # Online Transaction Details
    online_transaction_id = Column(String, unique=True, index=True)  # External system ID
    platform = Column(String, nullable=False)  # PayPal, Stripe, Square, etc.
    gateway = Column(String, nullable=True)  # Payment gateway used
    
    # Transaction Information
    transaction_type = Column(String, nullable=False)  # payment, refund, chargeback, etc.
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    processing_fee = Column(Float, default=0.0)
    net_amount = Column(Float, nullable=False)  # Amount after fees
    
    # Status and Processing
    status = Column(String, nullable=False)  # pending, completed, failed, refunded
    processing_status = Column(String, nullable=True)  # processing, settled, disputed
    settlement_date = Column(DateTime, nullable=True)
    
    # Customer Information
    customer_email = Column(String, nullable=True)
    customer_name = Column(String, nullable=True)
    customer_id = Column(String, nullable=True)
    
    # Payment Details
    payment_method = Column(String, nullable=True)  # card, bank, wallet, etc.
    card_last_four = Column(String, nullable=True)
    card_brand = Column(String, nullable=True)
    
    # Reference Information
    order_id = Column(String, nullable=True)
    invoice_id = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    
    # Metadata
    raw_data = Column(JSON, nullable=True)  # Raw response from payment processor
    webhook_data = Column(JSON, nullable=True)  # Webhook payload
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="online_transactions")
    bank_account = relationship("BankAccount")
    bank_transaction = relationship("BankTransaction")
    
    __table_args__ = (
        Index("idx_online_transactions_tenant", "tenant_id"),
        Index("idx_online_transactions_account", "bank_account_id"),
        Index("idx_online_transactions_platform", "platform"),
        Index("idx_online_transactions_status", "status"),
        Index("idx_online_transactions_date", "created_at"),
    )

class CashPosition(Base):
    __tablename__ = "cash_positions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Position Date
    position_date = Column(DateTime, nullable=False, index=True)
    
    # Bank Account Balances
    total_bank_balance = Column(Float, default=0.0)
    total_available_balance = Column(Float, default=0.0)
    total_pending_balance = Column(Float, default=0.0)
    
    # Transaction Counts
    total_transactions = Column(Integer, default=0)
    online_transactions_count = Column(Integer, default=0)
    pending_transactions_count = Column(Integer, default=0)
    
    # Cash Flow
    daily_inflow = Column(Float, default=0.0)
    daily_outflow = Column(Float, default=0.0)
    net_cash_flow = Column(Float, default=0.0)
    
    # Outstanding Items
    outstanding_receivables = Column(Float, default=0.0)
    outstanding_payables = Column(Float, default=0.0)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="cash_positions")
    
    __table_args__ = (
        Index("idx_cash_positions_tenant", "tenant_id"),
        Index("idx_cash_positions_date", "position_date"),
        Index("idx_cash_positions_tenant_date", "tenant_id", "position_date", unique=True),
    )
