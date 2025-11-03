from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PurchaseOrderRepository
from ....domain.entities.inventory_entity import PurchaseOrder
from .query import GetAllPurchaseOrdersQuery

class GetAllPurchaseOrdersHandler(RequestHandlerBase[GetAllPurchaseOrdersQuery, Result[PagedResult[PurchaseOrder]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllPurchaseOrdersQuery) -> Result[PagedResult[PurchaseOrder]]:
        try:
            with self._unit_of_work as uow:
                repo = PurchaseOrderRepository(uow.session)
                import uuid
                
                filters = [PurchaseOrder.tenant_id == uuid.UUID(query.tenant_id)]
                
                base_query = repo._session.query(PurchaseOrder).filter(and_(*filters))
                total = base_query.count()
                
                sort_column = PurchaseOrder.createdAt if hasattr(PurchaseOrder, 'createdAt') else PurchaseOrder.id
                
                order_func = desc if query.sort_order == "desc" else asc
                entities = base_query.order_by(order_func(sort_column)).offset(query.skip).limit(query.page_size).all()
                
                return Result.success(PagedResult(
                    items=entities,
                    total=total,
                    page=query.page,
                    page_size=query.page_size
                ))
        except Exception as e:
            return Result.failure(f"Failed to get purchaseorders: {str(e)}")
