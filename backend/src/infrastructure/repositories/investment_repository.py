from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.investment_entity import Investment, EquipmentInvestment, InvestmentTransaction

class InvestmentRepository(BaseRepository[Investment]):
    def __init__(self, session: Session):
        super().__init__(session, Investment)

    def get_by_investment_number(self, investment_number: str, tenant_id: Optional[str] = None) -> Optional[Investment]:
        query = self._session.query(Investment).filter(Investment.investment_number == investment_number)
        if tenant_id:
            query = query.filter(Investment.tenant_id == tenant_id)
        return query.first()

class EquipmentInvestmentRepository(BaseRepository[EquipmentInvestment]):
    def __init__(self, session: Session):
        super().__init__(session, EquipmentInvestment)

    def get_by_investment(self, investment_id: str, tenant_id: Optional[str] = None) -> List[EquipmentInvestment]:
        query = self._session.query(EquipmentInvestment).filter(
            EquipmentInvestment.investment_id == investment_id
        )
        if tenant_id:
            query = query.filter(EquipmentInvestment.tenant_id == tenant_id)
        return query.all()

class InvestmentTransactionRepository(BaseRepository[InvestmentTransaction]):
    def __init__(self, session: Session):
        super().__init__(session, InvestmentTransaction)

    def get_by_investment(self, investment_id: str, tenant_id: Optional[str] = None) -> List[InvestmentTransaction]:
        query = self._session.query(InvestmentTransaction).filter(
            InvestmentTransaction.investment_id == investment_id
        )
        if tenant_id:
            query = query.filter(InvestmentTransaction.tenant_id == tenant_id)
        return query.all()

