from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import (
    get_daily_expense_by_id,
    get_expense_category_by_id,
    create_daily_expense,
    update_daily_expense,
    delete_daily_expense,
)
from ...models.healthcare_models import DailyExpenseCreate, DailyExpenseUpdate
from ..mappers import db_daily_expense_to_pydantic


def create_daily_expense_handler(tenant_id: str, body: DailyExpenseCreate, db: Session):
    category = get_expense_category_by_id(body.category_id, db, tenant_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense category not found")
    expense_data = {
        "tenant_id": tenant_id,
        "category_id": body.category_id,
        "expense_date": body.expense_date,
        "amount": body.amount,
        "description": body.description,
        "is_active": True,
    }
    db_expense = create_daily_expense(expense_data, db)
    db.refresh(db_expense)
    from sqlalchemy.orm import joinedload
    from ...config.healthcare_models import DailyExpense
    db_expense = db.query(DailyExpense).options(joinedload(DailyExpense.category)).filter(DailyExpense.id == db_expense.id).first()
    return db_daily_expense_to_pydantic(db_expense)


def update_daily_expense_handler(tenant_id: str, expense_id: str, body: DailyExpenseUpdate, db: Session):
    db_expense = get_daily_expense_by_id(expense_id, db, tenant_id)
    if not db_expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily expense not found")
    if body.category_id is not None:
        category = get_expense_category_by_id(body.category_id, db, tenant_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense category not found")
    update_data = body.model_dump(exclude_unset=True)
    updated = update_daily_expense(expense_id, update_data, db, tenant_id)
    db.refresh(updated)
    from sqlalchemy.orm import joinedload
    from ...config.healthcare_models import DailyExpense
    updated = db.query(DailyExpense).options(joinedload(DailyExpense.category)).filter(DailyExpense.id == updated.id).first()
    return db_daily_expense_to_pydantic(updated)


def delete_daily_expense_handler(tenant_id: str, expense_id: str, db: Session) -> None:
    deleted = delete_daily_expense(expense_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily expense not found")
