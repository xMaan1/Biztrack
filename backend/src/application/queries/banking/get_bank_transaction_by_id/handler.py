from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BankTransactionRepository
from ....domain.entities.banking_entity import BankTransaction
from .query import GetBankTransactionByIdQuery

class GetBankTransactionByIdHandler(RequestHandlerBase[GetBankTransactionByIdQuery, Result[Optional[BankTransaction]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetBankTransactionByIdQuery) -> Result[Optional[BankTransaction]]:
        try:
            with self._unit_of_work as uow:
                transaction_repo = BankTransactionRepository(uow.session)
                transaction = transaction_repo.get_by_id(query.transaction_id, query.tenant_id)
                return Result.success(transaction)
        except Exception as e:
            return Result.failure(f"Failed to get bank transaction: {str(e)}")

