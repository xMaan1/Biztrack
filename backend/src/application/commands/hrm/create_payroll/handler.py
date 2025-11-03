from datetime import datetime
import uuid
from datetime import date
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PayrollRepository
from ....domain.entities.hrm_entity import Payroll
from .command import CreatePayrollCommand

class CreatePayrollHandler(RequestHandlerBase[CreatePayrollCommand, Result[Payroll]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreatePayrollCommand) -> Result[Payroll]:
        try:
            with self._unit_of_work as uow:
                repo = PayrollRepository(uow.session)
                
                payroll = Payroll(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    allowances=command.allowances,
                    baseSalary=command.baseSalary,
                    bonuses=command.bonuses,
                    createdBy=uuid.UUID(command.createdBy),
                    deductions=command.deductions,
                    employeeId=uuid.UUID(command.employeeId),
                    endDate=datetime.strptime(command.endDate, "%Y-%m-%d").date() if command.endDate else datetime.now().date(),
                    isProcessed=command.isProcessed,
                    netPay=command.netPay,
                    notes=command.notes,
                    overtimeHours=command.overtimeHours,
                    overtimeRate=command.overtimeRate,
                    payPeriod=command.payPeriod,
                    processedAt=datetime.fromisoformat(command.processedAt.replace('Z', '+00:00')) if command.processedAt else datetime.utcnow(),
                    startDate=datetime.strptime(command.startDate, "%Y-%m-%d").date() if command.startDate else datetime.now().date(),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(payroll)
                uow.commit()
                return Result.success(payroll)
                
        except Exception as e:
            return Result.failure(f"Failed to create payroll: {str(e)}")
