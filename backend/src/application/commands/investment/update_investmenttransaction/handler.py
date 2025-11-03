from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvestmentTransactionRepository
from ....domain.entities.investment_entity import InvestmentTransaction
from .command import UpdateInvestmentTransactionCommand

class UpdateInvestmentTransactionHandler(RequestHandlerBase[UpdateInvestmentTransactionCommand, Result[InvestmentTransaction]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateInvestmentTransactionCommand) -> Result[InvestmentTransaction]:
        try:
            with self._unit_of_work as uow:
                repo = InvestmentTransactionRepository(uow.session)
                
                investmenttransaction = repo.get_by_id(command.investmenttransaction_id, command.tenant_id)
                if not investmenttransaction:
                    return Result.failure("InvestmentTransaction not found")
                
                                if command.amount is not None:
                    investmenttransaction.amount = command.amount
                if command.created_by is not None:
                    investmenttransaction.created_by = uuid.UUID(command.created_by) if command.created_by else None
                if command.credit_account_id is not None:
                    investmenttransaction.credit_account_id = uuid.UUID(command.credit_account_id) if command.credit_account_id else None
                if command.currency is not None:
                    investmenttransaction.currency = command.currency
                if command.debit_account_id is not None:
                    investmenttransaction.debit_account_id = uuid.UUID(command.debit_account_id) if command.debit_account_id else None
                if command.description is not None:
                    investmenttransaction.description = command.description
                if command.investment_id is not None:
                    investmenttransaction.investment_id = uuid.UUID(command.investment_id) if command.investment_id else None
                if command.reference_number is not None:
                    investmenttransaction.reference_number = command.reference_number
                if command.status is not None:
                    investmenttransaction.status = command.status
                if command.transaction_date is not None:
                    investmenttransaction.transaction_date = datetime.fromisoformat(command.transaction_date.replace('Z', '+00:00')) if command.transaction_date else None
                if command.transaction_type is not None:
                    investmenttransaction.transaction_type = command.transaction_type
                
                investmenttransaction.updatedAt = datetime.utcnow()
                repo.update(investmenttransaction)
                uow.commit()
                
                return Result.success(investmenttransaction)
                
        except Exception as e:
            return Result.failure(f"Failed to update investmenttransaction: {str(e)}")
