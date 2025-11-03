from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EquipmentRepository
from ....domain.entities.maintenance_entity import Equipment
from .command import CreateEquipmentCommand

class CreateEquipmentHandler(RequestHandlerBase[CreateEquipmentCommand, Result[Equipment]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateEquipmentCommand) -> Result[Equipment]:
        try:
            with self._unit_of_work as uow:
                repo = EquipmentRepository(uow.session)
                
                equipment = Equipment(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    assigned_technicians=command.assigned_technicians or [],
                    category=command.category,
                    created_by_id=uuid.UUID(command.created_by_id),
                    critical_spare_parts=command.critical_spare_parts or [],
                    installation_date=datetime.fromisoformat(command.installation_date.replace('Z', '+00:00')) if command.installation_date else datetime.utcnow(),
                    last_maintenance_date=datetime.fromisoformat(command.last_maintenance_date.replace('Z', '+00:00')) if command.last_maintenance_date else datetime.utcnow(),
                    location=command.location,
                    maintenance_history=command.maintenance_history or [],
                    maintenance_interval_hours=command.maintenance_interval_hours,
                    manufacturer=command.manufacturer,
                    model=command.model,
                    name=command.name,
                    next_maintenance_date=datetime.fromisoformat(command.next_maintenance_date.replace('Z', '+00:00')) if command.next_maintenance_date else datetime.utcnow(),
                    operating_hours=command.operating_hours,
                    operating_instructions=command.operating_instructions,
                    safety_guidelines=command.safety_guidelines or [],
                    serial_number=command.serial_number,
                    specifications=command.specifications or [],
                    status=command.status,
                    tags=command.tags or [],
                    updated_by_id=uuid.UUID(command.updated_by_id),
                    warranty_expiry=datetime.fromisoformat(command.warranty_expiry.replace('Z', '+00:00')) if command.warranty_expiry else datetime.utcnow(),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(equipment)
                uow.commit()
                return Result.success(equipment)
                
        except Exception as e:
            return Result.failure(f"Failed to create equipment: {str(e)}")
