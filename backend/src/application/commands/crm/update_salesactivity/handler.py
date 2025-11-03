from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import SalesActivityRepository
from ....domain.entities.crm_entity import SalesActivity
from .command import UpdateSalesActivityCommand

class UpdateSalesActivityHandler(RequestHandlerBase[UpdateSalesActivityCommand, Result[SalesActivity]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateSalesActivityCommand) -> Result[SalesActivity]:
        try:
            with self._unit_of_work as uow:
                repo = SalesActivityRepository(uow.session)
                
                salesactivity = repo.get_by_id(command.salesactivity_id, command.tenant_id)
                if not salesactivity:
                    return Result.failure("SalesActivity not found")
                
                                if command.assignedToId is not None:
                    salesactivity.assignedToId = uuid.UUID(command.assignedToId) if command.assignedToId else None
                if command.completedAt is not None:
                    salesactivity.completedAt = datetime.fromisoformat(command.completedAt.replace('Z', '+00:00')) if command.completedAt else None
                if command.description is not None:
                    salesactivity.description = command.description
                if command.dueDate is not None:
                    salesactivity.dueDate = datetime.fromisoformat(command.dueDate.replace('Z', '+00:00')) if command.dueDate else None
                if command.notes is not None:
                    salesactivity.notes = command.notes
                if command.priority is not None:
                    salesactivity.priority = command.priority
                if command.relatedToId is not None:
                    salesactivity.relatedToId = uuid.UUID(command.relatedToId) if command.relatedToId else None
                if command.relatedToType is not None:
                    salesactivity.relatedToType = command.relatedToType
                if command.status is not None:
                    salesactivity.status = command.status
                if command.subject is not None:
                    salesactivity.subject = command.subject
                if command.type is not None:
                    salesactivity.type = command.type
                
                salesactivity.updatedAt = datetime.utcnow()
                repo.update(salesactivity)
                uow.commit()
                
                return Result.success(salesactivity)
                
        except Exception as e:
            return Result.failure(f"Failed to update salesactivity: {str(e)}")
