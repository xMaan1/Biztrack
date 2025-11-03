from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TimeEntryRepository
from ....domain.entities.hrm_entity import TimeEntry
from .command import UpdateTimeEntryCommand

class UpdateTimeEntryHandler(RequestHandlerBase[UpdateTimeEntryCommand, Result[TimeEntry]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateTimeEntryCommand) -> Result[TimeEntry]:
        try:
            with self._unit_of_work as uow:
                repo = TimeEntryRepository(uow.session)
                
                timeentry = repo.get_by_id(command.timeentry_id, command.tenant_id)
                if not timeentry:
                    return Result.failure("TimeEntry not found")
                
                                if command.approvedAt is not None:
                    timeentry.approvedAt = datetime.fromisoformat(command.approvedAt.replace('Z', '+00:00')) if command.approvedAt else None
                if command.approvedBy is not None:
                    timeentry.approvedBy = uuid.UUID(command.approvedBy) if command.approvedBy else None
                if command.date is not None:
                    timeentry.date = datetime.strptime(command.date, "%Y-%m-%d").date() if command.date else None
                if command.description is not None:
                    timeentry.description = command.description
                if command.employeeId is not None:
                    timeentry.employeeId = uuid.UUID(command.employeeId) if command.employeeId else None
                if command.endTime is not None:
                    timeentry.endTime = datetime.fromisoformat(command.endTime.replace('Z', '+00:00')) if command.endTime else None
                if command.hours is not None:
                    timeentry.hours = command.hours
                if command.isApproved is not None:
                    timeentry.isApproved = command.isApproved
                if command.projectId is not None:
                    timeentry.projectId = uuid.UUID(command.projectId) if command.projectId else None
                if command.startTime is not None:
                    timeentry.startTime = datetime.fromisoformat(command.startTime.replace('Z', '+00:00')) if command.startTime else None
                if command.taskId is not None:
                    timeentry.taskId = uuid.UUID(command.taskId) if command.taskId else None
                
                timeentry.updatedAt = datetime.utcnow()
                repo.update(timeentry)
                uow.commit()
                
                return Result.success(timeentry)
                
        except Exception as e:
            return Result.failure(f"Failed to update timeentry: {str(e)}")
