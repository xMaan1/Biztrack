from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import MaintenanceScheduleRepository
from ....domain.entities.maintenance_entity import MaintenanceSchedule
from .query import GetAllMaintenanceSchedulesQuery

class GetAllMaintenanceSchedulesHandler(RequestHandlerBase[GetAllMaintenanceSchedulesQuery, Result[PagedResult[MaintenanceSchedule]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllMaintenanceSchedulesQuery) -> Result[PagedResult[MaintenanceSchedule]]:
        try:
            with self._unit_of_work as uow:
                repo = MaintenanceScheduleRepository(uow.session)
                import uuid
                
                filters = [MaintenanceSchedule.tenant_id == uuid.UUID(query.tenant_id)]
                
                base_query = repo._session.query(MaintenanceSchedule).filter(and_(*filters))
                total = base_query.count()
                
                sort_column = MaintenanceSchedule.createdAt if hasattr(MaintenanceSchedule, 'createdAt') else MaintenanceSchedule.id
                
                order_func = desc if query.sort_order == "desc" else asc
                entities = base_query.order_by(order_func(sort_column)).offset(query.skip).limit(query.page_size).all()
                
                return Result.success(PagedResult(
                    items=entities,
                    total=total,
                    page=query.page,
                    page_size=query.page_size
                ))
        except Exception as e:
            return Result.failure(f"Failed to get maintenanceschedules: {str(e)}")
