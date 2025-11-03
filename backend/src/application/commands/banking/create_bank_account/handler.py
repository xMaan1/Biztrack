from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BankAccountRepository
from ....domain.entities.banking_entity import BankAccount
from ....domain.enums.banking_enums import BankAccountType
from .command import CreateBankAccountCommand

class CreateBankAccountHandler(RequestHandlerBase[CreateBankAccountCommand, Result[BankAccount]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateBankAccountCommand) -> Result[BankAccount]:
        try:
            with self._unit_of_work as uow:
                bank_account_repo = BankAccountRepository(uow.session)
                
                account_type = BankAccountType(command.account_type) if isinstance(command.account_type, str) else command.account_type
                
                account_entity = BankAccount(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    account_name=command.account_name,
                    account_number=command.account_number,
                    routing_number=command.routing_number,
                    bank_name=command.bank_name,
                    bank_code=command.bank_code,
                    account_type=account_type,
                    currency=command.currency,
                    current_balance=command.current_balance,
                    available_balance=command.available_balance,
                    pending_balance=command.pending_balance,
                    is_active=command.is_active,
                    is_primary=command.is_primary,
                    supports_online_banking=command.supports_online_banking,
                    description=command.description,
                    tags=command.tags or [],
                    created_by=uuid.UUID(command.created_by) if command.created_by else None,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                bank_account_repo.add(account_entity)
                uow.commit()
                return Result.success(account_entity)
                
        except Exception as e:
            return Result.failure(f"Failed to create bank account: {str(e)}")

