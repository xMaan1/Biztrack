from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BankAccountRepository
from ....domain.entities.banking_entity import BankAccount
from .query import GetBankAccountByIdQuery

class GetBankAccountByIdHandler(RequestHandlerBase[GetBankAccountByIdQuery, Result[Optional[BankAccount]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetBankAccountByIdQuery) -> Result[Optional[BankAccount]]:
        try:
            with self._unit_of_work as uow:
                bank_account_repo = BankAccountRepository(uow.session)
                account = bank_account_repo.get_by_id(query.account_id, query.tenant_id)
                return Result.success(account)
        except Exception as e:
            return Result.failure(f"Failed to get bank account: {str(e)}")

