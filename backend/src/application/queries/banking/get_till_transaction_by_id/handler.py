from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TillTransactionRepository
from ....domain.entities.banking_entity import TillTransaction
from .query import GetTillTransactionByIdQuery

class GetTillTransactionByIdHandler(RequestHandlerBase[GetTillTransactionByIdQuery, Result[Optional[TillTransaction]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetTillTransactionByIdQuery) -> Result[Optional[TillTransaction]]:
        try:
            with self._unit_of_work as uow:
                transaction_repo = TillTransactionRepository(uow.session)
                transaction = transaction_repo.get_by_id(query.transaction_id, query.tenant_id)
                return Result.success(transaction)
        except Exception as e:
            return Result.failure(f"Failed to get till transaction: {str(e)}")

