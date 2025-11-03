from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import AccountReceivableRepository
from ....domain.entities.ledger_entity import AccountReceivable
from .query import GetAccountReceivableByIdQuery

class GetAccountReceivableByIdHandler(RequestHandlerBase[GetAccountReceivableByIdQuery, Result[Optional[AccountReceivable]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAccountReceivableByIdQuery) -> Result[Optional[AccountReceivable]]:
        try:
            with self._unit_of_work as uow:
                repo = AccountReceivableRepository(uow.session)
                entity = repo.get_by_id(query.accountreceivable_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get accountreceivable: {str(e)}")
