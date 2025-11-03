from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import WarehouseRepository
from ....domain.entities.inventory_entity import Warehouse
from .command import CreateWarehouseCommand

class CreateWarehouseHandler(RequestHandlerBase[CreateWarehouseCommand, Result[Warehouse]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateWarehouseCommand) -> Result[Warehouse]:
        try:
            with self._unit_of_work as uow:
                warehouse_repo = WarehouseRepository(uow.session)
                
                existing_warehouse = warehouse_repo.get_by_code(command.code, command.tenant_id)
                if existing_warehouse:
                    return Result.failure("Warehouse with this code already exists")
                
                warehouse_entity = Warehouse(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    name=command.name,
                    code=command.code,
                    description=command.description,
                    address=command.address,
                    city=command.city,
                    state=command.state,
                    country=command.country,
                    postalCode=command.postalCode,
                    phone=command.phone,
                    isActive=command.isActive,
                    createdBy=uuid.UUID(command.created_by) if command.created_by else None,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                warehouse_repo.add(warehouse_entity)
                uow.commit()
                return Result.success(warehouse_entity)
                
        except Exception as e:
            return Result.failure(f"Failed to create warehouse: {str(e)}")

