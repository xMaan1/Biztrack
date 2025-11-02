from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProjectRepository
from ....domain.entities.project_entity import Project
from .query import GetProjectByIdQuery

class GetProjectByIdHandler(RequestHandlerBase[GetProjectByIdQuery, Result[Optional[Project]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetProjectByIdQuery) -> Result[Optional[Project]]:
        try:
            with self._unit_of_work as uow:
                project_repo = ProjectRepository(uow.session)
                project = project_repo.get_by_id(query.project_id, query.tenant_id)
                return Result.success(project)
        except Exception as e:
            return Result.failure(f"Failed to get project: {str(e)}")

