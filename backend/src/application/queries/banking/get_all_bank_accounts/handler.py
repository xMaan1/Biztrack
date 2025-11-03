from typing import List
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BankAccountRepository
from ....domain.entities.banking_entity import BankAccount
from .query import GetAllBankAccountsQuery

class GetAllBankAccountsHandler(RequestHandlerBase[GetAllBankAccountsQuery, Result[PagedResult[BankAccount]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllBankAccountsQuery) -> Result[PagedResult[BankAccount]]:
        try:
            with self._unit_of_work as uow:
                bank_account_repo = BankAccountRepository(uow.session)
                
                if query.active_only:
                    accounts = bank_account_repo.get_active_accounts(query.tenant_id)
                    total_count = len(accounts)
                    accounts = accounts[query.skip:query.skip + query.page_size]
                else:
                    accounts = bank_account_repo.get_all(
                        tenant_id=query.tenant_id,
                        skip=query.skip,
                        limit=query.page_size
                    )
                    total_count = bank_account_repo.count(query.tenant_id)
                
                paged_result = PagedResult(
                    items=accounts,
                    page=query.page,
                    page_size=query.page_size,
                    total_count=total_count
                )
                
                return Result.success(paged_result)
        except Exception as e:
            return Result.failure(f"Failed to get bank accounts: {str(e)}")

