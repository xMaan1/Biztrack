"""
Banking CRUD Operations
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc
from .banking_models import (
    BankAccount, BankTransaction, OnlineTransaction, CashPosition,
    BankAccountType, TransactionType, TransactionStatus, PaymentMethod
)

# Bank Account CRUD Operations
def create_bank_account(account_data: Dict[str, Any], db: Session) -> BankAccount:
    """Create a new bank account"""
    db_account = BankAccount(**account_data)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def get_bank_account_by_id(account_id: str, db: Session, tenant_id: str) -> Optional[BankAccount]:
    """Get bank account by ID"""
    return db.query(BankAccount).filter(
        and_(
            BankAccount.id == account_id,
            BankAccount.tenant_id == tenant_id
        )
    ).first()

def get_all_bank_accounts(db: Session, tenant_id: str, skip: int = 0, limit: int = 100) -> List[BankAccount]:
    """Get all bank accounts for a tenant"""
    return db.query(BankAccount).filter(
        BankAccount.tenant_id == tenant_id
    ).offset(skip).limit(limit).all()

def get_active_bank_accounts(db: Session, tenant_id: str) -> List[BankAccount]:
    """Get all active bank accounts"""
    return db.query(BankAccount).filter(
        and_(
            BankAccount.tenant_id == tenant_id,
            BankAccount.is_active == True
        )
    ).all()

def get_primary_bank_account(db: Session, tenant_id: str) -> Optional[BankAccount]:
    """Get the primary bank account"""
    return db.query(BankAccount).filter(
        and_(
            BankAccount.tenant_id == tenant_id,
            BankAccount.is_primary == True,
            BankAccount.is_active == True
        )
    ).first()

def update_bank_account(account_id: str, account_data: Dict[str, Any], db: Session, tenant_id: str) -> Optional[BankAccount]:
    """Update bank account"""
    db_account = get_bank_account_by_id(account_id, db, tenant_id)
    if not db_account:
        return None
    
    for key, value in account_data.items():
        if hasattr(db_account, key):
            setattr(db_account, key, value)
    
    db_account.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_account)
    return db_account

def delete_bank_account(account_id: str, db: Session, tenant_id: str) -> bool:
    """Delete bank account (soft delete by setting is_active to False)"""
    db_account = get_bank_account_by_id(account_id, db, tenant_id)
    if not db_account:
        return False
    
    db_account.is_active = False
    db_account.updated_at = datetime.utcnow()
    db.commit()
    return True

# Bank Transaction CRUD Operations
def create_bank_transaction(transaction_data: Dict[str, Any], db: Session) -> BankTransaction:
    """Create a new bank transaction"""
    db_transaction = BankTransaction(**transaction_data)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_bank_transaction_by_id(transaction_id: str, db: Session, tenant_id: str) -> Optional[BankTransaction]:
    """Get bank transaction by ID"""
    return db.query(BankTransaction).filter(
        and_(
            BankTransaction.id == transaction_id,
            BankTransaction.tenant_id == tenant_id
        )
    ).first()

def get_all_bank_transactions(
    db: Session, 
    tenant_id: str, 
    skip: int = 0, 
    limit: int = 100,
    account_id: Optional[str] = None,
    transaction_type: Optional[TransactionType] = None,
    status: Optional[TransactionStatus] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[BankTransaction]:
    """Get all bank transactions with optional filters"""
    query = db.query(BankTransaction).filter(BankTransaction.tenant_id == tenant_id)
    
    if account_id:
        query = query.filter(BankTransaction.bank_account_id == account_id)
    
    if transaction_type:
        query = query.filter(BankTransaction.transaction_type == transaction_type)
    
    if status:
        query = query.filter(BankTransaction.status == status)
    
    if start_date:
        query = query.filter(BankTransaction.transaction_date >= start_date)
    
    if end_date:
        query = query.filter(BankTransaction.transaction_date <= end_date)
    
    return query.order_by(desc(BankTransaction.transaction_date)).offset(skip).limit(limit).all()

def get_transactions_by_account(account_id: str, db: Session, tenant_id: str) -> List[BankTransaction]:
    """Get all transactions for a specific account"""
    return db.query(BankTransaction).filter(
        and_(
            BankTransaction.bank_account_id == account_id,
            BankTransaction.tenant_id == tenant_id
        )
    ).order_by(desc(BankTransaction.transaction_date)).all()

def get_unreconciled_transactions(db: Session, tenant_id: str) -> List[BankTransaction]:
    """Get all unreconciled transactions"""
    return db.query(BankTransaction).filter(
        and_(
            BankTransaction.tenant_id == tenant_id,
            BankTransaction.is_reconciled == False
        )
    ).order_by(desc(BankTransaction.transaction_date)).all()

def update_bank_transaction(transaction_id: str, transaction_data: Dict[str, Any], db: Session, tenant_id: str) -> Optional[BankTransaction]:
    """Update bank transaction"""
    db_transaction = get_bank_transaction_by_id(transaction_id, db, tenant_id)
    if not db_transaction:
        return None
    
    for key, value in transaction_data.items():
        if hasattr(db_transaction, key):
            setattr(db_transaction, key, value)
    
    db_transaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def reconcile_transaction(transaction_id: str, reconciled_by: str, notes: Optional[str], db: Session, tenant_id: str) -> Optional[BankTransaction]:
    """Reconcile a transaction"""
    db_transaction = get_bank_transaction_by_id(transaction_id, db, tenant_id)
    if not db_transaction:
        return None
    
    db_transaction.is_reconciled = True
    db_transaction.reconciled_date = datetime.utcnow()
    db_transaction.reconciled_by = reconciled_by
    if notes:
        db_transaction.notes = notes
    
    db_transaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

# Online Transaction CRUD Operations
def create_online_transaction(transaction_data: Dict[str, Any], db: Session) -> OnlineTransaction:
    """Create a new online transaction"""
    db_transaction = OnlineTransaction(**transaction_data)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_online_transaction_by_id(transaction_id: str, db: Session, tenant_id: str) -> Optional[OnlineTransaction]:
    """Get online transaction by ID"""
    return db.query(OnlineTransaction).filter(
        and_(
            OnlineTransaction.id == transaction_id,
            OnlineTransaction.tenant_id == tenant_id
        )
    ).first()

def get_online_transaction_by_external_id(external_id: str, db: Session, tenant_id: str) -> Optional[OnlineTransaction]:
    """Get online transaction by external ID"""
    return db.query(OnlineTransaction).filter(
        and_(
            OnlineTransaction.online_transaction_id == external_id,
            OnlineTransaction.tenant_id == tenant_id
        )
    ).first()

def get_all_online_transactions(
    db: Session, 
    tenant_id: str, 
    skip: int = 0, 
    limit: int = 100,
    platform: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[OnlineTransaction]:
    """Get all online transactions with optional filters"""
    query = db.query(OnlineTransaction).filter(OnlineTransaction.tenant_id == tenant_id)
    
    if platform:
        query = query.filter(OnlineTransaction.platform == platform)
    
    if status:
        query = query.filter(OnlineTransaction.status == status)
    
    if start_date:
        query = query.filter(OnlineTransaction.created_at >= start_date)
    
    if end_date:
        query = query.filter(OnlineTransaction.created_at <= end_date)
    
    return query.order_by(desc(OnlineTransaction.created_at)).offset(skip).limit(limit).all()

def update_online_transaction(transaction_id: str, transaction_data: Dict[str, Any], db: Session, tenant_id: str) -> Optional[OnlineTransaction]:
    """Update online transaction"""
    db_transaction = get_online_transaction_by_id(transaction_id, db, tenant_id)
    if not db_transaction:
        return None
    
    for key, value in transaction_data.items():
        if hasattr(db_transaction, key):
            setattr(db_transaction, key, value)
    
    db_transaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

# Cash Position CRUD Operations
def create_cash_position(position_data: Dict[str, Any], db: Session) -> CashPosition:
    """Create a new cash position"""
    db_position = CashPosition(**position_data)
    db.add(db_position)
    db.commit()
    db.refresh(db_position)
    return db_position

def get_cash_position_by_date(position_date: date, db: Session, tenant_id: str) -> Optional[CashPosition]:
    """Get cash position by date"""
    return db.query(CashPosition).filter(
        and_(
            func.date(CashPosition.position_date) == position_date,
            CashPosition.tenant_id == tenant_id
        )
    ).first()

def get_latest_cash_position(db: Session, tenant_id: str) -> Optional[CashPosition]:
    """Get the latest cash position"""
    return db.query(CashPosition).filter(
        CashPosition.tenant_id == tenant_id
    ).order_by(desc(CashPosition.position_date)).first()

def get_cash_positions_by_date_range(
    start_date: date, 
    end_date: date, 
    db: Session, 
    tenant_id: str
) -> List[CashPosition]:
    """Get cash positions by date range"""
    return db.query(CashPosition).filter(
        and_(
            func.date(CashPosition.position_date) >= start_date,
            func.date(CashPosition.position_date) <= end_date,
            CashPosition.tenant_id == tenant_id
        )
    ).order_by(asc(CashPosition.position_date)).all()

def update_cash_position(position_id: str, position_data: Dict[str, Any], db: Session, tenant_id: str) -> Optional[CashPosition]:
    """Update cash position"""
    db_position = db.query(CashPosition).filter(
        and_(
            CashPosition.id == position_id,
            CashPosition.tenant_id == tenant_id
        )
    ).first()
    
    if not db_position:
        return None
    
    for key, value in position_data.items():
        if hasattr(db_position, key):
            setattr(db_position, key, value)
    
    db_position.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_position)
    return db_position

# Banking Analytics Functions
def calculate_account_balance(account_id: str, db: Session, tenant_id: str, as_of_date: Optional[datetime] = None) -> Dict[str, float]:
    """Calculate account balance including pending transactions"""
    query = db.query(BankTransaction).filter(
        and_(
            BankTransaction.bank_account_id == account_id,
            BankTransaction.tenant_id == tenant_id,
            BankTransaction.status == TransactionStatus.COMPLETED
        )
    )
    
    if as_of_date:
        query = query.filter(BankTransaction.transaction_date <= as_of_date)
    
    transactions = query.all()
    
    current_balance = 0.0
    for transaction in transactions:
        if transaction.transaction_type in [TransactionType.DEPOSIT, TransactionType.TRANSFER_IN, TransactionType.REFUND, TransactionType.INTEREST]:
            current_balance += transaction.base_amount
        elif transaction.transaction_type in [TransactionType.WITHDRAWAL, TransactionType.TRANSFER_OUT, TransactionType.PAYMENT, TransactionType.FEE]:
            current_balance -= transaction.base_amount
    
    # Calculate pending balance
    pending_query = db.query(BankTransaction).filter(
        and_(
            BankTransaction.bank_account_id == account_id,
            BankTransaction.tenant_id == tenant_id,
            BankTransaction.status == TransactionStatus.PENDING
        )
    )
    
    if as_of_date:
        pending_query = pending_query.filter(BankTransaction.transaction_date <= as_of_date)
    
    pending_transactions = pending_query.all()
    
    pending_balance = 0.0
    for transaction in pending_transactions:
        if transaction.transaction_type in [TransactionType.DEPOSIT, TransactionType.TRANSFER_IN, TransactionType.REFUND, TransactionType.INTEREST]:
            pending_balance += transaction.base_amount
        elif transaction.transaction_type in [TransactionType.WITHDRAWAL, TransactionType.TRANSFER_OUT, TransactionType.PAYMENT, TransactionType.FEE]:
            pending_balance -= transaction.base_amount
    
    return {
        "current_balance": current_balance,
        "pending_balance": pending_balance,
        "available_balance": current_balance + pending_balance
    }

def get_banking_dashboard_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get banking dashboard summary data"""
    # Get all active bank accounts
    accounts = get_active_bank_accounts(db, tenant_id)
    
    total_bank_balance = 0.0
    total_available_balance = 0.0
    total_pending_balance = 0.0
    
    accounts_summary = []
    
    for account in accounts:
        balance_data = calculate_account_balance(account.id, db, tenant_id)
        total_bank_balance += balance_data["current_balance"]
        total_available_balance += balance_data["available_balance"]
        total_pending_balance += balance_data["pending_balance"]
        
        accounts_summary.append({
            "id": account.id,
            "name": account.account_name,
            "bank_name": account.bank_name,
            "account_type": account.account_type,
            "current_balance": balance_data["current_balance"],
            "available_balance": balance_data["available_balance"],
            "pending_balance": balance_data["pending_balance"]
        })
    
    # Get transaction counts
    total_transactions = db.query(func.count(BankTransaction.id)).filter(
        BankTransaction.tenant_id == tenant_id
    ).scalar() or 0
    
    online_transactions_count = db.query(func.count(OnlineTransaction.id)).filter(
        OnlineTransaction.tenant_id == tenant_id
    ).scalar() or 0
    
    pending_transactions_count = db.query(func.count(BankTransaction.id)).filter(
        and_(
            BankTransaction.tenant_id == tenant_id,
            BankTransaction.status == TransactionStatus.PENDING
        )
    ).scalar() or 0
    
    # Get today's cash flow
    today = datetime.now().date()
    today_transactions = db.query(BankTransaction).filter(
        and_(
            BankTransaction.tenant_id == tenant_id,
            func.date(BankTransaction.transaction_date) == today,
            BankTransaction.status == TransactionStatus.COMPLETED
        )
    ).all()
    
    daily_inflow = 0.0
    daily_outflow = 0.0
    
    for transaction in today_transactions:
        if transaction.transaction_type in [TransactionType.DEPOSIT, TransactionType.TRANSFER_IN, TransactionType.REFUND, TransactionType.INTEREST]:
            daily_inflow += transaction.base_amount
        elif transaction.transaction_type in [TransactionType.WITHDRAWAL, TransactionType.TRANSFER_OUT, TransactionType.PAYMENT, TransactionType.FEE]:
            daily_outflow += transaction.base_amount
    
    net_cash_flow = daily_inflow - daily_outflow
    
    # Get recent transactions
    recent_transactions = db.query(BankTransaction).filter(
        BankTransaction.tenant_id == tenant_id
    ).order_by(desc(BankTransaction.transaction_date)).limit(10).all()
    
    # Calculate outstanding receivables and payables
    # For now, we'll set these to 0 as they would typically come from invoice/expense modules
    outstanding_receivables = 0.0
    outstanding_payables = 0.0
    
    return {
        "total_bank_balance": total_bank_balance,
        "total_available_balance": total_available_balance,
        "total_pending_balance": total_pending_balance,
        "total_online_transactions": online_transactions_count,
        "pending_transactions_count": pending_transactions_count,
        "daily_inflow": daily_inflow,
        "daily_outflow": daily_outflow,
        "net_cash_flow": net_cash_flow,
        "outstanding_receivables": outstanding_receivables,
        "outstanding_payables": outstanding_payables,
        "recent_transactions": recent_transactions,
        "bank_accounts_summary": accounts_summary
    }
