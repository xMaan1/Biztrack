from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductRepository
from ....domain.entities.inventory_entity import Product
from .command import CreateProductCommand

class CreateProductHandler(RequestHandlerBase[CreateProductCommand, Result[Product]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateProductCommand) -> Result[Product]:
        try:
            with self._unit_of_work as uow:
                product_repo = ProductRepository(uow.session)
                
                existing_product = product_repo.get_by_sku(command.sku, command.tenant_id)
                if existing_product:
                    return Result.failure("Product with this SKU already exists")
                
                product_entity = Product(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    name=command.name,
                    sku=command.sku,
                    description=command.description,
                    category=command.category,
                    unit=command.unit,
                    costPrice=command.costPrice,
                    sellingPrice=command.sellingPrice,
                    stockQuantity=command.stockQuantity,
                    minStockLevel=command.minStockLevel,
                    maxStockLevel=command.maxStockLevel,
                    warehouseId=uuid.UUID(command.warehouseId) if command.warehouseId else None,
                    isActive=command.isActive,
                    tags=command.tags or [],
                    createdBy=uuid.UUID(command.created_by) if command.created_by else None,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                product_repo.add(product_entity)
                uow.commit()
                return Result.success(product_entity)
                
        except Exception as e:
            return Result.failure(f"Failed to create product: {str(e)}")

