from datetime import datetime
import uuid
from datetime import date
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TimeEntryRepository
from ....domain.entities.hrm_entity import TimeEntry
from .command import CreateTimeEntryCommand

class CreateTimeEntryHandler(RequestHandlerBase[CreateTimeEntryCommand, Result[TimeEntry]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateTimeEntryCommand) -> Result[TimeEntry]:
        try:
            with self._unit_of_work as uow:
                repo = TimeEntryRepository(uow.session)
                
                timeentry = TimeEntry(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    approvedAt=datetime.fromisoformat(command.approvedAt.replace('Z', '+00:00')) if command.approvedAt else datetime.utcnow(),
                    approvedBy=uuid.UUID(command.approvedBy),
                    date=datetime.strptime(command.date, "%Y-%m-%d").date() if command.date else datetime.now().date(),
                    description=command.description,
                    employeeId=uuid.UUID(command.employeeId),
                    endTime=datetime.fromisoformat(command.endTime.replace('Z', '+00:00')) if command.endTime else datetime.utcnow(),
                    hours=command.hours,
                    isApproved=command.isApproved,
                    projectId=uuid.UUID(command.projectId),
                    startTime=datetime.fromisoformat(command.startTime.replace('Z', '+00:00')) if command.startTime else datetime.utcnow(),
                    taskId=uuid.UUID(command.taskId),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(timeentry)
                uow.commit()
                return Result.success(timeentry)
                
        except Exception as e:
            return Result.failure(f"Failed to create timeentry: {str(e)}")
