from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PayrollRepository
from ....domain.entities.hrm_entity import Payroll
from .command import UpdatePayrollCommand

class UpdatePayrollHandler(RequestHandlerBase[UpdatePayrollCommand, Result[Payroll]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdatePayrollCommand) -> Result[Payroll]:
        try:
            with self._unit_of_work as uow:
                repo = PayrollRepository(uow.session)
                
                payroll = repo.get_by_id(command.payroll_id, command.tenant_id)
                if not payroll:
                    return Result.failure("Payroll not found")
                
                                if command.allowances is not None:
                    payroll.allowances = command.allowances
                if command.baseSalary is not None:
                    payroll.baseSalary = command.baseSalary
                if command.bonuses is not None:
                    payroll.bonuses = command.bonuses
                if command.createdBy is not None:
                    payroll.createdBy = uuid.UUID(command.createdBy) if command.createdBy else None
                if command.deductions is not None:
                    payroll.deductions = command.deductions
                if command.employeeId is not None:
                    payroll.employeeId = uuid.UUID(command.employeeId) if command.employeeId else None
                if command.endDate is not None:
                    payroll.endDate = datetime.strptime(command.endDate, "%Y-%m-%d").date() if command.endDate else None
                if command.isProcessed is not None:
                    payroll.isProcessed = command.isProcessed
                if command.netPay is not None:
                    payroll.netPay = command.netPay
                if command.notes is not None:
                    payroll.notes = command.notes
                if command.overtimeHours is not None:
                    payroll.overtimeHours = command.overtimeHours
                if command.overtimeRate is not None:
                    payroll.overtimeRate = command.overtimeRate
                if command.payPeriod is not None:
                    payroll.payPeriod = command.payPeriod
                if command.processedAt is not None:
                    payroll.processedAt = datetime.fromisoformat(command.processedAt.replace('Z', '+00:00')) if command.processedAt else None
                if command.startDate is not None:
                    payroll.startDate = datetime.strptime(command.startDate, "%Y-%m-%d").date() if command.startDate else None
                
                payroll.updatedAt = datetime.utcnow()
                repo.update(payroll)
                uow.commit()
                
                return Result.success(payroll)
                
        except Exception as e:
            return Result.failure(f"Failed to update payroll: {str(e)}")
