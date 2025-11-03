from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import WorkOrderTaskRepository
from ....domain.entities.workshop_entity import WorkOrderTask
from .command import UpdateWorkOrderTaskCommand

class UpdateWorkOrderTaskHandler(RequestHandlerBase[UpdateWorkOrderTaskCommand, Result[WorkOrderTask]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateWorkOrderTaskCommand) -> Result[WorkOrderTask]:
        try:
            with self._unit_of_work as uow:
                repo = WorkOrderTaskRepository(uow.session)
                
                workordertask = repo.get_by_id(command.workordertask_id, command.tenant_id)
                if not workordertask:
                    return Result.failure("WorkOrderTask not found")
                
                                if command.actual_hours is not None:
                    workordertask.actual_hours = command.actual_hours
                if command.assigned_to_id is not None:
                    workordertask.assigned_to_id = uuid.UUID(command.assigned_to_id) if command.assigned_to_id else None
                if command.attachments is not None:
                    workordertask.attachments = command.attachments or []
                if command.completed_at is not None:
                    workordertask.completed_at = datetime.fromisoformat(command.completed_at.replace('Z', '+00:00')) if command.completed_at else None
                if command.completion_percentage is not None:
                    workordertask.completion_percentage = command.completion_percentage
                if command.description is not None:
                    workordertask.description = command.description
                if command.estimated_hours is not None:
                    workordertask.estimated_hours = command.estimated_hours
                if command.is_active is not None:
                    workordertask.is_active = command.is_active
                if command.notes is not None:
                    workordertask.notes = command.notes
                if command.sequence_number is not None:
                    workordertask.sequence_number = command.sequence_number
                if command.started_at is not None:
                    workordertask.started_at = datetime.fromisoformat(command.started_at.replace('Z', '+00:00')) if command.started_at else None
                if command.status is not None:
                    workordertask.status = command.status
                if command.title is not None:
                    workordertask.title = command.title
                if command.work_order_id is not None:
                    workordertask.work_order_id = uuid.UUID(command.work_order_id) if command.work_order_id else None
                
                workordertask.updatedAt = datetime.utcnow()
                repo.update(workordertask)
                uow.commit()
                
                return Result.success(workordertask)
                
        except Exception as e:
            return Result.failure(f"Failed to update workordertask: {str(e)}")
