from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductRepository
from ....domain.entities.inventory_entity import Product
from .query import GetProductByIdQuery

class GetProductByIdHandler(RequestHandlerBase[GetProductByIdQuery, Result[Optional[Product]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetProductByIdQuery) -> Result[Optional[Product]]:
        try:
            with self._unit_of_work as uow:
                repo = ProductRepository(uow.session)
                entity = repo.get_by_id(query.product_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get product: {str(e)}")

