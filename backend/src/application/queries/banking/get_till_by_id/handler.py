from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TillRepository
from ....domain.entities.banking_entity import Till
from .query import GetTillByIdQuery

class GetTillByIdHandler(RequestHandlerBase[GetTillByIdQuery, Result[Optional[Till]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetTillByIdQuery) -> Result[Optional[Till]]:
        try:
            with self._unit_of_work as uow:
                till_repo = TillRepository(uow.session)
                till = till_repo.get_by_id(query.till_id, query.tenant_id)
                return Result.success(till)
        except Exception as e:
            return Result.failure(f"Failed to get till: {str(e)}")

