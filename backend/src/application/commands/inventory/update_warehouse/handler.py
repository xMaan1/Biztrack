from datetime import datetime
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import WarehouseRepository
from ....domain.entities.inventory_entity import Warehouse
from .command import UpdateWarehouseCommand

class UpdateWarehouseHandler(RequestHandlerBase[UpdateWarehouseCommand, Result[Warehouse]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateWarehouseCommand) -> Result[Warehouse]:
        try:
            with self._unit_of_work as uow:
                warehouse_repo = WarehouseRepository(uow.session)
                
                warehouse = warehouse_repo.get_by_id(command.warehouse_id, command.tenant_id)
                if not warehouse:
                    return Result.failure("Warehouse not found")
                
                if command.code and command.code != warehouse.code:
                    existing_warehouse = warehouse_repo.get_by_code(command.code, command.tenant_id)
                    if existing_warehouse and str(existing_warehouse.id) != command.warehouse_id:
                        return Result.failure("Warehouse with this code already exists")
                    warehouse.code = command.code
                
                if command.name is not None:
                    warehouse.name = command.name
                if command.description is not None:
                    warehouse.description = command.description
                if command.address is not None:
                    warehouse.address = command.address
                if command.city is not None:
                    warehouse.city = command.city
                if command.state is not None:
                    warehouse.state = command.state
                if command.country is not None:
                    warehouse.country = command.country
                if command.postalCode is not None:
                    warehouse.postalCode = command.postalCode
                if command.phone is not None:
                    warehouse.phone = command.phone
                if command.isActive is not None:
                    warehouse.isActive = command.isActive
                
                warehouse.updatedAt = datetime.utcnow()
                warehouse_repo.update(warehouse)
                uow.commit()
                
                return Result.success(warehouse)
                
        except Exception as e:
            return Result.failure(f"Failed to update warehouse: {str(e)}")

