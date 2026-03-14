from ...models.healthcare_models import (
    ExpenseCategory as ExpenseCategoryPydantic,
    DailyExpense as DailyExpensePydantic,
)


def db_expense_category_to_pydantic(db_category) -> ExpenseCategoryPydantic:
    return ExpenseCategoryPydantic(
        id=str(db_category.id),
        tenant_id=str(db_category.tenant_id),
        name=db_category.name,
        description=db_category.description,
        is_active=db_category.is_active if hasattr(db_category, "is_active") else True,
        createdAt=db_category.createdAt,
        updatedAt=db_category.updatedAt,
    )


def db_daily_expense_to_pydantic(db_expense, category_name: str = None) -> DailyExpensePydantic:
    return DailyExpensePydantic(
        id=str(db_expense.id),
        tenant_id=str(db_expense.tenant_id),
        category_id=str(db_expense.category_id),
        category_name=category_name or (db_expense.category.name if hasattr(db_expense, "category") and db_expense.category else None),
        expense_date=db_expense.expense_date,
        amount=float(db_expense.amount) if db_expense.amount is not None else 0.0,
        description=db_expense.description,
        is_active=db_expense.is_active if hasattr(db_expense, "is_active") else True,
        createdAt=db_expense.createdAt,
        updatedAt=db_expense.updatedAt,
    )
