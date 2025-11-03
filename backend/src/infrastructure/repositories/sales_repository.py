from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.sales_entity import Quote, Contract

class QuoteRepository(BaseRepository[Quote]):
    def __init__(self, session: Session):
        super().__init__(session, Quote)

    def get_by_quote_number(self, quote_number: str, tenant_id: Optional[str] = None) -> Optional[Quote]:
        query = self._session.query(Quote).filter(Quote.quoteNumber == quote_number)
        if tenant_id:
            query = query.filter(Quote.tenant_id == tenant_id)
        return query.first()

class ContractRepository(BaseRepository[Contract]):
    def __init__(self, session: Session):
        super().__init__(session, Contract)

    def get_by_contract_number(self, contract_number: str, tenant_id: Optional[str] = None) -> Optional[Contract]:
        query = self._session.query(Contract).filter(Contract.contractNumber == contract_number)
        if tenant_id:
            query = query.filter(Contract.tenant_id == tenant_id)
        return query.first()

