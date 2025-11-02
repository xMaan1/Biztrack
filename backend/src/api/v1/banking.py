"""
Banking API Endpoints
"""

import uuid
from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from ...config.database import get_db
from ...api.dependencies import get_current_user, get_tenant_context
from ...config.core_models import User
from ...models.banking_models import (
    BankAccount, BankAccountCreate, BankAccountUpdate, BankAccountResponse, BankAccountsResponse,
    BankTransaction as BankTransactionModel, BankTransactionCreate, BankTransactionUpdate, BankTransactionResponse, BankTransactionsResponse,
    CashPosition, CashPositionCreate, CashPositionUpdate, CashPositionResponse, CashPositionsResponse,
    BankingDashboard, ReconciliationSummary, TransactionReconciliation,
    BankAccountType, TransactionType, TransactionStatus, PaymentMethod,
    Till, TillCreate, TillUpdate, TillResponse, TillsResponse,
    TillTransaction as TillTransactionModel, TillTransactionCreate, TillTransactionUpdate, TillTransactionResponse, TillTransactionsResponse,
    TillTransactionType
)
from ...config.banking_models import BankTransaction
from ...config.banking_crud import (
    # Bank Account CRUD
    create_bank_account, get_bank_account_by_id, get_all_bank_accounts, get_active_bank_accounts,
    get_primary_bank_account, update_bank_account, delete_bank_account,
    
    # Bank Transaction CRUD
    create_bank_transaction, get_bank_transaction_by_id, get_all_bank_transactions,
    get_transactions_by_account, get_unreconciled_transactions, update_bank_transaction,
    delete_bank_transaction, reconcile_transaction,
    
    # Cash Position CRUD
    create_cash_position, get_cash_position_by_date, get_latest_cash_position,
    get_cash_positions_by_date_range, update_cash_position,
    
    # Analytics
    calculate_account_balance, get_banking_dashboard_data,
    
    # Till CRUD
    create_till, get_till_by_id, get_all_tills, update_till, delete_till,
    
    # Till Transaction CRUD
    create_till_transaction, get_till_transaction_by_id, get_all_till_transactions,
    update_till_transaction, delete_till_transaction
)

router = APIRouter(prefix="/banking", tags=["Banking"])

# Bank Account Endpoints
@router.post("/accounts", response_model=BankAccountResponse, status_code=status.HTTP_201_CREATED)
def create_bank_account_endpoint(
    account: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new bank account"""
    try:
        account_data = account.dict()
        account_data.update({
            "id": str(uuid.uuid4()),
            "tenant_id": str(tenant_context["tenant_id"]),
            "created_by": str(current_user.id),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        db_account = create_bank_account(account_data, db)
        return BankAccountResponse(bank_account=db_account)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create bank account: {str(e)}")

@router.get("/accounts", response_model=BankAccountsResponse)
def get_bank_accounts_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all bank accounts"""
    try:
        if active_only:
            accounts = get_active_bank_accounts(db, str(tenant_context["tenant_id"]))
        else:
            accounts = get_all_bank_accounts(db, str(tenant_context["tenant_id"]), skip, limit)
        
        response = BankAccountsResponse(bank_accounts=accounts, total=len(accounts))
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch bank accounts: {str(e)}")

@router.get("/accounts/{account_id}", response_model=BankAccountResponse)
def get_bank_account_endpoint(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific bank account"""
    account = get_bank_account_by_id(account_id, db, str(tenant_context["tenant_id"]))
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    
    return BankAccountResponse(bank_account=account)

@router.put("/accounts/{account_id}", response_model=BankAccountResponse)
def update_bank_account_endpoint(
    account_id: str,
    account: BankAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update a bank account"""
    try:
        account_data = account.dict(exclude_unset=True)
        account_data["updated_at"] = datetime.utcnow()
        
        db_account = update_bank_account(account_id, account_data, db, str(tenant_context["tenant_id"]))
        if not db_account:
            raise HTTPException(status_code=404, detail="Bank account not found")
        
        return BankAccountResponse(bank_account=db_account)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update bank account: {str(e)}")

@router.delete("/accounts/{account_id}")
def delete_bank_account_endpoint(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a bank account (soft delete)"""
    success = delete_bank_account(account_id, db, str(tenant_context["tenant_id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Bank account not found")
    
    return {"message": "Bank account deleted successfully"}

# Bank Transaction Endpoints
@router.post("/transactions", response_model=BankTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_bank_transaction_endpoint(
    transaction: BankTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new bank transaction"""
    try:
        # Generate transaction number
        transaction_number = f"BT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        transaction_data = transaction.dict()
        transaction_data.update({
            "id": str(uuid.uuid4()),
            "tenant_id": str(tenant_context["tenant_id"]),
            "transaction_number": transaction_number,
            "created_by": str(current_user.id),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        db_transaction = create_bank_transaction(transaction_data, db)
        return BankTransactionResponse(bank_transaction=db_transaction)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create bank transaction: {str(e)}")

@router.get("/transactions", response_model=BankTransactionsResponse)
def get_bank_transactions_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    account_id: Optional[str] = Query(None),
    transaction_type: Optional[TransactionType] = Query(None),
    status: Optional[TransactionStatus] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get bank transactions with optional filters"""
    try:
        transactions = get_all_bank_transactions(
            db, str(tenant_context["tenant_id"]), skip, limit,
            account_id, transaction_type, status, start_date, end_date
        )
        
        return BankTransactionsResponse(bank_transactions=transactions, total=len(transactions))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch bank transactions: {str(e)}")

@router.get("/transactions/{transaction_id}", response_model=BankTransactionResponse)
def get_bank_transaction_endpoint(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific bank transaction"""
    transaction = get_bank_transaction_by_id(transaction_id, db, str(tenant_context["tenant_id"]))
    if not transaction:
        raise HTTPException(status_code=404, detail="Bank transaction not found")
    
    return BankTransactionResponse(bank_transaction=transaction)

@router.put("/transactions/{transaction_id}", response_model=BankTransactionResponse)
def update_bank_transaction_endpoint(
    transaction_id: str,
    transaction: BankTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update a bank transaction"""
    try:
        transaction_data = transaction.dict(exclude_unset=True)
        transaction_data["updated_at"] = datetime.utcnow()
        
        db_transaction = update_bank_transaction(transaction_id, transaction_data, db, str(tenant_context["tenant_id"]))
        if not db_transaction:
            raise HTTPException(status_code=404, detail="Bank transaction not found")
        
        return BankTransactionResponse(bank_transaction=db_transaction)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update bank transaction: {str(e)}")

@router.delete("/transactions/{transaction_id}")
def delete_bank_transaction_endpoint(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a bank transaction"""
    try:
        success = delete_bank_transaction(transaction_id, db, str(tenant_context["tenant_id"]))
        if not success:
            raise HTTPException(status_code=404, detail="Bank transaction not found")
        
        return {"message": "Bank transaction deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete bank transaction: {str(e)}")

@router.post("/transactions/{transaction_id}/reconcile")
def reconcile_transaction_endpoint(
    transaction_id: str,
    reconciliation: TransactionReconciliation,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Reconcile a bank transaction"""
    try:
        db_transaction = reconcile_transaction(
            transaction_id, str(current_user.id), reconciliation.notes,
            db, str(tenant_context["tenant_id"])
        )
        
        if not db_transaction:
            raise HTTPException(status_code=404, detail="Bank transaction not found")
        
        return {"message": "Transaction reconciled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reconcile transaction: {str(e)}")

# Cash Position Endpoints
@router.get("/cash-position", response_model=CashPositionResponse)
def get_latest_cash_position_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get the latest cash position"""
    try:
        position = get_latest_cash_position(db, str(tenant_context["tenant_id"]))
        if not position:
            raise HTTPException(status_code=404, detail="No cash position found")
        
        return CashPositionResponse(cash_position=position)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cash position: {str(e)}")

@router.get("/cash-position/{position_date}", response_model=CashPositionResponse)
def get_cash_position_by_date_endpoint(
    position_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get cash position by specific date"""
    try:
        position = get_cash_position_by_date(position_date, db, str(tenant_context["tenant_id"]))
        if not position:
            raise HTTPException(status_code=404, detail="Cash position not found for this date")
        
        return CashPositionResponse(cash_position=position)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cash position: {str(e)}")

# Dashboard Endpoint
@router.get("/dashboard", response_model=BankingDashboard)
def get_banking_dashboard_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get banking dashboard data"""
    try:
        dashboard_data = get_banking_dashboard_data(db, str(tenant_context["tenant_id"]))
        return BankingDashboard(**dashboard_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch banking dashboard: {str(e)}")

# Account Balance Endpoint
@router.get("/accounts/{account_id}/balance")
def get_account_balance_endpoint(
    account_id: str,
    as_of_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get account balance"""
    try:
        # Verify account exists and belongs to tenant
        account = get_bank_account_by_id(account_id, db, str(tenant_context["tenant_id"]))
        if not account:
            raise HTTPException(status_code=404, detail="Bank account not found")
        
        balance_data = calculate_account_balance(account_id, db, str(tenant_context["tenant_id"]), as_of_date)
        return balance_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate account balance: {str(e)}")

# Reconciliation Endpoint
@router.get("/reconciliation/summary", response_model=ReconciliationSummary)
def get_reconciliation_summary_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get reconciliation summary"""
    try:
        tenant_id = str(tenant_context["tenant_id"])

        # Get total transactions count
        total_transactions = db.query(func.count(BankTransaction.id)).filter(
            BankTransaction.tenant_id == tenant_id
        ).scalar() or 0

        # Get unreconciled transactions count
        unreconciled_count = db.query(func.count(BankTransaction.id)).filter(
            and_(
                BankTransaction.tenant_id == tenant_id,
                BankTransaction.is_reconciled == False
            )
        ).scalar() or 0

        reconciled_count = total_transactions - unreconciled_count
        reconciliation_percentage = (reconciled_count / total_transactions * 100) if total_transactions > 0 else 0

        # Get last reconciliation date
        last_reconciliation = db.query(func.max(BankTransaction.reconciled_date)).filter(
            and_(
                BankTransaction.tenant_id == tenant_id,
                BankTransaction.is_reconciled == True
            )
        ).scalar()

        return ReconciliationSummary(
            total_transactions=total_transactions,
            reconciled_transactions=reconciled_count,
            unreconciled_transactions=unreconciled_count,
            reconciliation_percentage=round(reconciliation_percentage, 2),
            last_reconciliation_date=last_reconciliation
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reconciliation summary: {str(e)}")

# ========================================
# Till Endpoints
# ========================================

@router.post("/tills", response_model=TillResponse, status_code=status.HTTP_201_CREATED)
def create_till_endpoint(
    till: TillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new till"""
    try:
        till_data = till.dict()
        till_data["tenant_id"] = tenant_context["tenant_id"]
        till_data["created_by"] = current_user.id
        till_data["id"] = str(uuid.uuid4())
        
        db_till = create_till(till_data, db)
        return TillResponse(till=db_till)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create till: {str(e)}")

@router.get("/tills", response_model=TillsResponse)
def get_tills_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all tills"""
    try:
        tills = get_all_tills(db, str(tenant_context["tenant_id"]), skip, limit)
        return TillsResponse(tills=tills, total=len(tills))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tills: {str(e)}")

@router.get("/tills/{till_id}", response_model=TillResponse)
def get_till_endpoint(
    till_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get till by ID"""
    try:
        till = get_till_by_id(till_id, db, str(tenant_context["tenant_id"]))
        if not till:
            raise HTTPException(status_code=404, detail="Till not found")
        
        return TillResponse(till=till)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch till: {str(e)}")

@router.put("/tills/{till_id}", response_model=TillResponse)
def update_till_endpoint(
    till_id: str,
    till_update: TillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update till"""
    try:
        update_data = till_update.dict(exclude_unset=True)
        till = update_till(till_id, update_data, db, str(tenant_context["tenant_id"]))
        
        if not till:
            raise HTTPException(status_code=404, detail="Till not found")
        
        return TillResponse(till=till)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update till: {str(e)}")

@router.delete("/tills/{till_id}")
def delete_till_endpoint(
    till_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete till"""
    try:
        success = delete_till(till_id, db, str(tenant_context["tenant_id"]))
        if not success:
            raise HTTPException(status_code=404, detail="Till not found")
        
        return {"message": "Till deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete till: {str(e)}")

# ========================================
# Till Transaction Endpoints
# ========================================

@router.post("/till-transactions", response_model=TillTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_till_transaction_endpoint(
    transaction: TillTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new till transaction"""
    try:
        transaction_data = transaction.dict()
        transaction_data["tenant_id"] = tenant_context["tenant_id"]
        transaction_data["performed_by"] = current_user.id
        transaction_data["id"] = str(uuid.uuid4())
        transaction_data["transaction_number"] = f"TILL-{uuid.uuid4().hex[:8].upper()}"
        transaction_data["transaction_date"] = datetime.utcnow()
        
        db_transaction = create_till_transaction(transaction_data, db)
        return TillTransactionResponse(till_transaction=db_transaction)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create till transaction: {str(e)}")

@router.get("/till-transactions", response_model=TillTransactionsResponse)
def get_till_transactions_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    till_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all till transactions"""
    try:
        transactions = get_all_till_transactions(db, str(tenant_context["tenant_id"]), till_id, skip, limit)
        return TillTransactionsResponse(till_transactions=transactions, total=len(transactions))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch till transactions: {str(e)}")

@router.get("/till-transactions/{transaction_id}", response_model=TillTransactionResponse)
def get_till_transaction_endpoint(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get till transaction by ID"""
    try:
        transaction = get_till_transaction_by_id(transaction_id, db, str(tenant_context["tenant_id"]))
        if not transaction:
            raise HTTPException(status_code=404, detail="Till transaction not found")
        
        return TillTransactionResponse(till_transaction=transaction)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch till transaction: {str(e)}")

@router.put("/till-transactions/{transaction_id}", response_model=TillTransactionResponse)
def update_till_transaction_endpoint(
    transaction_id: str,
    transaction_update: TillTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update till transaction"""
    try:
        update_data = {k: v for k, v in transaction_update.dict().items() if v is not None}
        transaction = update_till_transaction(transaction_id, update_data, db, str(tenant_context["tenant_id"]))
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Till transaction not found")
        
        return TillTransactionResponse(till_transaction=transaction)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update till transaction: {str(e)}")

@router.delete("/till-transactions/{transaction_id}")
def delete_till_transaction_endpoint(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete till transaction"""
    try:
        success = delete_till_transaction(transaction_id, db, str(tenant_context["tenant_id"]))
        if not success:
            raise HTTPException(status_code=404, detail="Till transaction not found")
        
        return {"message": "Till transaction deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete till transaction: {str(e)}")
