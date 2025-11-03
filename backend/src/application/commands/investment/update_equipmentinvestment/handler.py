from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EquipmentInvestmentRepository
from ....domain.entities.investment_entity import EquipmentInvestment
from .command import UpdateEquipmentInvestmentCommand

class UpdateEquipmentInvestmentHandler(RequestHandlerBase[UpdateEquipmentInvestmentCommand, Result[EquipmentInvestment]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateEquipmentInvestmentCommand) -> Result[EquipmentInvestment]:
        try:
            with self._unit_of_work as uow:
                repo = EquipmentInvestmentRepository(uow.session)
                
                equipmentinvestment = repo.get_by_id(command.equipmentinvestment_id, command.tenant_id)
                if not equipmentinvestment:
                    return Result.failure("EquipmentInvestment not found")
                
                                if command.attachments is not None:
                    equipmentinvestment.attachments = command.attachments or []
                if command.condition is not None:
                    equipmentinvestment.condition = command.condition
                if command.created_by is not None:
                    equipmentinvestment.created_by = uuid.UUID(command.created_by) if command.created_by else None
                if command.depreciation_method is not None:
                    equipmentinvestment.depreciation_method = command.depreciation_method
                if command.equipment_name is not None:
                    equipmentinvestment.equipment_name = command.equipment_name
                if command.equipment_type is not None:
                    equipmentinvestment.equipment_type = command.equipment_type
                if command.estimated_life_years is not None:
                    equipmentinvestment.estimated_life_years = command.estimated_life_years
                if command.investment_id is not None:
                    equipmentinvestment.investment_id = uuid.UUID(command.investment_id) if command.investment_id else None
                if command.location is not None:
                    equipmentinvestment.location = command.location
                if command.manufacturer is not None:
                    equipmentinvestment.manufacturer = command.manufacturer
                if command.model_number is not None:
                    equipmentinvestment.model_number = command.model_number
                if command.notes is not None:
                    equipmentinvestment.notes = command.notes
                if command.purchase_date is not None:
                    equipmentinvestment.purchase_date = datetime.fromisoformat(command.purchase_date.replace('Z', '+00:00')) if command.purchase_date else None
                if command.purchase_price is not None:
                    equipmentinvestment.purchase_price = command.purchase_price
                if command.serial_number is not None:
                    equipmentinvestment.serial_number = command.serial_number
                if command.warranty_expiry is not None:
                    equipmentinvestment.warranty_expiry = datetime.fromisoformat(command.warranty_expiry.replace('Z', '+00:00')) if command.warranty_expiry else None
                
                equipmentinvestment.updatedAt = datetime.utcnow()
                repo.update(equipmentinvestment)
                uow.commit()
                
                return Result.success(equipmentinvestment)
                
        except Exception as e:
            return Result.failure(f"Failed to update equipmentinvestment: {str(e)}")
