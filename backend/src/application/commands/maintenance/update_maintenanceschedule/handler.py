from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import MaintenanceScheduleRepository
from ....domain.entities.maintenance_entity import MaintenanceSchedule
from .command import UpdateMaintenanceScheduleCommand

class UpdateMaintenanceScheduleHandler(RequestHandlerBase[UpdateMaintenanceScheduleCommand, Result[MaintenanceSchedule]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateMaintenanceScheduleCommand) -> Result[MaintenanceSchedule]:
        try:
            with self._unit_of_work as uow:
                repo = MaintenanceScheduleRepository(uow.session)
                
                maintenanceschedule = repo.get_by_id(command.maintenanceschedule_id, command.tenant_id)
                if not maintenanceschedule:
                    return Result.failure("MaintenanceSchedule not found")
                
                                if command.assigned_technician_id is not None:
                    maintenanceschedule.assigned_technician_id = uuid.UUID(command.assigned_technician_id) if command.assigned_technician_id else None
                if command.category is not None:
                    maintenanceschedule.category = command.category
                if command.created_by_id is not None:
                    maintenanceschedule.created_by_id = uuid.UUID(command.created_by_id) if command.created_by_id else None
                if command.description is not None:
                    maintenanceschedule.description = command.description
                if command.equipment_id is not None:
                    maintenanceschedule.equipment_id = uuid.UUID(command.equipment_id) if command.equipment_id else None
                if command.estimated_cost is not None:
                    maintenanceschedule.estimated_cost = command.estimated_cost
                if command.estimated_duration_hours is not None:
                    maintenanceschedule.estimated_duration_hours = command.estimated_duration_hours
                if command.location is not None:
                    maintenanceschedule.location = command.location
                if command.maintenance_procedures is not None:
                    maintenanceschedule.maintenance_procedures = command.maintenance_procedures or []
                if command.maintenance_type is not None:
                    maintenanceschedule.maintenance_type = command.maintenance_type
                if command.priority is not None:
                    maintenanceschedule.priority = command.priority
                if command.required_parts is not None:
                    maintenanceschedule.required_parts = command.required_parts or []
                if command.required_tools is not None:
                    maintenanceschedule.required_tools = command.required_tools or []
                if command.safety_requirements is not None:
                    maintenanceschedule.safety_requirements = command.safety_requirements or []
                if command.scheduled_date is not None:
                    maintenanceschedule.scheduled_date = datetime.fromisoformat(command.scheduled_date.replace('Z', '+00:00')) if command.scheduled_date else None
                if command.tags is not None:
                    maintenanceschedule.tags = command.tags or []
                if command.title is not None:
                    maintenanceschedule.title = command.title
                if command.updated_by_id is not None:
                    maintenanceschedule.updated_by_id = uuid.UUID(command.updated_by_id) if command.updated_by_id else None
                
                maintenanceschedule.updatedAt = datetime.utcnow()
                repo.update(maintenanceschedule)
                uow.commit()
                
                return Result.success(maintenanceschedule)
                
        except Exception as e:
            return Result.failure(f"Failed to update maintenanceschedule: {str(e)}")
