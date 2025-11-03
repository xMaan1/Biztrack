from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import WorkOrderTaskRepository
from ....domain.entities.workshop_entity import WorkOrderTask
from .command import CreateWorkOrderTaskCommand

class CreateWorkOrderTaskHandler(RequestHandlerBase[CreateWorkOrderTaskCommand, Result[WorkOrderTask]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateWorkOrderTaskCommand) -> Result[WorkOrderTask]:
        try:
            with self._unit_of_work as uow:
                repo = WorkOrderTaskRepository(uow.session)
                
                workordertask = WorkOrderTask(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    actual_hours=command.actual_hours,
                    assigned_to_id=uuid.UUID(command.assigned_to_id),
                    attachments=command.attachments or [],
                    completed_at=datetime.fromisoformat(command.completed_at.replace('Z', '+00:00')) if command.completed_at else datetime.utcnow(),
                    completion_percentage=command.completion_percentage,
                    description=command.description,
                    estimated_hours=command.estimated_hours,
                    is_active=command.is_active,
                    notes=command.notes,
                    sequence_number=command.sequence_number,
                    started_at=datetime.fromisoformat(command.started_at.replace('Z', '+00:00')) if command.started_at else datetime.utcnow(),
                    status=command.status,
                    title=command.title,
                    work_order_id=uuid.UUID(command.work_order_id),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(workordertask)
                uow.commit()
                return Result.success(workordertask)
                
        except Exception as e:
            return Result.failure(f"Failed to create workordertask: {str(e)}")
