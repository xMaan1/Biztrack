from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvestmentRepository
from ....domain.entities.investment_entity import Investment
from .command import UpdateInvestmentCommand

class UpdateInvestmentHandler(RequestHandlerBase[UpdateInvestmentCommand, Result[Investment]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateInvestmentCommand) -> Result[Investment]:
        try:
            with self._unit_of_work as uow:
                repo = InvestmentRepository(uow.session)
                
                investment = repo.get_by_id(command.investment_id, command.tenant_id)
                if not investment:
                    return Result.failure("Investment not found")
                
                                if command.amount is not None:
                    investment.amount = command.amount
                if command.approved_by is not None:
                    investment.approved_by = uuid.UUID(command.approved_by) if command.approved_by else None
                if command.attachments is not None:
                    investment.attachments = command.attachments or []
                if command.created_by is not None:
                    investment.created_by = uuid.UUID(command.created_by) if command.created_by else None
                if command.currency is not None:
                    investment.currency = command.currency
                if command.description is not None:
                    investment.description = command.description
                if command.investment_date is not None:
                    investment.investment_date = datetime.fromisoformat(command.investment_date.replace('Z', '+00:00')) if command.investment_date else None
                if command.investment_number is not None:
                    investment.investment_number = command.investment_number
                if command.investment_type is not None:
                    investment.investment_type = command.investment_type
                if command.meta_data is not None:
                    investment.meta_data = command.meta_data or []
                if command.notes is not None:
                    investment.notes = command.notes
                if command.reference_number is not None:
                    investment.reference_number = command.reference_number
                if command.reference_type is not None:
                    investment.reference_type = command.reference_type
                if command.status is not None:
                    investment.status = command.status
                if command.tags is not None:
                    investment.tags = command.tags or []
                
                investment.updatedAt = datetime.utcnow()
                repo.update(investment)
                uow.commit()
                
                return Result.success(investment)
                
        except Exception as e:
            return Result.failure(f"Failed to update investment: {str(e)}")
