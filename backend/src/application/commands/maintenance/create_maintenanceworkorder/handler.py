from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import MaintenanceWorkOrderRepository
from ....domain.entities.maintenance_entity import MaintenanceWorkOrder
from .command import CreateMaintenanceWorkOrderCommand

class CreateMaintenanceWorkOrderHandler(RequestHandlerBase[CreateMaintenanceWorkOrderCommand, Result[MaintenanceWorkOrder]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateMaintenanceWorkOrderCommand) -> Result[MaintenanceWorkOrder]:
        try:
            with self._unit_of_work as uow:
                repo = MaintenanceWorkOrderRepository(uow.session)
                
                maintenanceworkorder = MaintenanceWorkOrder(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    actual_duration_hours=command.actual_duration_hours,
                    approval_required=command.approval_required,
                    approved_by_id=uuid.UUID(command.approved_by_id),
                    created_by_id=uuid.UUID(command.created_by_id),
                    documents=command.documents or [],
                    end_time=datetime.fromisoformat(command.end_time.replace('Z', '+00:00')) if command.end_time else datetime.utcnow(),
                    issues_encountered=command.issues_encountered or [],
                    maintenance_schedule_id=uuid.UUID(command.maintenance_schedule_id),
                    notes=command.notes,
                    parts_used=command.parts_used or [],
                    photos=command.photos or [],
                    quality_checks=command.quality_checks or [],
                    solutions_applied=command.solutions_applied or [],
                    start_time=datetime.fromisoformat(command.start_time.replace('Z', '+00:00')) if command.start_time else datetime.utcnow(),
                    status=command.status,
                    technician_id=uuid.UUID(command.technician_id),
                    tools_used=command.tools_used or [],
                    updated_by_id=uuid.UUID(command.updated_by_id),
                    work_performed=command.work_performed or [],
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(maintenanceworkorder)
                uow.commit()
                return Result.success(maintenanceworkorder)
                
        except Exception as e:
            return Result.failure(f"Failed to create maintenanceworkorder: {str(e)}")
