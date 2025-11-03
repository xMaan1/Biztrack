from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.ledger_entity import (
    ChartOfAccounts, JournalEntry, LedgerTransaction,
    FinancialPeriod, Budget, BudgetItem, AccountReceivable
)

class ChartOfAccountsRepository(BaseRepository[ChartOfAccounts]):
    def __init__(self, session: Session):
        super().__init__(session, ChartOfAccounts)

    def get_by_code(self, account_code: str, tenant_id: Optional[str] = None) -> Optional[ChartOfAccounts]:
        query = self._session.query(ChartOfAccounts).filter(ChartOfAccounts.account_code == account_code)
        if tenant_id:
            query = query.filter(ChartOfAccounts.tenant_id == tenant_id)
        return query.first()

class JournalEntryRepository(BaseRepository[JournalEntry]):
    def __init__(self, session: Session):
        super().__init__(session, JournalEntry)

class LedgerTransactionRepository(BaseRepository[LedgerTransaction]):
    def __init__(self, session: Session):
        super().__init__(session, LedgerTransaction)

class FinancialPeriodRepository(BaseRepository[FinancialPeriod]):
    def __init__(self, session: Session):
        super().__init__(session, FinancialPeriod)

class BudgetRepository(BaseRepository[Budget]):
    def __init__(self, session: Session):
        super().__init__(session, Budget)

class BudgetItemRepository(BaseRepository[BudgetItem]):
    def __init__(self, session: Session):
        super().__init__(session, BudgetItem)

    def get_by_budget(self, budget_id: str) -> List[BudgetItem]:
        return self._session.query(BudgetItem).filter(BudgetItem.budget_id == budget_id).all()

class AccountReceivableRepository(BaseRepository[AccountReceivable]):
    def __init__(self, session: Session):
        super().__init__(session, AccountReceivable)

    def get_by_invoice_id(self, invoice_id: str, tenant_id: Optional[str] = None) -> Optional[AccountReceivable]:
        query = self._session.query(AccountReceivable).filter(AccountReceivable.invoice_id == invoice_id)
        if tenant_id:
            query = query.filter(AccountReceivable.tenant_id == tenant_id)
        return query.first()

