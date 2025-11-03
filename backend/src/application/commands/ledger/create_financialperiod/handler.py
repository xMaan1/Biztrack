from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import FinancialPeriodRepository
from ....domain.entities.ledger_entity import FinancialPeriod
from .command import CreateFinancialPeriodCommand

class CreateFinancialPeriodHandler(RequestHandlerBase[CreateFinancialPeriodCommand, Result[FinancialPeriod]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateFinancialPeriodCommand) -> Result[FinancialPeriod]:
        try:
            with self._unit_of_work as uow:
                repo = FinancialPeriodRepository(uow.session)
                
                financialperiod = FinancialPeriod(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    closed_at=datetime.fromisoformat(command.closed_at.replace('Z', '+00:00')) if command.closed_at else None,
                    closed_by=uuid.UUID(command.closed_by),
                    created_by=uuid.UUID(command.created_by),
                    end_date=datetime.fromisoformat(command.end_date.replace('Z', '+00:00')) if command.end_date else datetime.utcnow(),
                    is_closed=command.is_closed,
                    net_income=command.net_income,
                    notes=command.notes,
                    period_name=command.period_name,
                    start_date=datetime.fromisoformat(command.start_date.replace('Z', '+00:00')) if command.start_date else datetime.utcnow(),
                    total_expenses=command.total_expenses,
                    total_revenue=command.total_revenue,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(financialperiod)
                uow.commit()
                return Result.success(financialperiod)
                
        except Exception as e:
            return Result.failure(f"Failed to create financialperiod: {str(e)}")
