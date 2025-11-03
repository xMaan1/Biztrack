from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import LedgerTransactionRepository
from ....domain.entities.ledger_entity import LedgerTransaction
from .query import GetLedgerTransactionByIdQuery

class GetLedgerTransactionByIdHandler(RequestHandlerBase[GetLedgerTransactionByIdQuery, Result[Optional[LedgerTransaction]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetLedgerTransactionByIdQuery) -> Result[Optional[LedgerTransaction]]:
        try:
            with self._unit_of_work as uow:
                repo = LedgerTransactionRepository(uow.session)
                entity = repo.get_by_id(query.ledgertransaction_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get ledgertransaction: {str(e)}")
