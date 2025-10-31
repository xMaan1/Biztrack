"""
Banking CRUD Operations
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, date
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, func, desc, asc
from .banking_models import (
    BankAccount, BankTransaction, CashPosition, Till, TillTransaction,
    BankAccountType, TransactionType, TransactionStatus, PaymentMethod, TillTransactionType
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

def delete_bank_transaction(transaction_id: str, db: Session, tenant_id: str) -> bool:
    """Delete bank transaction"""
    db_transaction = get_bank_transaction_by_id(transaction_id, db, tenant_id)
    if not db_transaction:
        return False
    
    db.delete(db_transaction)
    db.commit()
    return True

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
        
        # If no transactions exist, use stored account balances
        if balance_data["current_balance"] == 0.0 and account.current_balance != 0.0:
            balance_data["current_balance"] = account.current_balance
            balance_data["available_balance"] = account.available_balance
            balance_data["pending_balance"] = account.pending_balance
        
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
    
    online_transactions_count = 0
    
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
    
    recent_transactions = db.query(BankTransaction).filter(
        BankTransaction.tenant_id == tenant_id
    ).order_by(desc(BankTransaction.transaction_date)).limit(10).all()
    
    for transaction in recent_transactions:
        if transaction.running_balance is None:
            transaction.running_balance = 0.0
    
    outstanding_receivables = 0.0
    outstanding_payables = 0.0
    
    return {
        "total_bank_balance": total_bank_balance,
        "total_available_balance": total_available_balance,
        "total_pending_balance": total_pending_balance,
        "total_transactions": total_transactions,
        "pending_transactions_count": pending_transactions_count,
        "daily_inflow": daily_inflow,
        "daily_outflow": daily_outflow,
        "net_cash_flow": net_cash_flow,
        "outstanding_receivables": outstanding_receivables,
        "outstanding_payables": outstanding_payables,
        "recent_transactions": recent_transactions,
        "bank_accounts_summary": accounts_summary
    }

# Till CRUD Operations
def create_till(till_data: Dict[str, Any], db: Session) -> Till:
    """Create a new till"""
    db_till = Till(**till_data)
    db_till.current_balance = db_till.initial_balance
    db.add(db_till)
    db.commit()
    db.refresh(db_till)
    return db_till

def get_till_by_id(till_id: str, db: Session, tenant_id: str) -> Optional[Till]:
    """Get till by ID"""
    return db.query(Till).filter(
        and_(
            Till.id == till_id,
            Till.tenant_id == tenant_id
        )
    ).first()

def get_all_tills(db: Session, tenant_id: str, skip: int = 0, limit: int = 100) -> List[Till]:
    """Get all tills for a tenant"""
    return db.query(Till).filter(
        Till.tenant_id == tenant_id
    ).offset(skip).limit(limit).all()

def update_till(till_id: str, till_data: Dict[str, Any], db: Session, tenant_id: str) -> Optional[Till]:
    """Update till"""
    db_till = get_till_by_id(till_id, db, tenant_id)
    if not db_till:
        return None
    
    for key, value in till_data.items():
        if hasattr(db_till, key):
            setattr(db_till, key, value)
    
    db_till.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_till)
    return db_till

def delete_till(till_id: str, db: Session, tenant_id: str) -> bool:
    """Delete till (soft delete by setting is_active to False)"""
    db_till = get_till_by_id(till_id, db, tenant_id)
    if not db_till:
        return False
    
    db_till.is_active = False
    db_till.updated_at = datetime.utcnow()
    db.commit()
    return True

# Till Transaction CRUD Operations
def calculate_till_balance(till_id: str, db: Session, tenant_id: str) -> float:
    """Calculate current balance for a till"""
    last_transaction = db.query(TillTransaction).filter(
        and_(
            TillTransaction.till_id == till_id,
            TillTransaction.tenant_id == tenant_id
        )
    ).order_by(TillTransaction.transaction_date.desc()).first()
    
    if last_transaction:
        return last_transaction.running_balance
    else:
        till = get_till_by_id(till_id, db, tenant_id)
        return till.initial_balance if till else 0.0

def create_till_transaction(transaction_data: Dict[str, Any], db: Session) -> TillTransaction:
    """Create a new till transaction with running balance calculation"""
    till_id = transaction_data.get("till_id")
    tenant_id = transaction_data.get("tenant_id")
    transaction_type = transaction_data.get("transaction_type")
    amount = transaction_data.get("amount")
    
    current_balance = calculate_till_balance(till_id, db, tenant_id)
    
    if transaction_type == TillTransactionType.DEPOSIT:
        new_balance = current_balance + amount
    elif transaction_type == TillTransactionType.WITHDRAWAL:
        new_balance = current_balance - amount
    else:
        new_balance = current_balance + amount
    
    transaction_data["running_balance"] = new_balance
    
    db_transaction = TillTransaction(**transaction_data)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    till = get_till_by_id(till_id, db, tenant_id)
    till.current_balance = new_balance
    till.updated_at = datetime.utcnow()
    db.commit()
    
    return db_transaction

def get_till_transaction_by_id(transaction_id: str, db: Session, tenant_id: str) -> Optional[TillTransaction]:
    """Get till transaction by ID"""
    return db.query(TillTransaction).options(
        selectinload(TillTransaction.bank_account)
    ).filter(
        and_(
            TillTransaction.id == transaction_id,
            TillTransaction.tenant_id == tenant_id
        )
    ).first()

def get_all_till_transactions(db: Session, tenant_id: str, till_id: Optional[str] = None, 
                             skip: int = 0, limit: int = 100) -> List[TillTransaction]:
    """Get all till transactions"""
    query = db.query(TillTransaction).options(
        selectinload(TillTransaction.bank_account)
    ).filter(
        TillTransaction.tenant_id == tenant_id
    )
    
    if till_id:
        query = query.filter(TillTransaction.till_id == till_id)
    
    return query.order_by(TillTransaction.transaction_date.desc()).offset(skip).limit(limit).all()

def update_till_transaction(transaction_id: str, transaction_data: Dict[str, Any], 
                           db: Session, tenant_id: str) -> Optional[TillTransaction]:
    """Update till transaction"""
    db_transaction = get_till_transaction_by_id(transaction_id, db, tenant_id)
    if not db_transaction:
        return None
    
    for key, value in transaction_data.items():
        if hasattr(db_transaction, key):
            setattr(db_transaction, key, value)
    
    db.commit()
    db.refresh(db_transaction)
    
    till = get_till_by_id(str(db_transaction.till_id), db, tenant_id)
    current_balance = calculate_till_balance(str(db_transaction.till_id), db, tenant_id)
    till.current_balance = current_balance
    till.updated_at = datetime.utcnow()
    db.commit()
    
    return db_transaction

def delete_till_transaction(transaction_id: str, db: Session, tenant_id: str) -> bool:
    """Delete till transaction"""
    db_transaction = get_till_transaction_by_id(transaction_id, db, tenant_id)
    if not db_transaction:
        return False
    
    till_id = str(db_transaction.till_id)
    db.delete(db_transaction)
    db.commit()
    
    till = get_till_by_id(till_id, db, tenant_id)
    current_balance = calculate_till_balance(till_id, db, tenant_id)
    till.current_balance = current_balance
    till.updated_at = datetime.utcnow()
    db.commit()
    
    return True
