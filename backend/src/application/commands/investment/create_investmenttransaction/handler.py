from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvestmentTransactionRepository
from ....domain.entities.investment_entity import InvestmentTransaction
from .command import CreateInvestmentTransactionCommand

class CreateInvestmentTransactionHandler(RequestHandlerBase[CreateInvestmentTransactionCommand, Result[InvestmentTransaction]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateInvestmentTransactionCommand) -> Result[InvestmentTransaction]:
        try:
            with self._unit_of_work as uow:
                repo = InvestmentTransactionRepository(uow.session)
                
                investmenttransaction = InvestmentTransaction(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    amount=command.amount,
                    created_by=uuid.UUID(command.created_by),
                    credit_account_id=uuid.UUID(command.credit_account_id),
                    currency=command.currency,
                    debit_account_id=uuid.UUID(command.debit_account_id),
                    description=command.description,
                    investment_id=uuid.UUID(command.investment_id),
                    reference_number=command.reference_number,
                    status=command.status,
                    transaction_date=datetime.fromisoformat(command.transaction_date.replace('Z', '+00:00')) if command.transaction_date else datetime.utcnow(),
                    transaction_type=command.transaction_type,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(investmenttransaction)
                uow.commit()
                return Result.success(investmenttransaction)
                
        except Exception as e:
            return Result.failure(f"Failed to create investmenttransaction: {str(e)}")
