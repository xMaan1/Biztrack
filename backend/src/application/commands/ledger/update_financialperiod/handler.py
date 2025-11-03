from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import FinancialPeriodRepository
from ....domain.entities.ledger_entity import FinancialPeriod
from .command import UpdateFinancialPeriodCommand

class UpdateFinancialPeriodHandler(RequestHandlerBase[UpdateFinancialPeriodCommand, Result[FinancialPeriod]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateFinancialPeriodCommand) -> Result[FinancialPeriod]:
        try:
            with self._unit_of_work as uow:
                repo = FinancialPeriodRepository(uow.session)
                
                financialperiod = repo.get_by_id(command.financialperiod_id, command.tenant_id)
                if not financialperiod:
                    return Result.failure("FinancialPeriod not found")
                
                                if command.closed_at is not None:
                    financialperiod.closed_at = datetime.fromisoformat(command.closed_at.replace('Z', '+00:00')) if command.closed_at else None
                if command.closed_by is not None:
                    financialperiod.closed_by = uuid.UUID(command.closed_by) if command.closed_by else None
                if command.created_by is not None:
                    financialperiod.created_by = uuid.UUID(command.created_by) if command.created_by else None
                if command.end_date is not None:
                    financialperiod.end_date = datetime.fromisoformat(command.end_date.replace('Z', '+00:00')) if command.end_date else None
                if command.is_closed is not None:
                    financialperiod.is_closed = command.is_closed
                if command.net_income is not None:
                    financialperiod.net_income = command.net_income
                if command.notes is not None:
                    financialperiod.notes = command.notes
                if command.period_name is not None:
                    financialperiod.period_name = command.period_name
                if command.start_date is not None:
                    financialperiod.start_date = datetime.fromisoformat(command.start_date.replace('Z', '+00:00')) if command.start_date else None
                if command.total_expenses is not None:
                    financialperiod.total_expenses = command.total_expenses
                if command.total_revenue is not None:
                    financialperiod.total_revenue = command.total_revenue
                
                financialperiod.updatedAt = datetime.utcnow()
                repo.update(financialperiod)
                uow.commit()
                
                return Result.success(financialperiod)
                
        except Exception as e:
            return Result.failure(f"Failed to update financialperiod: {str(e)}")
