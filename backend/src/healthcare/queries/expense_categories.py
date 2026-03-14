from typing import Optional, List

from sqlalchemy.orm import Session

from ...config.database import get_expense_categories, get_expense_category_by_id, get_expense_categories_count
from ...models.healthcare_models import ExpenseCategoriesResponse, ExpenseCategory as ExpenseCategoryPydantic
from ..mappers import db_expense_category_to_pydantic


def list_expense_categories_handler(
    tenant_id: str,
    db: Session,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 500,
) -> ExpenseCategoriesResponse:
    skip = (page - 1) * limit
    db_categories = get_expense_categories(
        db, tenant_id, skip=skip, limit=limit, search=search, is_active=is_active
    )
    total = get_expense_categories_count(db, tenant_id, search=search, is_active=is_active)
    out: List[ExpenseCategoryPydantic] = [db_expense_category_to_pydantic(c) for c in db_categories]
    return ExpenseCategoriesResponse(categories=out, total=total)


def get_expense_category_handler(tenant_id: str, category_id: str, db: Session) -> ExpenseCategoryPydantic:
    db_category = get_expense_category_by_id(category_id, db, tenant_id)
    if not db_category:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense category not found")
    return db_expense_category_to_pydantic(db_category)
