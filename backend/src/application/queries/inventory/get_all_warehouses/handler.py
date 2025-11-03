from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import WarehouseRepository
from ....domain.entities.inventory_entity import Warehouse
from .query import GetAllWarehousesQuery

class GetAllWarehousesHandler(RequestHandlerBase[GetAllWarehousesQuery, Result[PagedResult[Warehouse]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllWarehousesQuery) -> Result[PagedResult[Warehouse]]:
        try:
            with self._unit_of_work as uow:
                repo = WarehouseRepository(uow.session)
                import uuid
                
                filters = [Warehouse.tenant_id == uuid.UUID(query.tenant_id)] if query.tenant_id else []
                
                base_query = repo._session.query(Warehouse)
                if filters:
                    base_query = base_query.filter(and_(*filters))
                
                total = base_query.count()
                
                sort_column = Warehouse.createdAt if hasattr(Warehouse, 'createdAt') else Warehouse.id
                
                order_func = desc if query.sort_order == "desc" else asc
                entities = base_query.order_by(order_func(sort_column)).offset(query.skip).limit(query.page_size).all()
                
                return Result.success(PagedResult(
                    items=entities,
                    page=query.page,
                    page_size=query.page_size,
                    total_count=total
                ))
        except Exception as e:
            return Result.failure(f"Failed to get warehouses: {str(e)}")

