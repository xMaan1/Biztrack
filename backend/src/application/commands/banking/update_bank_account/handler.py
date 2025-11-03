from datetime import datetime
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BankAccountRepository
from ....domain.entities.banking_entity import BankAccount
from ....domain.enums.banking_enums import BankAccountType
from .command import UpdateBankAccountCommand

class UpdateBankAccountHandler(RequestHandlerBase[UpdateBankAccountCommand, Result[BankAccount]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateBankAccountCommand) -> Result[BankAccount]:
        try:
            with self._unit_of_work as uow:
                bank_account_repo = BankAccountRepository(uow.session)
                
                account = bank_account_repo.get_by_id(command.account_id, command.tenant_id)
                if not account:
                    return Result.failure("Bank account not found")
                
                if command.account_name is not None:
                    account.account_name = command.account_name
                if command.routing_number is not None:
                    account.routing_number = command.routing_number
                if command.bank_name is not None:
                    account.bank_name = command.bank_name
                if command.bank_code is not None:
                    account.bank_code = command.bank_code
                if command.account_type is not None:
                    account.account_type = BankAccountType(command.account_type) if isinstance(command.account_type, str) else command.account_type
                if command.currency is not None:
                    account.currency = command.currency
                if command.is_active is not None:
                    account.is_active = command.is_active
                if command.is_primary is not None:
                    account.is_primary = command.is_primary
                if command.supports_online_banking is not None:
                    account.supports_online_banking = command.supports_online_banking
                if command.description is not None:
                    account.description = command.description
                if command.tags is not None:
                    account.tags = command.tags
                
                account.updated_at = datetime.utcnow()
                bank_account_repo.update(account)
                uow.commit()
                
                return Result.success(account)
                
        except Exception as e:
            return Result.failure(f"Failed to update bank account: {str(e)}")

