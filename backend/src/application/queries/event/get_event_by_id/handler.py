from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EventRepository
from ....domain.entities.event_entity import Event
from .query import GetEventByIdQuery

class GetEventByIdHandler(RequestHandlerBase[GetEventByIdQuery, Result[Optional[Event]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetEventByIdQuery) -> Result[Optional[Event]]:
        try:
            with self._unit_of_work as uow:
                repo = EventRepository(uow.session)
                entity = repo.get_by_id(query.event_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get event: {str(e)}")
