from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EquipmentRepository
from ....domain.entities.maintenance_entity import Equipment
from .command import UpdateEquipmentCommand

class UpdateEquipmentHandler(RequestHandlerBase[UpdateEquipmentCommand, Result[Equipment]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateEquipmentCommand) -> Result[Equipment]:
        try:
            with self._unit_of_work as uow:
                repo = EquipmentRepository(uow.session)
                
                equipment = repo.get_by_id(command.equipment_id, command.tenant_id)
                if not equipment:
                    return Result.failure("Equipment not found")
                
                                if command.assigned_technicians is not None:
                    equipment.assigned_technicians = command.assigned_technicians or []
                if command.category is not None:
                    equipment.category = command.category
                if command.created_by_id is not None:
                    equipment.created_by_id = uuid.UUID(command.created_by_id) if command.created_by_id else None
                if command.critical_spare_parts is not None:
                    equipment.critical_spare_parts = command.critical_spare_parts or []
                if command.installation_date is not None:
                    equipment.installation_date = datetime.fromisoformat(command.installation_date.replace('Z', '+00:00')) if command.installation_date else None
                if command.last_maintenance_date is not None:
                    equipment.last_maintenance_date = datetime.fromisoformat(command.last_maintenance_date.replace('Z', '+00:00')) if command.last_maintenance_date else None
                if command.location is not None:
                    equipment.location = command.location
                if command.maintenance_history is not None:
                    equipment.maintenance_history = command.maintenance_history or []
                if command.maintenance_interval_hours is not None:
                    equipment.maintenance_interval_hours = command.maintenance_interval_hours
                if command.manufacturer is not None:
                    equipment.manufacturer = command.manufacturer
                if command.model is not None:
                    equipment.model = command.model
                if command.name is not None:
                    equipment.name = command.name
                if command.next_maintenance_date is not None:
                    equipment.next_maintenance_date = datetime.fromisoformat(command.next_maintenance_date.replace('Z', '+00:00')) if command.next_maintenance_date else None
                if command.operating_hours is not None:
                    equipment.operating_hours = command.operating_hours
                if command.operating_instructions is not None:
                    equipment.operating_instructions = command.operating_instructions
                if command.safety_guidelines is not None:
                    equipment.safety_guidelines = command.safety_guidelines or []
                if command.serial_number is not None:
                    equipment.serial_number = command.serial_number
                if command.specifications is not None:
                    equipment.specifications = command.specifications or []
                if command.status is not None:
                    equipment.status = command.status
                if command.tags is not None:
                    equipment.tags = command.tags or []
                if command.updated_by_id is not None:
                    equipment.updated_by_id = uuid.UUID(command.updated_by_id) if command.updated_by_id else None
                if command.warranty_expiry is not None:
                    equipment.warranty_expiry = datetime.fromisoformat(command.warranty_expiry.replace('Z', '+00:00')) if command.warranty_expiry else None
                
                equipment.updatedAt = datetime.utcnow()
                repo.update(equipment)
                uow.commit()
                
                return Result.success(equipment)
                
        except Exception as e:
            return Result.failure(f"Failed to update equipment: {str(e)}")
