import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Text, Boolean, ForeignKey, Integer, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base
from ...domain.enums.ledger_enums import (
    TransactionType as LedgerTransactionType,
    TransactionStatus as LedgerTransactionStatus,
    AccountType,
    AccountCategory,
    AccountReceivableStatus
)

class ChartOfAccounts(Base):
    __tablename__ = "chart_of_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    account_code = Column(String, nullable=False, index=True)
    account_name = Column(String, nullable=False)
    account_type = Column(Enum(AccountType), nullable=False)
    account_category = Column(Enum(AccountCategory), nullable=False)
    description = Column(Text, nullable=True)
    parent_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_system_account = Column(Boolean, default=False)
    opening_balance = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="chart_of_accounts")
    parent_account = relationship("ChartOfAccounts", remote_side=[id], backref="sub_accounts")
    created_by_user = relationship("User", foreign_keys=[created_by])

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    entry_number = Column(String, unique=True, index=True)
    entry_date = Column(DateTime, nullable=False, index=True)
    reference_number = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    
    status = Column(String, default="draft")
    is_posted = Column(Boolean, default=False)
    posted_at = Column(DateTime, nullable=True)
    posted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    tags = Column(JSON, default=[])
    attachments = Column(JSON, default=[])
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="journal_entries")
    posted_by_user = relationship("User", foreign_keys=[posted_by])
    created_by_user = relationship("User", foreign_keys=[created_by])
    transactions = relationship("LedgerTransaction", back_populates="journal_entry")

class LedgerTransaction(Base):
    __tablename__ = "ledger_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    transaction_number = Column(String, unique=True, index=True)
    transaction_date = Column(DateTime, nullable=False, index=True)
    transaction_type = Column(Enum(LedgerTransactionType), nullable=False)
    status = Column(Enum(LedgerTransactionStatus), default=LedgerTransactionStatus.PENDING)
    
    debit_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    credit_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    
    reference_type = Column(String, nullable=True)
    reference_id = Column(String, nullable=True)
    reference_number = Column(String, nullable=True)
    
    description = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    
    tags = Column(JSON, default=[])
    attachments = Column(JSON, default=[])
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    journal_entry_id = Column(UUID(as_uuid=True), ForeignKey("journal_entries.id"), nullable=True)
    
    tenant = relationship("Tenant", back_populates="ledger_transactions")
    debit_account = relationship("ChartOfAccounts", foreign_keys=[debit_account_id])
    credit_account = relationship("ChartOfAccounts", foreign_keys=[credit_account_id])
    created_by_user = relationship("User", foreign_keys=[created_by])
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    journal_entry = relationship("JournalEntry", back_populates="transactions")

class FinancialPeriod(Base):
    __tablename__ = "financial_periods"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    period_name = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_closed = Column(Boolean, default=False)
    closed_at = Column(DateTime, nullable=True)
    closed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    total_revenue = Column(Float, default=0.0)
    total_expenses = Column(Float, default=0.0)
    net_income = Column(Float, default=0.0)
    
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="financial_periods")
    closed_by_user = relationship("User", foreign_keys=[closed_by])
    created_by_user = relationship("User", foreign_keys=[created_by])

class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    budget_name = Column(String, nullable=False)
    budget_type = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    total_budget = Column(Float, nullable=False)
    allocated_amount = Column(Float, default=0.0)
    spent_amount = Column(Float, default=0.0)
    remaining_amount = Column(Float, default=0.0)
    
    status = Column(String, default="active")
    is_active = Column(Boolean, default=True)
    
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="budgets")
    created_by_user = relationship("User", foreign_keys=[created_by])
    budget_items = relationship("BudgetItem", back_populates="budget")

class BudgetItem(Base):
    __tablename__ = "budget_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    budget_id = Column(UUID(as_uuid=True), ForeignKey("budgets.id"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    
    budgeted_amount = Column(Float, nullable=False)
    allocated_amount = Column(Float, default=0.0)
    spent_amount = Column(Float, default=0.0)
    remaining_amount = Column(Float, default=0.0)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    budget = relationship("Budget", back_populates="budget_items")
    account = relationship("ChartOfAccounts")

class AccountReceivable(Base):
    __tablename__ = "account_receivables"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    invoice_id = Column(String, nullable=False, index=True)
    invoice_number = Column(String, nullable=False)
    
    customer_id = Column(String, nullable=False)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)
    
    invoice_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    
    invoice_amount = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    outstanding_balance = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    
    status = Column(Enum(AccountReceivableStatus), default=AccountReceivableStatus.PENDING)
    days_overdue = Column(Integer, default=0)
    
    payment_terms = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="account_receivables")
    created_by_user = relationship("User", foreign_keys=[created_by])

