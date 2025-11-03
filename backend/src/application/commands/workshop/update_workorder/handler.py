from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import WorkOrderRepository
from ....domain.entities.workshop_entity import WorkOrder
from .command import UpdateWorkOrderCommand

class UpdateWorkOrderHandler(RequestHandlerBase[UpdateWorkOrderCommand, Result[WorkOrder]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateWorkOrderCommand) -> Result[WorkOrder]:
        try:
            with self._unit_of_work as uow:
                repo = WorkOrderRepository(uow.session)
                
                workorder = repo.get_by_id(command.workorder_id, command.tenant_id)
                if not workorder:
                    return Result.failure("WorkOrder not found")
                
                                if command.actual_cost is not None:
                    workorder.actual_cost = command.actual_cost
                if command.actual_end_date is not None:
                    workorder.actual_end_date = datetime.fromisoformat(command.actual_end_date.replace('Z', '+00:00')) if command.actual_end_date else None
                if command.actual_hours is not None:
                    workorder.actual_hours = command.actual_hours
                if command.actual_start_date is not None:
                    workorder.actual_start_date = datetime.fromisoformat(command.actual_start_date.replace('Z', '+00:00')) if command.actual_start_date else None
                if command.approved_by_id is not None:
                    workorder.approved_by_id = uuid.UUID(command.approved_by_id) if command.approved_by_id else None
                if command.assigned_to_id is not None:
                    workorder.assigned_to_id = uuid.UUID(command.assigned_to_id) if command.assigned_to_id else None
                if command.attachments is not None:
                    workorder.attachments = command.attachments or []
                if command.completion_percentage is not None:
                    workorder.completion_percentage = command.completion_percentage
                if command.created_by_id is not None:
                    workorder.created_by_id = uuid.UUID(command.created_by_id) if command.created_by_id else None
                if command.current_step is not None:
                    workorder.current_step = command.current_step
                if command.description is not None:
                    workorder.description = command.description
                if command.equipment_id is not None:
                    workorder.equipment_id = uuid.UUID(command.equipment_id) if command.equipment_id else None
                if command.estimated_cost is not None:
                    workorder.estimated_cost = command.estimated_cost
                if command.estimated_hours is not None:
                    workorder.estimated_hours = command.estimated_hours
                if command.instructions is not None:
                    workorder.instructions = command.instructions
                if command.is_active is not None:
                    workorder.is_active = command.is_active
                if command.location is not None:
                    workorder.location = command.location
                if command.materials_required is not None:
                    workorder.materials_required = command.materials_required or []
                if command.notes is not None:
                    workorder.notes = command.notes or []
                if command.planned_end_date is not None:
                    workorder.planned_end_date = datetime.fromisoformat(command.planned_end_date.replace('Z', '+00:00')) if command.planned_end_date else None
                if command.planned_start_date is not None:
                    workorder.planned_start_date = datetime.fromisoformat(command.planned_start_date.replace('Z', '+00:00')) if command.planned_start_date else None
                if command.priority is not None:
                    workorder.priority = command.priority
                if command.project_id is not None:
                    workorder.project_id = uuid.UUID(command.project_id) if command.project_id else None
                if command.quality_requirements is not None:
                    workorder.quality_requirements = command.quality_requirements
                if command.safety_notes is not None:
                    workorder.safety_notes = command.safety_notes
                if command.status is not None:
                    workorder.status = command.status
                if command.tags is not None:
                    workorder.tags = command.tags or []
                if command.title is not None:
                    workorder.title = command.title
                if command.work_order_number is not None:
                    workorder.work_order_number = command.work_order_number
                if command.work_order_type is not None:
                    workorder.work_order_type = command.work_order_type
                
                workorder.updatedAt = datetime.utcnow()
                repo.update(workorder)
                uow.commit()
                
                return Result.success(workorder)
                
        except Exception as e:
            return Result.failure(f"Failed to update workorder: {str(e)}")
