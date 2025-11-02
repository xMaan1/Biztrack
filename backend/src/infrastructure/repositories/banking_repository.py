from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ...infrastructure.repository import BaseRepository
from ...domain.entities.banking_entity import BankAccount, BankTransaction, CashPosition, Till, TillTransaction

class BankAccountRepository(BaseRepository[BankAccount]):
    def __init__(self, session: Session):
        super().__init__(session, BankAccount)

    def get_active_accounts(self, tenant_id: str) -> List[BankAccount]:
        return self._session.query(BankAccount).filter(
            and_(
                BankAccount.tenant_id == tenant_id,
                BankAccount.is_active == True
            )
        ).all()

    def get_primary_account(self, tenant_id: str) -> Optional[BankAccount]:
        return self._session.query(BankAccount).filter(
            and_(
                BankAccount.tenant_id == tenant_id,
                BankAccount.is_primary == True
            )
        ).first()

class BankTransactionRepository(BaseRepository[BankTransaction]):
    def __init__(self, session: Session):
        super().__init__(session, BankTransaction)

    def get_by_account(self, account_id: str, tenant_id: Optional[str] = None) -> List[BankTransaction]:
        query = self._session.query(BankTransaction).filter(BankTransaction.bank_account_id == account_id)
        if tenant_id:
            query = query.filter(BankTransaction.tenant_id == tenant_id)
        return query.order_by(BankTransaction.transaction_date.desc()).all()

class CashPositionRepository(BaseRepository[CashPosition]):
    def __init__(self, session: Session):
        super().__init__(session, CashPosition)

class TillRepository(BaseRepository[Till]):
    def __init__(self, session: Session):
        super().__init__(session, Till)

    def get_active_tills(self, tenant_id: str) -> List[Till]:
        return self._session.query(Till).filter(
            and_(
                Till.tenant_id == tenant_id,
                Till.is_active == True
            )
        ).all()

class TillTransactionRepository(BaseRepository[TillTransaction]):
    def __init__(self, session: Session):
        super().__init__(session, TillTransaction)

    def get_by_till(self, till_id: str, tenant_id: Optional[str] = None) -> List[TillTransaction]:
        query = self._session.query(TillTransaction).filter(TillTransaction.till_id == till_id)
        if tenant_id:
            query = query.filter(TillTransaction.tenant_id == tenant_id)
        return query.order_by(TillTransaction.transaction_date.desc()).all()

