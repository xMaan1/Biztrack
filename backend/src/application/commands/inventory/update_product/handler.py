from datetime import datetime
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductRepository
from ....domain.entities.inventory_entity import Product
from .command import UpdateProductCommand

class UpdateProductHandler(RequestHandlerBase[UpdateProductCommand, Result[Product]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateProductCommand) -> Result[Product]:
        try:
            with self._unit_of_work as uow:
                product_repo = ProductRepository(uow.session)
                
                product = product_repo.get_by_id(command.product_id, command.tenant_id)
                if not product:
                    return Result.failure("Product not found")
                
                if command.sku and command.sku != product.sku:
                    existing_product = product_repo.get_by_sku(command.sku, command.tenant_id)
                    if existing_product and str(existing_product.id) != command.product_id:
                        return Result.failure("Product with this SKU already exists")
                    product.sku = command.sku
                
                if command.name is not None:
                    product.name = command.name
                if command.description is not None:
                    product.description = command.description
                if command.category is not None:
                    product.category = command.category
                if command.unit is not None:
                    product.unit = command.unit
                if command.costPrice is not None:
                    product.costPrice = command.costPrice
                if command.sellingPrice is not None:
                    product.sellingPrice = command.sellingPrice
                if command.stockQuantity is not None:
                    product.stockQuantity = command.stockQuantity
                if command.minStockLevel is not None:
                    product.minStockLevel = command.minStockLevel
                if command.maxStockLevel is not None:
                    product.maxStockLevel = command.maxStockLevel
                if command.warehouseId is not None:
                    import uuid
                    product.warehouseId = uuid.UUID(command.warehouseId) if command.warehouseId else None
                if command.isActive is not None:
                    product.isActive = command.isActive
                if command.tags is not None:
                    product.tags = command.tags
                
                product.updatedAt = datetime.utcnow()
                product_repo.update(product)
                uow.commit()
                
                return Result.success(product)
                
        except Exception as e:
            return Result.failure(f"Failed to update product: {str(e)}")

