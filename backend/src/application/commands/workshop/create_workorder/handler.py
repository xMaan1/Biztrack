from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import WorkOrderRepository
from ....domain.entities.workshop_entity import WorkOrder
from .command import CreateWorkOrderCommand

class CreateWorkOrderHandler(RequestHandlerBase[CreateWorkOrderCommand, Result[WorkOrder]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateWorkOrderCommand) -> Result[WorkOrder]:
        try:
            with self._unit_of_work as uow:
                repo = WorkOrderRepository(uow.session)
                
                workorder = WorkOrder(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    actual_cost=command.actual_cost,
                    actual_end_date=datetime.fromisoformat(command.actual_end_date.replace('Z', '+00:00')) if command.actual_end_date else datetime.utcnow(),
                    actual_hours=command.actual_hours,
                    actual_start_date=datetime.fromisoformat(command.actual_start_date.replace('Z', '+00:00')) if command.actual_start_date else datetime.utcnow(),
                    approved_by_id=uuid.UUID(command.approved_by_id),
                    assigned_to_id=uuid.UUID(command.assigned_to_id),
                    attachments=command.attachments or [],
                    completion_percentage=command.completion_percentage,
                    created_by_id=uuid.UUID(command.created_by_id),
                    current_step=command.current_step,
                    description=command.description,
                    equipment_id=uuid.UUID(command.equipment_id),
                    estimated_cost=command.estimated_cost,
                    estimated_hours=command.estimated_hours,
                    instructions=command.instructions,
                    is_active=command.is_active,
                    location=command.location,
                    materials_required=command.materials_required or [],
                    notes=command.notes or [],
                    planned_end_date=datetime.fromisoformat(command.planned_end_date.replace('Z', '+00:00')) if command.planned_end_date else datetime.utcnow(),
                    planned_start_date=datetime.fromisoformat(command.planned_start_date.replace('Z', '+00:00')) if command.planned_start_date else datetime.utcnow(),
                    priority=command.priority,
                    project_id=uuid.UUID(command.project_id),
                    quality_requirements=command.quality_requirements,
                    safety_notes=command.safety_notes,
                    status=command.status,
                    tags=command.tags or [],
                    title=command.title,
                    work_order_number=command.work_order_number,
                    work_order_type=command.work_order_type,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(workorder)
                uow.commit()
                return Result.success(workorder)
                
        except Exception as e:
            return Result.failure(f"Failed to create workorder: {str(e)}")
