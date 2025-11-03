from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import POSShiftRepository
from ....domain.entities.pos_entity import POSShift
from .command import UpdatePOSShiftCommand

class UpdatePOSShiftHandler(RequestHandlerBase[UpdatePOSShiftCommand, Result[POSShift]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdatePOSShiftCommand) -> Result[POSShift]:
        try:
            with self._unit_of_work as uow:
                repo = POSShiftRepository(uow.session)
                
                posshift = repo.get_by_id(command.posshift_id, command.tenant_id)
                if not posshift:
                    return Result.failure("POSShift not found")
                
                                if command.closingAmount is not None:
                    posshift.closingAmount = command.closingAmount
                if command.employeeId is not None:
                    posshift.employeeId = uuid.UUID(command.employeeId) if command.employeeId else None
                if command.endTime is not None:
                    posshift.endTime = datetime.fromisoformat(command.endTime.replace('Z', '+00:00')) if command.endTime else None
                if command.notes is not None:
                    posshift.notes = command.notes
                if command.openingAmount is not None:
                    posshift.openingAmount = command.openingAmount
                if command.shiftNumber is not None:
                    posshift.shiftNumber = command.shiftNumber
                if command.startTime is not None:
                    posshift.startTime = datetime.fromisoformat(command.startTime.replace('Z', '+00:00')) if command.startTime else None
                if command.status is not None:
                    posshift.status = command.status
                if command.totalSales is not None:
                    posshift.totalSales = command.totalSales
                if command.totalTransactions is not None:
                    posshift.totalTransactions = command.totalTransactions
                
                posshift.updatedAt = datetime.utcnow()
                repo.update(posshift)
                uow.commit()
                
                return Result.success(posshift)
                
        except Exception as e:
            return Result.failure(f"Failed to update posshift: {str(e)}")
