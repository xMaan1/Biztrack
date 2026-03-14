from typing import Optional, List
from datetime import date

from sqlalchemy.orm import Session

from ...config.database import get_daily_expenses, get_daily_expense_by_id, get_daily_expenses_count
from ...models.healthcare_models import DailyExpensesResponse, DailyExpense as DailyExpensePydantic
from ..mappers import db_daily_expense_to_pydantic


def list_daily_expenses_handler(
    tenant_id: str,
    db: Session,
    category_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 500,
) -> DailyExpensesResponse:
    skip = (page - 1) * limit
    db_expenses = get_daily_expenses(
        db,
        tenant_id,
        skip=skip,
        limit=limit,
        category_id=category_id,
        date_from=date_from,
        date_to=date_to,
        search=search,
        is_active=is_active,
    )
    total = get_daily_expenses_count(
        db, tenant_id, category_id=category_id, date_from=date_from, date_to=date_to, search=search, is_active=is_active
    )
    out: List[DailyExpensePydantic] = [
        db_daily_expense_to_pydantic(e) for e in db_expenses
    ]
    return DailyExpensesResponse(expenses=out, total=total)


def get_daily_expense_handler(tenant_id: str, expense_id: str, db: Session) -> DailyExpensePydantic:
    db_expense = get_daily_expense_by_id(expense_id, db, tenant_id)
    if not db_expense:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily expense not found")
    return db_daily_expense_to_pydantic(db_expense)
