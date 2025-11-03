from typing import Optional, List
from sqlalchemy.orm import Session
from ...infrastructure.repository import BaseRepository
from ...domain.entities.pos_entity import POSShift, POSTransaction

class POSShiftRepository(BaseRepository[POSShift]):
    def __init__(self, session: Session):
        super().__init__(session, POSShift)

    def get_by_shift_number(self, shift_number: str, tenant_id: Optional[str] = None) -> Optional[POSShift]:
        query = self._session.query(POSShift).filter(POSShift.shiftNumber == shift_number)
        if tenant_id:
            query = query.filter(POSShift.tenant_id == tenant_id)
        return query.first()

class POSTransactionRepository(BaseRepository[POSTransaction]):
    def __init__(self, session: Session):
        super().__init__(session, POSTransaction)

    def get_by_shift(self, shift_id: str, tenant_id: Optional[str] = None) -> List[POSTransaction]:
        query = self._session.query(POSTransaction).filter(POSTransaction.shiftId == shift_id)
        if tenant_id:
            query = query.filter(POSTransaction.tenant_id == tenant_id)
        return query.all()

