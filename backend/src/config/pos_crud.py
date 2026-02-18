from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from .pos_models import POSShift, POSTransaction, PosProductCategory

# POS Shift functions
def get_pos_shift_by_id(shift_id: str, db: Session, tenant_id: str = None) -> Optional[POSShift]:
    query = db.query(POSShift).filter(POSShift.id == shift_id)
    if tenant_id:
        query = query.filter(POSShift.tenant_id == tenant_id)
    return query.first()

def get_all_pos_shifts(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[POSShift]:
    query = db.query(POSShift)
    if tenant_id:
        query = query.filter(POSShift.tenant_id == tenant_id)
    return query.order_by(POSShift.createdAt.desc()).offset(skip).limit(limit).all()

def get_open_pos_shift(employee_id: str, db: Session, tenant_id: str = None) -> Optional[POSShift]:
    query = db.query(POSShift).filter(
        POSShift.employeeId == employee_id,
        POSShift.status == "open"
    )
    if tenant_id:
        query = query.filter(POSShift.tenant_id == tenant_id)
    return query.first()

def create_pos_shift(shift_data: dict, db: Session) -> POSShift:
    db_shift = POSShift(**shift_data)
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    return db_shift

def update_pos_shift(shift_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[POSShift]:
    shift = get_pos_shift_by_id(shift_id, db, tenant_id)
    if shift:
        for key, value in update_data.items():
            if hasattr(shift, key) and value is not None:
                setattr(shift, key, value)
        shift.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(shift)
    return shift

def delete_pos_shift(shift_id: str, db: Session, tenant_id: str = None) -> bool:
    shift = get_pos_shift_by_id(shift_id, db, tenant_id)
    if shift:
        db.delete(shift)
        db.commit()
        return True
    return False

# POS Transaction functions
def get_pos_transaction_by_id(transaction_id: str, db: Session, tenant_id: str = None) -> Optional[POSTransaction]:
    query = db.query(POSTransaction).filter(POSTransaction.id == transaction_id)
    if tenant_id:
        query = query.filter(POSTransaction.tenant_id == tenant_id)
    return query.first()

def get_all_pos_transactions(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[POSTransaction]:
    query = db.query(POSTransaction)
    if tenant_id:
        query = query.filter(POSTransaction.tenant_id == tenant_id)
    return query.order_by(POSTransaction.createdAt.desc()).offset(skip).limit(limit).all()

def get_pos_transactions_by_shift(shift_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[POSTransaction]:
    query = db.query(POSTransaction).filter(POSTransaction.shiftId == shift_id)
    if tenant_id:
        query = query.filter(POSTransaction.tenant_id == tenant_id)
    return query.order_by(POSTransaction.createdAt.desc()).offset(skip).limit(limit).all()

def get_pos_transactions_by_date_range(start_date: datetime, end_date: datetime, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[POSTransaction]:
    query = db.query(POSTransaction).filter(
        POSTransaction.createdAt >= start_date,
        POSTransaction.createdAt <= end_date
    )
    if tenant_id:
        query = query.filter(POSTransaction.tenant_id == tenant_id)
    return query.order_by(POSTransaction.createdAt.desc()).offset(skip).limit(limit).all()

def create_pos_transaction(transaction_data: dict, db: Session) -> POSTransaction:
    db_transaction = POSTransaction(**transaction_data)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def update_pos_transaction(transaction_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[POSTransaction]:
    transaction = get_pos_transaction_by_id(transaction_id, db, tenant_id)
    if transaction:
        for key, value in update_data.items():
            if hasattr(transaction, key) and value is not None:
                setattr(transaction, key, value)
        transaction.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(transaction)
    return transaction

def delete_pos_transaction(transaction_id: str, db: Session, tenant_id: str = None) -> bool:
    transaction = get_pos_transaction_by_id(transaction_id, db, tenant_id)
    if transaction:
        db.delete(transaction)
        db.commit()
        return True
    return False

# Alias functions for backward compatibility
def get_pos_shifts(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[POSShift]:
    """Get all POS shifts (alias for get_all_pos_shifts)"""
    return get_all_pos_shifts(db, tenant_id, skip, limit)

def get_pos_transactions(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[POSTransaction]:
    """Get all POS transactions (alias for get_all_pos_transactions)"""
    return get_all_pos_transactions(db, tenant_id, skip, limit)


def get_pos_categories(db: Session, tenant_id: str) -> List[PosProductCategory]:
    return db.query(PosProductCategory).filter(PosProductCategory.tenant_id == tenant_id).order_by(PosProductCategory.name).all()


def get_pos_category_by_id(category_id: str, db: Session, tenant_id: str) -> Optional[PosProductCategory]:
    return db.query(PosProductCategory).filter(
        PosProductCategory.id == category_id,
        PosProductCategory.tenant_id == tenant_id
    ).first()


def get_pos_category_by_name(name: str, db: Session, tenant_id: str) -> Optional[PosProductCategory]:
    return db.query(PosProductCategory).filter(
        PosProductCategory.tenant_id == tenant_id,
        func.lower(PosProductCategory.name) == name.strip().lower()
    ).first()


def create_pos_category(tenant_id: str, name: str, db: Session) -> PosProductCategory:
    cat = PosProductCategory(tenant_id=tenant_id, name=name.strip())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def delete_pos_category(category_id: str, db: Session, tenant_id: str) -> bool:
    cat = get_pos_category_by_id(category_id, db, tenant_id)
    if cat:
        db.delete(cat)
        db.commit()
        return True
    return False


# POS Dashboard functions
def get_pos_dashboard_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get POS dashboard statistics"""
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())
    
    # Today's transactions
    today_transactions = db.query(POSTransaction).filter(
        POSTransaction.tenant_id == tenant_id,
        POSTransaction.createdAt >= start_of_day,
        POSTransaction.createdAt <= end_of_day
    ).all()
    
    today_sales = sum(txn.total for txn in today_transactions)
    today_count = len(today_transactions)
    
    # Open shifts
    open_shifts = db.query(POSShift).filter(
        POSShift.tenant_id == tenant_id,
        POSShift.status == "open"
    ).count()
    
    # Total sales this month
    start_of_month = datetime(today.year, today.month, 1)
    month_transactions = db.query(POSTransaction).filter(
        POSTransaction.tenant_id == tenant_id,
        POSTransaction.createdAt >= start_of_month
    ).all()
    
    month_sales = sum(txn.total for txn in month_transactions)
    month_count = len(month_transactions)
    
    # Payment method breakdown
    payment_methods = db.query(
        POSTransaction.paymentMethod,
        func.count(POSTransaction.id),
        func.sum(POSTransaction.total)
    ).filter(
        POSTransaction.tenant_id == tenant_id,
        POSTransaction.createdAt >= start_of_day,
        POSTransaction.createdAt <= end_of_day
    ).group_by(POSTransaction.paymentMethod).all()
    
    payment_breakdown = {
        method: {"count": count, "total": float(total or 0)}
        for method, count, total in payment_methods
    }
    
    return {
        "today": {
            "sales": round(today_sales, 2),
            "transactions": today_count
        },
        "month": {
            "sales": round(month_sales, 2),
            "transactions": month_count
        },
        "open_shifts": open_shifts,
        "payment_methods": payment_breakdown
    }
