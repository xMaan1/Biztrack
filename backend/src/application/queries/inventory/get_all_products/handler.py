from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductRepository
from ....domain.entities.inventory_entity import Product
from .query import GetAllProductsQuery

class GetAllProductsHandler(RequestHandlerBase[GetAllProductsQuery, Result[PagedResult[Product]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllProductsQuery) -> Result[PagedResult[Product]]:
        try:
            with self._unit_of_work as uow:
                repo = ProductRepository(uow.session)
                import uuid
                
                filters = [Product.tenant_id == uuid.UUID(query.tenant_id)] if query.tenant_id else []
                
                base_query = repo._session.query(Product)
                if filters:
                    base_query = base_query.filter(and_(*filters))
                
                total = base_query.count()
                
                sort_column = Product.createdAt if hasattr(Product, 'createdAt') else Product.id
                
                order_func = desc if query.sort_order == "desc" else asc
                entities = base_query.order_by(order_func(sort_column)).offset(query.skip).limit(query.page_size).all()
                
                return Result.success(PagedResult(
                    items=entities,
                    page=query.page,
                    page_size=query.page_size,
                    total_count=total
                ))
        except Exception as e:
            return Result.failure(f"Failed to get products: {str(e)}")

