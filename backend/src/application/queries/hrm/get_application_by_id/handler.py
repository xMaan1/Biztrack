from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ApplicationRepository
from ....domain.entities.hrm_entity import Application
from .query import GetApplicationByIdQuery

class GetApplicationByIdHandler(RequestHandlerBase[GetApplicationByIdQuery, Result[Optional[Application]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetApplicationByIdQuery) -> Result[Optional[Application]]:
        try:
            with self._unit_of_work as uow:
                repo = ApplicationRepository(uow.session)
                entity = repo.get_by_id(query.application_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get application: {str(e)}")
