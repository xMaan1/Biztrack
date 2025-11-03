from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import POSShiftRepository
from ....domain.entities.pos_entity import POSShift
from .command import CreatePOSShiftCommand

class CreatePOSShiftHandler(RequestHandlerBase[CreatePOSShiftCommand, Result[POSShift]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreatePOSShiftCommand) -> Result[POSShift]:
        try:
            with self._unit_of_work as uow:
                repo = POSShiftRepository(uow.session)
                
                posshift = POSShift(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    closingAmount=command.closingAmount,
                    employeeId=uuid.UUID(command.employeeId),
                    endTime=datetime.fromisoformat(command.endTime.replace('Z', '+00:00')) if command.endTime else None,
                    notes=command.notes,
                    openingAmount=command.openingAmount,
                    shiftNumber=command.shiftNumber,
                    startTime=datetime.fromisoformat(command.startTime.replace('Z', '+00:00')) if command.startTime else datetime.utcnow(),
                    status=command.status,
                    totalSales=command.totalSales,
                    totalTransactions=command.totalTransactions,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(posshift)
                uow.commit()
                return Result.success(posshift)
                
        except Exception as e:
            return Result.failure(f"Failed to create posshift: {str(e)}")
