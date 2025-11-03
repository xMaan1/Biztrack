from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import MaintenanceScheduleRepository
from ....domain.entities.maintenance_entity import MaintenanceSchedule
from .command import CreateMaintenanceScheduleCommand

class CreateMaintenanceScheduleHandler(RequestHandlerBase[CreateMaintenanceScheduleCommand, Result[MaintenanceSchedule]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateMaintenanceScheduleCommand) -> Result[MaintenanceSchedule]:
        try:
            with self._unit_of_work as uow:
                repo = MaintenanceScheduleRepository(uow.session)
                
                maintenanceschedule = MaintenanceSchedule(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    assigned_technician_id=uuid.UUID(command.assigned_technician_id),
                    category=command.category,
                    created_by_id=uuid.UUID(command.created_by_id),
                    description=command.description,
                    equipment_id=uuid.UUID(command.equipment_id),
                    estimated_cost=command.estimated_cost,
                    estimated_duration_hours=command.estimated_duration_hours,
                    location=command.location,
                    maintenance_procedures=command.maintenance_procedures or [],
                    maintenance_type=command.maintenance_type,
                    priority=command.priority,
                    required_parts=command.required_parts or [],
                    required_tools=command.required_tools or [],
                    safety_requirements=command.safety_requirements or [],
                    scheduled_date=datetime.fromisoformat(command.scheduled_date.replace('Z', '+00:00')) if command.scheduled_date else datetime.utcnow(),
                    tags=command.tags or [],
                    title=command.title,
                    updated_by_id=uuid.UUID(command.updated_by_id),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(maintenanceschedule)
                uow.commit()
                return Result.success(maintenanceschedule)
                
        except Exception as e:
            return Result.failure(f"Failed to create maintenanceschedule: {str(e)}")
