import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, Boolean, ForeignKey, Index, JSON, Enum as SQLEnum, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base
from ...domain.enums.banking_enums import (
    BankAccountType, TransactionType, TransactionStatus, PaymentMethod, TillTransactionType
)

class BankAccount(Base):
    __tablename__ = "bank_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    account_name = Column(String, nullable=False)
    account_number = Column(String, nullable=False)
    routing_number = Column(String, nullable=True)
    bank_name = Column(String, nullable=False)
    bank_code = Column(String, nullable=True)
    account_type = Column(SQLEnum(BankAccountType), nullable=False)
    currency = Column(String, default="USD")
    
    current_balance = Column(Float, default=0.0)
    available_balance = Column(Float, default=0.0)
    pending_balance = Column(Float, default=0.0)
    
    is_active = Column(Boolean, default=True)
    is_primary = Column(Boolean, default=False)
    
    supports_online_banking = Column(Boolean, default=False)
    api_credentials = Column(JSON, nullable=True)
    last_sync_date = Column(DateTime, nullable=True)
    
    description = Column(Text, nullable=True)
    tags = Column(JSON, default=[])
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
    
    transaction_number = Column(String, unique=True, index=True)
    transaction_date = Column(DateTime, nullable=False, index=True)
    value_date = Column(DateTime, nullable=True)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.PENDING)
    
    amount = Column(Float, nullable=False)
    running_balance = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    exchange_rate = Column(Float, default=1.0)
    base_amount = Column(Float, nullable=False)
    
    payment_method = Column(SQLEnum(PaymentMethod), nullable=True)
    reference_number = Column(String, nullable=True)
    external_reference = Column(String, nullable=True)
    check_number = Column(String, nullable=True)
    
    description = Column(Text, nullable=False)
    memo = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    
    counterparty_name = Column(String, nullable=True)
    counterparty_account = Column(String, nullable=True)
    counterparty_bank = Column(String, nullable=True)
    
    is_reconciled = Column(Boolean, default=False)
    reconciled_date = Column(DateTime, nullable=True)
    reconciled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    related_invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    related_purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=True)
    related_expense_id = Column(UUID(as_uuid=True), nullable=True)
    
    ledger_transaction_id = Column(UUID(as_uuid=True), ForeignKey("ledger_transactions.id"), nullable=True)
    
    tags = Column(JSON, default=[])
    attachments = Column(JSON, default=[])
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
        Index("idx_bank_transactions_reconciled", "is_reconciled"),
    )

class CashPosition(Base):
    __tablename__ = "cash_positions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    position_date = Column(DateTime, nullable=False, index=True)
    
    total_bank_balance = Column(Float, default=0.0)
    total_available_balance = Column(Float, default=0.0)
    total_pending_balance = Column(Float, default=0.0)
    
    total_transactions = Column(Integer, default=0)
    pending_transactions_count = Column(Integer, default=0)
    
    daily_inflow = Column(Float, default=0.0)
    daily_outflow = Column(Float, default=0.0)
    net_cash_flow = Column(Float, default=0.0)
    
    outstanding_receivables = Column(Float, default=0.0)
    outstanding_payables = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="cash_positions")
    
    __table_args__ = (
        Index("idx_cash_positions_tenant", "tenant_id"),
        Index("idx_cash_positions_date", "position_date"),
        Index("idx_cash_positions_tenant_date", "tenant_id", "position_date", unique=True),
    )

class Till(Base):
    __tablename__ = "tills"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    initial_balance = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    
    is_active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    transactions = relationship("TillTransaction", back_populates="till", cascade="all, delete-orphan")
    tenant = relationship("Tenant", back_populates="tills")
    created_by_user = relationship("User", foreign_keys=[created_by])
    
    __table_args__ = (
        Index("idx_tills_tenant", "tenant_id"),
        Index("idx_tills_active", "is_active"),
    )

class TillTransaction(Base):
    __tablename__ = "till_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    till_id = Column(UUID(as_uuid=True), ForeignKey("tills.id"), nullable=False)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id"), nullable=True)
    
    transaction_number = Column(String, unique=True, index=True)
    transaction_date = Column(DateTime, nullable=False, index=True)
    transaction_type = Column(SQLEnum(TillTransactionType), nullable=False)
    
    amount = Column(Float, nullable=False)
    running_balance = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    
    description = Column(Text, nullable=False)
    reason = Column(String, nullable=True)
    reference_number = Column(String, nullable=True)
    
    performed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="till_transactions")
    till = relationship("Till", back_populates="transactions")
    bank_account = relationship("BankAccount", foreign_keys=[bank_account_id])
    performed_by_user = relationship("User", foreign_keys=[performed_by])
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    
    __table_args__ = (
        Index("idx_till_transactions_tenant", "tenant_id"),
        Index("idx_till_transactions_till", "till_id"),
        Index("idx_till_transactions_date", "transaction_date"),
        Index("idx_till_transactions_type", "transaction_type"),
    )

