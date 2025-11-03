from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvestmentRepository
from ....domain.entities.investment_entity import Investment
from .command import CreateInvestmentCommand

class CreateInvestmentHandler(RequestHandlerBase[CreateInvestmentCommand, Result[Investment]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateInvestmentCommand) -> Result[Investment]:
        try:
            with self._unit_of_work as uow:
                repo = InvestmentRepository(uow.session)
                
                investment = Investment(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    amount=command.amount,
                    approved_by=uuid.UUID(command.approved_by),
                    attachments=command.attachments or [],
                    created_by=uuid.UUID(command.created_by),
                    currency=command.currency,
                    description=command.description,
                    investment_date=datetime.fromisoformat(command.investment_date.replace('Z', '+00:00')) if command.investment_date else datetime.utcnow(),
                    investment_number=command.investment_number,
                    investment_type=command.investment_type,
                    meta_data=command.meta_data or [],
                    notes=command.notes,
                    reference_number=command.reference_number,
                    reference_type=command.reference_type,
                    status=command.status,
                    tags=command.tags or [],
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(investment)
                uow.commit()
                return Result.success(investment)
                
        except Exception as e:
            return Result.failure(f"Failed to create investment: {str(e)}")
