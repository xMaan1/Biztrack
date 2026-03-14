from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import (
    get_expense_category_by_id,
    create_expense_category,
    update_expense_category,
    delete_expense_category,
)
from ...models.healthcare_models import ExpenseCategoryCreate, ExpenseCategoryUpdate
from ..mappers import db_expense_category_to_pydantic


def create_expense_category_handler(tenant_id: str, body: ExpenseCategoryCreate, db: Session):
    category_data = {
        "tenant_id": tenant_id,
        "name": body.name,
        "description": body.description,
        "is_active": True,
    }
    db_category = create_expense_category(category_data, db)
    return db_expense_category_to_pydantic(db_category)


def update_expense_category_handler(tenant_id: str, category_id: str, body: ExpenseCategoryUpdate, db: Session):
    db_category = get_expense_category_by_id(category_id, db, tenant_id)
    if not db_category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense category not found")
    update_data = body.model_dump(exclude_unset=True)
    updated = update_expense_category(category_id, update_data, db, tenant_id)
    return db_expense_category_to_pydantic(updated)


def delete_expense_category_handler(tenant_id: str, category_id: str, db: Session) -> None:
    from ...config.database import get_daily_expenses_count
    if get_daily_expenses_count(db, tenant_id, category_id=category_id) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category that has expenses. Remove or reassign expenses first.",
        )
    deleted = delete_expense_category(category_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense category not found")
