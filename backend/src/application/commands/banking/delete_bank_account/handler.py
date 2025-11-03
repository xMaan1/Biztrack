from datetime import datetime
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BankAccountRepository
from .command import DeleteBankAccountCommand

class DeleteBankAccountHandler(RequestHandlerBase[DeleteBankAccountCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteBankAccountCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                bank_account_repo = BankAccountRepository(uow.session)
                
                account = bank_account_repo.get_by_id(command.account_id, command.tenant_id)
                if not account:
                    return Result.failure("Bank account not found")
                
                account.is_active = False
                account.updated_at = datetime.utcnow()
                bank_account_repo.update(account)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete bank account: {str(e)}")

