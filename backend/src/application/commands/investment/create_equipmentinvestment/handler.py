from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EquipmentInvestmentRepository
from ....domain.entities.investment_entity import EquipmentInvestment
from .command import CreateEquipmentInvestmentCommand

class CreateEquipmentInvestmentHandler(RequestHandlerBase[CreateEquipmentInvestmentCommand, Result[EquipmentInvestment]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateEquipmentInvestmentCommand) -> Result[EquipmentInvestment]:
        try:
            with self._unit_of_work as uow:
                repo = EquipmentInvestmentRepository(uow.session)
                
                equipmentinvestment = EquipmentInvestment(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    attachments=command.attachments or [],
                    condition=command.condition,
                    created_by=uuid.UUID(command.created_by),
                    depreciation_method=command.depreciation_method,
                    equipment_name=command.equipment_name,
                    equipment_type=command.equipment_type,
                    estimated_life_years=command.estimated_life_years,
                    investment_id=uuid.UUID(command.investment_id),
                    location=command.location,
                    manufacturer=command.manufacturer,
                    model_number=command.model_number,
                    notes=command.notes,
                    purchase_date=datetime.fromisoformat(command.purchase_date.replace('Z', '+00:00')) if command.purchase_date else datetime.utcnow(),
                    purchase_price=command.purchase_price,
                    serial_number=command.serial_number,
                    warranty_expiry=datetime.fromisoformat(command.warranty_expiry.replace('Z', '+00:00')) if command.warranty_expiry else None,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(equipmentinvestment)
                uow.commit()
                return Result.success(equipmentinvestment)
                
        except Exception as e:
            return Result.failure(f"Failed to create equipmentinvestment: {str(e)}")
