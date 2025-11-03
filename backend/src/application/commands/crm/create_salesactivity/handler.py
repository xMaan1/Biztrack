from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import SalesActivityRepository
from ....domain.entities.crm_entity import SalesActivity
from .command import CreateSalesActivityCommand

class CreateSalesActivityHandler(RequestHandlerBase[CreateSalesActivityCommand, Result[SalesActivity]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateSalesActivityCommand) -> Result[SalesActivity]:
        try:
            with self._unit_of_work as uow:
                repo = SalesActivityRepository(uow.session)
                
                salesactivity = SalesActivity(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    assignedToId=uuid.UUID(command.assignedToId),
                    completedAt=datetime.fromisoformat(command.completedAt.replace('Z', '+00:00')) if command.completedAt else datetime.utcnow(),
                    description=command.description,
                    dueDate=datetime.fromisoformat(command.dueDate.replace('Z', '+00:00')) if command.dueDate else datetime.utcnow(),
                    notes=command.notes,
                    priority=command.priority,
                    relatedToId=uuid.UUID(command.relatedToId),
                    relatedToType=command.relatedToType,
                    status=command.status,
                    subject=command.subject,
                    type=command.type,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(salesactivity)
                uow.commit()
                return Result.success(salesactivity)
                
        except Exception as e:
            return Result.failure(f"Failed to create salesactivity: {str(e)}")
